import React, { useMemo, useState } from "react";
import { Card, SelectField } from "../components/ui";
import { compareNaturalText, formatDeviation } from "../lib/format";

function progressColor(deviation, percent) {
  if (deviation < -10) {
    return "var(--color-red)";
  }
  if (percent > 100) {
    return "#d98a00";
  }
  return "var(--color-primary)";
}

export function HoursView({ hospitalData }) {
  const [sortBy, setSortBy] = useState("name");

  const workers = useMemo(() => {
    const copy = [...hospitalData.workers];
    copy.sort((left, right) => {
      const leftHours = hospitalData.annualHours?.[left.name] ?? {};
      const rightHours = hospitalData.annualHours?.[right.name] ?? {};

      if (sortBy === "deviation") {
        return (leftHours.deviation || 0) - (rightHours.deviation || 0);
      }

      if (sortBy === "completion") {
        const leftPercent = leftHours.target
          ? (leftHours.assigned / leftHours.target) * 100
          : 0;
        const rightPercent = rightHours.target
          ? (rightHours.assigned / rightHours.target) * 100
          : 0;
        return rightPercent - leftPercent;
      }

      return compareNaturalText(left.name, right.name);
    });

    return copy;
  }, [hospitalData.annualHours, hospitalData.workers, sortBy]);

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Computo anual</h1>
          <p>
            Comparativa entre horas asignadas por el cuadrante y objetivo anual de
            cada trabajador.
          </p>
        </div>
        <SelectField
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "name", label: "Ordenar por nombre" },
            { value: "deviation", label: "Ordenar por desvio" },
            { value: "completion", label: "Ordenar por % cumplido" },
          ]}
        />
      </div>

      <Card style={{ padding: 0 }}>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th style={{ textAlign: "right" }}>Objetivo</th>
                <th>Progreso</th>
                <th style={{ textAlign: "right" }}>Asignadas</th>
                <th style={{ textAlign: "right" }}>Desvio</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => {
                const annualHours = hospitalData.annualHours?.[worker.name] ?? {
                  assigned: 0,
                  target: worker.annualHours,
                  deviation: 0,
                };
                const target = annualHours.target || worker.annualHours || 0;
                const percent = target ? (annualHours.assigned / target) * 100 : 0;
                const barColor = progressColor(annualHours.deviation, percent);

                return (
                  <tr key={worker.id}>
                    <td>
                      <div>
                        <div className="worker-name">{worker.name}</div>
                        <div className="worker-meta">{worker.categoria}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }} className="mono">
                      {target}h
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                      <div
                        className="mono"
                        style={{ marginTop: 6, fontSize: 11, color: "var(--color-ink-soft)" }}
                      >
                        {Math.round(percent)}%
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }} className="mono">
                      {annualHours.assigned}h
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color:
                          annualHours.deviation < 0
                            ? "var(--color-red)"
                            : annualHours.deviation > 0
                              ? "var(--color-green-strong)"
                              : "var(--color-ink-soft)",
                      }}
                      className="mono"
                    >
                      {formatDeviation(annualHours.deviation)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
