import React from "react";
import { formatHospitalLabel, formatPercent } from "../lib/format";
import { Button, Card, Icon, MetricCard, Pill } from "../components/ui";

function buildCoveragePercentage(hospitalData) {
  const totalRows = hospitalData.coverage.length || 0;
  const gaps = hospitalData.summary.totalCoverageGaps || 0;
  if (!totalRows) {
    return 100;
  }
  return ((totalRows - gaps) / totalRows) * 100;
}

function ActionCard({ title, detail, icon, tone = "default", onClick }) {
  return (
    <Card className="action-card">
      <div
        className="action-icon"
        style={
          tone === "accent"
            ? { background: "var(--color-accent-soft)", color: "#7a5900" }
            : undefined
        }
      >
        <Icon name={icon} size={24} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <Button variant={tone === "accent" ? "soft" : "default"} onClick={onClick}>
        Abrir
      </Button>
    </Card>
  );
}

export function HomeView({
  hospitalData,
  hospitalKey,
  schedulerStatus,
  onViewChange,
  onOpenChat,
}) {
  const coveragePercent = buildCoveragePercentage(hospitalData);
  const summary = hospitalData.summary;
  const schedulerReady = schedulerStatus === "connected";

  return (
    <>
      <Card className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="hero-kicker">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--color-accent)",
                }}
              />
              Panel operativo
            </div>
            <h2>{formatHospitalLabel(hospitalKey)}</h2>
            <p>
              Dashboard preparado para revisar cuadrantes mensuales, cobertura minima,
              observaciones individuales y computo anual sin depender de hojas Excel
              abiertas en paralelo.
            </p>
          </div>

          <div style={{ display: "grid", gap: 10, minWidth: 260 }}>
            <Pill tone={schedulerReady ? "green" : "amber"}>
              {schedulerReady
                ? "Generador conectado"
                : "Generador listo para integrar"}
            </Pill>
            <Button variant="default" size="lg" onClick={() => onViewChange("schedule")}>
              Ir al cuadrante
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        <MetricCard
          label="Plantilla activa"
          value={hospitalData.workers.length}
          detail="personas cargadas desde el algoritmo"
          tone="blue"
        />
        <MetricCard
          label="Cobertura estimada"
          value={formatPercent(coveragePercent)}
          detail="comparada contra el minimo requerido"
          tone={coveragePercent >= 95 ? "green" : "amber"}
        />
        <MetricCard
          label="Faltas de cobertura"
          value={summary.totalCoverageGaps}
          detail="detectadas en el resumen anual"
          tone={summary.totalCoverageGaps === 0 ? "green" : "red"}
        />
        <MetricCard
          label="Desvio medio"
          value={`${summary.averageDeviationHours >= 0 ? "+" : ""}${summary.averageDeviationHours}h`}
          detail="por persona en el anio cargado"
          tone="amber"
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <ActionCard
          title="Cuadrante editable"
          detail="Editar turnos por dia y ver el impacto inmediato sobre la cobertura."
          icon="calendar"
          tone="accent"
          onClick={() => onViewChange("schedule")}
        />
        <ActionCard
          title="Cobertura diaria"
          detail="Comparar asignado frente a minimos de PRESENCIAS por categoria y turno."
          icon="gauge"
          onClick={() => onViewChange("coverage")}
        />
        <ActionCard
          title="Plantilla y observaciones"
          detail="Consultar plazas, categorias y restricciones manuales de cada persona."
          icon="people"
          onClick={() => onViewChange("workers")}
        />
        <ActionCard
          title="Ayuda operativa"
          detail="Asistente local para responder dudas rapidas con los datos cargados."
          icon="chat"
          onClick={onOpenChat}
        />
      </div>
    </>
  );
}
