import React from "react";
import { MONTHS, SHIFT_OPTIONS } from "../lib/constants";
import { formatDeviation } from "../lib/format";
import { Avatar, Button, Card, Modal, Pill } from "./ui";

function buildMonthlyBreakdown(hospitalData, workerName) {
  const workerSchedule = hospitalData.monthlySchedule?.[workerName] ?? {};
  const trackableCodes = new Set(SHIFT_OPTIONS.map((shift) => shift.code));

  return MONTHS.map((month, monthIndex) => {
    const monthSchedule = workerSchedule?.[monthIndex + 1] ?? [];
    const counts = { M: 0, T: 0, N: 0, D: 0, V26: 0, other: 0 };

    for (const rawValue of monthSchedule) {
      const code = (rawValue || "").toString().trim().toUpperCase();
      if (!code) {
        continue;
      }

      if (counts[code] !== undefined) {
        counts[code] += 1;
        continue;
      }

      if (!trackableCodes.has(code)) {
        counts.other += 1;
      }
    }

    return { month, counts };
  });
}

export function WorkerDetailModal({ hospitalData, worker, onClose }) {
  const annualHours = hospitalData.annualHours?.[worker.name] ?? {
    assigned: 0,
    target: worker.annualHours,
    deviation: 0,
  };

  const monthlyBreakdown = buildMonthlyBreakdown(hospitalData, worker.name);

  return (
    <Modal onClose={onClose} width={860}>
      <div className="modal-body">
        <div className="modal-header">
          <Avatar name={worker.name} size={48} />
          <div>
            <h3>{worker.name}</h3>
            <p>
              {worker.categoria} · {worker.center}
            </p>
          </div>
          <Button
            className="modal-close"
            variant="ghost"
            size="sm"
            icon="close"
            onClick={onClose}
          />
        </div>

        <div className="summary-grid" style={{ marginBottom: 16 }}>
          <Card style={{ padding: 16 }}>
            <div className="metric-label">Turno base</div>
            <div className="metric-value" style={{ fontSize: 20 }}>
              {worker.turnoBase || "—"}
            </div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div className="metric-label">Horas / anio</div>
            <div className="metric-value" style={{ fontSize: 20 }}>
              {worker.annualHours}h
            </div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div className="metric-label">Asignadas</div>
            <div className="metric-value" style={{ fontSize: 20 }}>
              {annualHours.assigned}h
            </div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div className="metric-label">Desvio</div>
            <div
              className="metric-value"
              style={{
                fontSize: 20,
                color:
                  annualHours.deviation < 0
                    ? "var(--color-red)"
                    : annualHours.deviation > 0
                      ? "var(--color-green-strong)"
                      : "var(--color-ink)",
              }}
            >
              {formatDeviation(annualHours.deviation)}
            </div>
          </Card>
        </div>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div className="metric-label">Plaza</div>
          <div style={{ marginTop: 8 }}>
            {worker.plaza ? <Pill tone="neutral">{worker.plaza}</Pill> : "Sin plaza informada"}
          </div>
          <div className="metric-label" style={{ marginTop: 16 }}>
            Observaciones
          </div>
          <p style={{ margin: "8px 0 0", color: "var(--color-ink-soft)" }}>
            {worker.observations || "No hay observaciones registradas."}
          </p>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Distribucion mensual</div>
            <p style={{ margin: "6px 0 0", color: "var(--color-ink-soft)" }}>
              Resumen del cuadrante anual cargado para esta persona.
            </p>
          </div>
          <div className="table-shell" style={{ marginTop: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>M</th>
                  <th>T</th>
                  <th>N</th>
                  <th>D</th>
                  <th>V26</th>
                  <th>Otros</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.counts.M || ""}</td>
                    <td>{row.counts.T || ""}</td>
                    <td>{row.counts.N || ""}</td>
                    <td>{row.counts.D || ""}</td>
                    <td>{row.counts.V26 || ""}</td>
                    <td>{row.counts.other || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
