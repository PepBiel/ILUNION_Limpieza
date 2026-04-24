import React from "react";
import { Button, Card, Pill } from "./ui";

export function GenerationRequiredState({
  title,
  description,
  onGenerate,
  pending,
  schedulerStatus,
  statusMessage,
  ctaLabel = "Generar cuadrante",
}) {
  const schedulerReady = schedulerStatus === "connected";

  return (
    <Card className="generation-required-card">
      <div className="generation-required-kicker">
        <Pill tone={schedulerReady ? "green" : "amber"} size="sm">
          {schedulerReady ? "Generador conectado" : "Generador no disponible"}
        </Pill>
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      {statusMessage ? (
        <div
          className={`generation-required-note ${statusMessage.tone === "warning" ? "warn" : ""}`.trim()}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <Button
          variant="primary"
          size="lg"
          icon="wand"
          onClick={onGenerate}
          disabled={pending}
        >
          {pending ? "Generando..." : ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
