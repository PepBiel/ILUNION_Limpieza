from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any, Dict


FRONT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = Path(__file__).resolve().parent
NOTEBOOK_PATH = BACKEND_ROOT / "assets" / "algorithm" / "ilunion.ipynb"
DEFAULT_WORKERS_FILE = BACKEND_ROOT / "assets" / "inputs" / "Listado de Trabajadores.xlsx"
DEFAULT_PRESENCES_FILE = BACKEND_ROOT / "assets" / "inputs" / "PRESENCIAS.xlsx"
DEFAULT_DASHBOARD_JSON = FRONT_ROOT / "public" / "data" / "dashboard-data.json"
DEFAULT_OUTPUT_DIR = FRONT_ROOT / "generated"


def load_notebook_namespace() -> Dict[str, Any]:
    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
    source = "".join(notebook["cells"][0]["source"])
    cleaned_lines = [
        line
        for line in source.splitlines()
        if not line.lstrip().startswith("!")
    ]
    cleaned_source = "\n".join(cleaned_lines)
    cleaned_source = cleaned_source.split("\nconfig = Config(", 1)[0]

    namespace: Dict[str, Any] = {}
    exec(cleaned_source, namespace)
    return namespace


def capitalize_day_key(value: str) -> str:
    mapping = {
        "LUNES": "Lunes",
        "MARTES": "Martes",
        "MIERCOLES": "Miercoles",
        "JUEVES": "Jueves",
        "VIERNES": "Viernes",
        "SABADO": "Sabado",
        "DOMINGO": "Domingo",
        "FESTIVOS": "Festivos",
    }
    return mapping.get(str(value).upper(), str(value).title())


def date_to_string(value: Any) -> str:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def build_presence_payload(load_demands, presences_file: Path) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}

    for hospital_key in ("clinico", "gil"):
        hospital_name = "CLINICO" if hospital_key == "clinico" else "GIL"
        demands = load_demands(presences_file, hospital_name)
        hospital_payload: Dict[str, Any] = {}

        for day_name, day_demands in demands.items():
            hospital_payload[capitalize_day_key(day_name)] = {
                "LIMPIADOR T.M": int(day_demands.get(("LIMPIADOR", "M"), 0)),
                "LIMPIADOR T.T": int(day_demands.get(("LIMPIADOR", "T"), 0)),
                "LIMPIADOR T.N": int(day_demands.get(("LIMPIADOR", "N"), 0)),
                "PEON T.M": int(day_demands.get(("PEON", "M"), 0)),
                "PEON T.T": int(day_demands.get(("PEON", "T"), 0)),
            }

        payload[hospital_key] = hospital_payload

    return payload


def build_worker_payload(workers_df) -> list[dict[str, Any]]:
    records = []
    for _, row in workers_df.iterrows():
        records.append(
            {
                "name": str(row["TRABAJADOR"]).strip(),
                "centro": str(row["CENTRO"]).strip(),
                "turnoBase": str(row["TURNO"]).strip(),
                "puesto": str(row["PUESTO"]).strip(),
                "categoria": str(row["categoria"]).strip(),
                "horasAño": float(row["annual_hours"]),
                "observaciones": str(row.get("observaciones", "") or "").strip(),
                "plazas": str(row.get("PLAZAS", "") or "").strip(),
            }
        )
    return records


def build_monthly_schedule_payload(monthly_schedules) -> Dict[str, Dict[str, list[str]]]:
    payload: Dict[str, Dict[str, list[str]]] = {}

    for month, schedule_df in monthly_schedules.items():
        date_columns = [
            column
            for column in schedule_df.columns
            if isinstance(column, str)
            and len(column) == 10
            and column[4] == "-"
            and column[7] == "-"
        ]

        for _, row in schedule_df.iterrows():
            worker_name = str(row["TRABAJADOR"]).strip()
            payload.setdefault(worker_name, {})
            payload[worker_name][str(month)] = [
                str(row[column]).strip() for column in date_columns
            ]

    return payload


def build_coverage_payload(coverage_df) -> list[dict[str, Any]]:
    records = []
    for _, row in coverage_df.iterrows():
        records.append(
            {
                "mes": int(row["MES"]),
                "fecha": date_to_string(row["fecha"]),
                "tipoDia": capitalize_day_key(str(row["tipo_dia"])),
                "categoria": str(row["categoria"]),
                "turno": str(row["turno"]),
                "necesario": int(row["necesario"]),
                "asignado": int(row["asignado"]),
                "desviacion": int(row["desviacion"]),
                "cumple": bool(row["cumple"]),
            }
        )
    return records


