import React from "react";
import { MONTHS } from "../lib/constants";
import { daysInMonth } from "../lib/date";
import { Button, Icon } from "./ui";

export function MonthPicker({ year, monthIndex, onChange }) {
  return (
    <div className="month-picker">
      <button
        onClick={() => onChange(Math.max(0, monthIndex - 1))}
        disabled={monthIndex === 0}
        aria-label="Mes anterior"
        style={{ transform: "rotate(180deg)" }}
      >
        <Icon name="chevron" size={16} />
      </button>
      <div className="month-picker-body">
        <div style={{ fontWeight: 800 }}>{MONTHS[monthIndex]} 2026</div>
        <div style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>
          {daysInMonth(year, monthIndex)} dias
        </div>
      </div>
      <button
        onClick={() => onChange(Math.min(11, monthIndex + 1))}
        disabled={monthIndex === 11}
        aria-label="Mes siguiente"
      >
        <Icon name="chevron" size={16} />
      </button>
    </div>
  );
}

export function MonthPickerAction({
  year,
  monthIndex,
  onChange,
  extraAction,
  extraLabel,
}) {
  return (
    <>
      <MonthPicker year={year} monthIndex={monthIndex} onChange={onChange} />
      {extraAction ? (
        <Button variant="default" size="md" onClick={extraAction}>
          {extraLabel}
        </Button>
      ) : null}
    </>
  );
}
