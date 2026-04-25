from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any, Dict

from ilunion_engine import Config, load_demands, run


FRONT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = Path(__file__).resolve().parent
DEFAULT_WORKERS_FILE = BACKEND_ROOT / "assets" / "inputs" / "Listado de Trabajadores.xlsx"
DEFAULT_PRESENCES_FILE = BACKEND_ROOT / "assets" / "inputs" / "PRESENCIAS.xlsx"
DEFAULT_DASHBOARD_JSON = FRONT_ROOT / "public" / "data" / "dashboard-data.json"
DEFAULT_OUTPUT_DIR = FRONT_ROOT / "generated"


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


def build_presence_payload(presences_file: Path) -> Dict[str, Any]:
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
                "horasA\u00f1o": float(row["annual_hours"]),
                "observaciones": str(row.get("observaciones", "") or "").strip(),
                "plazas": str(row.get("PLAZAS", "") or "").strip(),
            }
        )
    return records


def build_monthly_schedule_payload(
    monthly_schedules,
) -> Dict[str, Dict[str, list[str]]]:
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
            "asignadas": float(row["HORAS_ASIGNADAS_A\u00d1O"]),
            "objetivo": float(row["HORAS_OBJETIVO_A\u00d1O"]),
            "desviacion": float(row["DESVIACION_A\u00d1O"]),
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


def build_summary_payload(config: Config, annual_hours_df, coverage_df) -> Dict[str, Any]:
    return {
        "hospital": str(config.hospital),
        "a\u00f1o": int(config.year),
        "regla_verano": "minimo 10 descansos en junio/julio/agosto",
        "faltas_cobertura_totales": int((~coverage_df["cumple"]).sum()),
        "desviacion_media_anual_horas": float(
            annual_hours_df["DESVIACION_A\u00d1O"].mean()
        ),
    }


def run_pipeline(
    *,
    hospital: str,
    year: int,
    workers_file: Path,
    presences_file: Path,
    output_file: Path,
) -> Dict[str, Any]:
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

    artifacts = run(config)
    hospital_key = "clinico" if hospital.upper() == "CLINICO" else "gil"
    hospital_payload = {
        "workers": build_worker_payload(artifacts.workers),
        "monthlySched": build_monthly_schedule_payload(artifacts.monthly_schedules),
        "coverage": build_coverage_payload(artifacts.coverage_all),
        "horasAnuales": build_annual_hours_payload(artifacts.annual_hours),
        "horasMensuales": build_monthly_hours_payload(artifacts.monthly_hours_all),
        "resumen": build_summary_payload(
            artifacts.config,
            artifacts.annual_hours,
            artifacts.coverage_all,
        ),
    }

    return {
        "hospital_key": hospital_key,
        "hospital_payload": hospital_payload,
        "presencias": build_presence_payload(presences_file),
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
    hospital_key = str(args.hospital).lower()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    excel_output = output_dir / f"{hospital_key}_cuadrante_anual_{args.year}.xlsx"

    payload = run_pipeline(
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