def build_annual_hours_payload(annual_hours_df) -> Dict[str, dict[str, Any]]:
    payload: Dict[str, dict[str, Any]] = {}
    for _, row in annual_hours_df.iterrows():
        worker_name = str(row["TRABAJADOR"]).strip()
        payload[worker_name] = {
            "asignadas": float(row["HORAS_ASIGNADAS_AÑO"]),
            "objetivo": float(row["HORAS_OBJETIVO_AÑO"]),
            "desviacion": float(row["DESVIACION_AÑO"]),
        }
    return payload


def build_monthly_hours_payload(monthly_hours_df) -> Dict[str, Dict[str, dict[str, Any]]]:
    payload: Dict[str, Dict[str, dict[str, Any]]] = {}

    for _, row in monthly_hours_df.iterrows():
        worker_name = str(row["TRABAJADOR"]).strip()
        month = str(int(row["MES"]))
        payload.setdefault(worker_name, {})
        payload[worker_name][month] = {
            "objetivo": float(row["HORAS_OBJETIVO_MES"]),
            "asignadas": float(row["HORAS_ASIGNADAS_MES"]),
            "desviacion": float(row["DESVIACION_HORAS"]),
            "turnos": int(row["TURNOS_TRABAJADOS"]),
            "descansos": int(row["DESCANSOS"]),
        }

    return payload


def build_summary_payload(config, annual_hours_df, coverage_df) -> Dict[str, Any]:
    return {
        "hospital": str(config.hospital),
        "año": int(config.year),
        "regla_verano": "minimo 10 descansos en junio/julio/agosto",
        "faltas_cobertura_totales": int((~coverage_df["cumple"]).sum()),
        "desviacion_media_anual_horas": float(annual_hours_df["DESVIACION_AÑO"].mean()),
    }


def run_pipeline(
    namespace,
    *,
    hospital: str,
    year: int,
    workers_file: Path,
    presences_file: Path,
    output_file: Path,
):
    Config = namespace["Config"]
    load_workers = namespace["load_workers"]
    load_demands = namespace["load_demands"]
    load_holidays = namespace["load_holidays"]
    load_fixed_assignments = namespace["load_fixed_assignments"]
    MonthlySolver = namespace["MonthlySolver"]
    build_coverage = namespace["build_coverage"]
    build_month_hours = namespace["build_month_hours"]
    write_annual_workbook = namespace["write_annual_workbook"]
    np = namespace["np"]
    pd = namespace["pd"]
    calendar = namespace["calendar"]
    dt_module = namespace["dt"]

    config = Config(
        hospital=hospital.upper(),
        year=year,
        workers_file=workers_file,
        presences_file=presences_file,
        output_file=output_file,
        holidays_file=None,
        fixed_assignments_file=None,
        time_limit_per_month=30,
    )

    workers = load_workers(config.workers_file, config.hospital)
    demands = load_demands(config.presences_file, config.hospital)
    holidays = load_holidays(config.holidays_file)
    fixed_assignments = load_fixed_assignments(config.fixed_assignments_file)

    annual_remaining = {
        int(index): float(value)
        for index, value in workers["annual_hours"].items()
    }
    previous_last_code = {int(index): None for index in workers.index}

    monthly_schedules = {}
    coverage_list = []
    month_hours_list = []
    solve_log_rows = []

    for month in range(1, 13):
        dates = [
            dt_module.date(config.year, month, day)
            for day in range(1, calendar.monthrange(config.year, month)[1] + 1)
        ]
        target_hours_by_worker = {
            worker_index: annual_remaining[worker_index] / (13 - month)
            for worker_index in workers.index
        }

        solver = MonthlySolver(
            workers=workers,
            dates=dates,
            demands=demands,
            holidays=holidays,
            fixed_assignments=fixed_assignments,
            config=config,
            annual_hours_remaining=annual_remaining,
            months_remaining_including_current=(13 - month),
            previous_last_code=previous_last_code,
        )
        schedule, result = solver.solve()

        coverage = build_coverage(schedule, demands, holidays, dates)
        month_hours = build_month_hours(schedule, target_hours_by_worker, dates)

        for worker_index, worker_name in enumerate(workers["TRABAJADOR"]):
            assigned = float(
                month_hours.loc[
                    month_hours["TRABAJADOR"] == worker_name,
                    "HORAS_ASIGNADAS_MES",
                ].iloc[0]
            )
            annual_remaining[worker_index] = max(
                0.0,
                annual_remaining[worker_index] - assigned,
            )
            previous_last_code[worker_index] = schedule.iloc[worker_index][
                dates[-1].isoformat()
            ]

        schedule = schedule.drop(columns=["WORKER_IDX"])
        schedule.insert(0, "MES", month)
        coverage.insert(0, "MES", month)
        month_hours.insert(0, "MES", month)

        monthly_schedules[month] = schedule
        coverage_list.append(coverage)
        month_hours_list.append(month_hours)
        solve_log_rows.append(
            {
                "MES": month,
                "solver_status": getattr(result, "status", None),
                "solver_message": getattr(result, "message", None),
                "objective": float(getattr(result, "fun", np.nan)),
                "faltas_cobertura": int((~coverage["cumple"]).sum()),
                "desviacion_media_horas": float(
                    month_hours["DESVIACION_HORAS"].mean()
                ),
            }
        )

    coverage_all = pd.concat(coverage_list, ignore_index=True)
    monthly_hours_all = pd.concat(month_hours_list, ignore_index=True)
    annual_hours = (
        monthly_hours_all.groupby("TRABAJADOR", as_index=False)
        .agg(
            CATEGORIA=("CATEGORIA", "first"),
            HORAS_ASIGNADAS_AÑO=("HORAS_ASIGNADAS_MES", "sum"),
            DESCANSOS_AÑO=("DESCANSOS", "sum"),
        )
        .merge(
            workers[["TRABAJADOR", "annual_hours"]].rename(
                columns={"annual_hours": "HORAS_OBJETIVO_AÑO"}
            ),
            on="TRABAJADOR",
            how="left",
        )
    )
    annual_hours["DESVIACION_AÑO"] = (
        annual_hours["HORAS_ASIGNADAS_AÑO"] - annual_hours["HORAS_OBJETIVO_AÑO"]
    )
    solve_log = pd.DataFrame(solve_log_rows)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    write_annual_workbook(
        monthly_schedules=monthly_schedules,
        coverage_all=coverage_all,
        monthly_hours_all=monthly_hours_all,
        annual_hours=annual_hours,
        solve_log=solve_log,
        config=config,
    )

    hospital_key = "clinico" if hospital.upper() == "CLINICO" else "gil"
    hospital_payload = {
        "workers": build_worker_payload(workers),
        "monthlySched": build_monthly_schedule_payload(monthly_schedules),
        "coverage": build_coverage_payload(coverage_all),
        "horasAnuales": build_annual_hours_payload(annual_hours),
        "horasMensuales": build_monthly_hours_payload(monthly_hours_all),
        "resumen": build_summary_payload(config, annual_hours, coverage_all),
    }

    return {
        "hospital_key": hospital_key,
        "hospital_payload": hospital_payload,
        "presencias": build_presence_payload(load_demands, presences_file),
        "excel_path": str(output_file),
    }


