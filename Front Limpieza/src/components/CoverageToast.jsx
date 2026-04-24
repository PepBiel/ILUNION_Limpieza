import React, { useEffect } from "react";
import { Button, Card, Icon, Pill } from "./ui";

export function CoverageToast({ toast, onClose, onGoToCoverage }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 8500);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  return (
    <Card className="toast">
      <div className="toast-head">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--color-primary)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="check" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary-strong)" }}>
            Cobertura actualizada
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-ink-soft)", marginTop: 2 }}>
            {toast.title}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} icon="close" />
      </div>
      <div className="toast-body">
        {toast.rows.map((row) => {
          const belowBefore = row.beforeAssigned < row.required;
          const belowAfter = row.afterAssigned < row.required;
          return (
            <div className="toast-row" key={`${row.label}-${row.dayLabel}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>{row.dayLabel}</div>
              </div>
              <div className="mono" style={{ color: "var(--color-ink-soft)" }}>
                {row.beforeAssigned}/{row.required}
              </div>
              <Icon name="chevron" size={12} stroke="var(--color-ink-soft)" />
              <div className="mono" style={{ fontWeight: 800 }}>
                {row.afterAssigned}/{row.required}
              </div>
              {belowAfter ? (
                <Pill tone="red" size="sm">
                  Bajo minimo
                </Pill>
              ) : null}
              {!belowAfter && belowBefore ? (
                <Pill tone="green" size="sm">
                  Cubierto
                </Pill>
              ) : null}
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button variant="soft" size="sm" onClick={onGoToCoverage}>
            Ver cobertura
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Card>
  );
}
