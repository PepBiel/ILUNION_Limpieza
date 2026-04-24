import React, { useEffect, useMemo, useState } from "react";
import { COVERAGE_CATEGORIES } from "../lib/constants";
import { countAssigned, requiredFor } from "../lib/coverage";
import { dayLetter, dayKeyForDate, daysInMonth, isHoliday, isWeekend } from "../lib/date";
import { formatPercent, formatPresenceCategoryLabel } from "../lib/format";
import { readStoredValue, writeStoredValue } from "../lib/storage";
import { Card, MetricCard } from "../components/ui";
import { MonthPicker } from "../components/MonthPicker";

function CoverageCell({ assigned, required }) {
  if (!assigned && !required) {
    return (
      <td className="schedule-row-cell" style={{ background: "#fafcfe" }} />
    );
  }

  let background = "var(--color-green-soft)";
  let color = "var(--color-green-strong)";

  if (assigned < required) {
    background = "var(--color-red-soft)";
    color = "var(--color-red)";
  } else if (assigned === required) {
    background = "#eef5e9";
  }

  return (
    <td className="schedule-row-cell" style={{ background, color, textAlign: "center" }}>
      <div className="mono" style={{ fontWeight: 800 }}>
        {assigned}
      </div>
      <div className="mono" style={{ fontSize: 9.5, opacity: 0.7 }}>
        /{required}
      </div>
    </td>
  );
}

export function CoverageView({ hospitalData, hospitalKey, presences, edits }) {
  const year = 2026;
  const [monthIndex, setMonthIndex] = useState(() => {
    const stored = Number(readStoredValue("fl-coverage-month", "0"));
    return Number.isInteger(stored) && stored >= 0 && stored < 12 ? stored : 0;
  });

  useEffect(() => {
    writeStoredValue("fl-coverage-month", String(monthIndex));
  }, [monthIndex]);

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) => index + 1),
    [monthIndex],
  );

  const matrix = useMemo(() => {
    let totalAssigned = 0;
    let totalRequired = 0;
    let deficitCells = 0;

    const rows = COVERAGE_CATEGORIES.map((category) => {
      const daily = days.map((day) => {
        const dayKey = dayKeyForDate(year, monthIndex, day);
        const required = requiredFor(presences, hospitalKey, dayKey, category);
        const assigned = countAssigned(
          hospitalData,
          edits,
          year,
          monthIndex,
          day,
          category,
        );

        totalAssigned += assigned;
        totalRequired += required;
        if (assigned < required) {
          deficitCells += 1;
        }

        return { assigned, required };
      });

      return {
        category,
        label: formatPresenceCategoryLabel(category),
        daily,
      };
    });

    return {
      rows,
      totalAssigned,
      totalRequired,
      deficitCells,
      coveragePercent: totalRequired ? (totalAssigned / totalRequired) * 100 : 100,
    };
  }, [days, edits, hospitalData, hospitalKey, monthIndex, presences]);

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Cobertura diaria</h1>
          <p>
            Comparativa entre asignacion real y minimo requerido segun
            PRESENCIAS.xlsx.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <MonthPicker year={year} monthIndex={monthIndex} onChange={setMonthIndex} />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <MetricCard
          label="Turnos asignados"
          value={matrix.totalAssigned}
          detail={`sobre ${matrix.totalRequired} requeridos`}
          tone="green"
        />
        <MetricCard
          label="Celdas en deficit"
          value={matrix.deficitCells}
          detail="categoria-dia por debajo del minimo"
          tone={matrix.deficitCells === 0 ? "green" : "red"}
        />
        <MetricCard
          label="Cobertura mensual"
          value={formatPercent(matrix.coveragePercent)}
          detail="respecto al minimo operativo"
          tone="blue"
        />
        <MetricCard
          label="Edicion manual"
          value={Object.keys(edits).length}
          detail="cambios aplicados sobre el cuadrante base"
          tone="amber"
        />
      </div>

      <div className="legend" style={{ marginBottom: 12 }}>
        <strong>Leyenda</strong>
        <div className="legend-chip">
          <span style={{ background: "var(--color-red-soft)" }} />
          Bajo minimo
        </div>
        <div className="legend-chip">
          <span style={{ background: "#eef5e9" }} />
          Justo al minimo
        </div>
        <div className="legend-chip">
          <span style={{ background: "var(--color-green-soft)" }} />
          Por encima del minimo
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <div className="table-shell">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="sticky-column" style={{ minWidth: 210 }}>
                  Categoria · turno
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className={`schedule-day ${isWeekend(year, monthIndex, day) ? "weekend" : ""} ${isHoliday(year, monthIndex, day) ? "holiday" : ""}`.trim()}
                  >
                    <div style={{ fontSize: 9.5, opacity: 0.7 }}>
                      {dayLetter(year, monthIndex, day)}
                    </div>
                    <div className="mono">{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.category}>
                  <td className="sticky-column">
                    <div className="worker-name">{row.label}</div>
                  </td>
                  {row.daily.map((cell, index) => (
                    <CoverageCell
                      key={`${row.category}-${index + 1}`}
                      assigned={cell.assigned}
                      required={cell.required}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p style={{ marginTop: 12, color: "var(--color-ink-soft)", fontSize: 12.5 }}>
        Esta vista usa los minimos reales del Excel de PRESENCIAS y refleja en
        tiempo real cualquier cambio realizado desde el cuadrante.
      </p>
    </>
  );
}