def merge_dashboard_json(target_path: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    if target_path.exists():
        dashboard_data = json.loads(target_path.read_text(encoding="utf-8"))
    else:
        dashboard_data = {
            "months": list(range(1, 13)),
            "presencias": {},
        }

    dashboard_data["months"] = list(range(1, 13))
    dashboard_data["presencias"] = payload["presencias"]
    dashboard_data[payload["hospital_key"]] = payload["hospital_payload"]
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(
        json.dumps(dashboard_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return dashboard_data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--hospital",
        required=True,
        choices=["clinico", "gil", "CLINICO", "GIL"],
    )
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--workers-file", default=str(DEFAULT_WORKERS_FILE))
    parser.add_argument("--presences-file", default=str(DEFAULT_PRESENCES_FILE))
    parser.add_argument("--dashboard-json", default=str(DEFAULT_DASHBOARD_JSON))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    namespace = load_notebook_namespace()

    hospital_key = str(args.hospital).lower()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    excel_output = output_dir / f"{hospital_key}_cuadrante_anual_{args.year}.xlsx"

    payload = run_pipeline(
        namespace,
        hospital=hospital_key,
        year=args.year,
        workers_file=Path(args.workers_file),
        presences_file=Path(args.presences_file),
        output_file=excel_output,
    )
    dashboard_data = merge_dashboard_json(Path(args.dashboard_json), payload)

    response = {
        "ok": True,
        "hospital": hospital_key,
        "year": args.year,
        "excelPath": str(excel_output),
        "excelFileName": excel_output.name,
        "summary": payload["hospital_payload"]["resumen"],
        "workers": len(payload["hospital_payload"]["workers"]),
        "dashboardKeys": sorted(dashboard_data.keys()),
        "generatedAt": dt.datetime.now().isoformat(),
    }
    print(json.dumps(response, ensure_ascii=False))


if __name__ == "__main__":
    main()
