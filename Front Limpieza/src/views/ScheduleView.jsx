import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { WorkerDetailModal } from "../components/WorkerDetailModal";
import { MonthPicker } from "../components/MonthPicker";
import { Button, Card, Icon, Pill, SearchInput, SelectField, Modal } from "../components/ui";
import { COVERAGE_CATEGORIES, MONTHS, SHIFT_BY_CODE, SHIFT_OPTIONS } from "../lib/constants";
import {
  buildCoverageToastRows,
  buildMonthlyCoverageSummary,
  exportScheduleAsCsv,
  getScheduleValue,
} from "../lib/coverage";
import { dayLetter, daysInMonth, isHoliday, isWeekend } from "../lib/date";
import { normalizeText } from "../lib/format";
import { readStoredValue, writeStoredValue } from "../lib/storage";
import { requestScheduleGeneration } from "../services/schedulerGateway";

function matchesShiftFilter(worker, filter) {
  const text = normalizeText(worker.turnoBase);
  if (filter === "all") {
    return true;
  }
  if (filter === "M") {
    return text.startsWith("manana");
  }
  if (filter === "T") {
    return text.startsWith("tarde") || text === "noche/tarde";
  }
  if (filter === "N") {
    return text.includes("noche");
  }
  if (filter === "ROT") {
    return text.includes("rot") || normalizeText(worker.puesto).includes("peon");
  }
  return true;
}

function shiftClassName(value) {
  const shift = SHIFT_BY_CODE[(value || "").toUpperCase()];
  if (!shift) {
    return "";
  }
  if (shift.code === "M" || shift.code === "T" || shift.code === "N" || shift.code === "D") {
    return `shift-${shift.code}`;
  }
  if (shift.group === "Vacaciones") {
    return "shift-vacaciones";
  }
  if (shift.group === "Permiso") {
    return "shift-permiso";
  }
  if (shift.group === "Ausencia") {
    return "shift-ausencia";
  }
  return "";
}

function ScheduleCell({ value, selected, onClick }) {
  return (
    <button
      className={`shift-button ${shiftClassName(value)} ${selected ? "shift-selected" : ""}`.trim()}
      onClick={onClick}
    >
      {value}
    </button>
  );
}

function CellEditorModal({ worker, monthIndex, day, currentValue, onSave, onClose }) {
  return (
    <Modal onClose={onClose} width={620}>
      <div className="modal-body">
        <div className="modal-header">
          <div>
            <h3>{worker.name}</h3>
            <p>
              {worker.categoria} · {day} de {MONTHS[monthIndex].toLowerCase()} · valor actual:{" "}
              {currentValue || "vacio"}
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

        {["Turno", "Descanso", "Vacaciones", "Permiso", "Ausencia"].map((group) => (
          <div className="picker-group" key={group}>
            <div className="picker-group-title">{group}</div>
            <div className="picker-options">
              {SHIFT_OPTIONS.filter((shift) => shift.group === group).map((shift) => (
                <button
                  key={shift.code}
                  className={`picker-option ${currentValue === shift.code ? "active" : ""}`.trim()}
                  onClick={() => onSave(shift.code)}
                >
                  <strong className="mono">{shift.code}</strong> {shift.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Button variant="ghost" onClick={() => onSave("")}>
            Vaciar celda
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="default" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CoverageSummary({ summaryRows }) {
  return (
    <div className="summary-grid" style={{ marginTop: 18 }}>
      {summaryRows.map((row) => {
        const percent = row.required ? Math.min(100, (row.assigned / row.required) * 100) : 100;
        return (
          <Card key={row.category} style={{ padding: 16 }}>
            <div className="metric-label">{row.label}</div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 8,
                marginBottom: 10,
              }}
            >
              <div className="metric-value" style={{ fontSize: 24 }}>
                {row.assigned}
              </div>
              <div style={{ color: "var(--color-ink-soft)", fontSize: 12 }}>
                de {row.required} minimos
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-bar"
                style={{
                  width: `${percent}%`,
                  background:
                    row.deficitDays === 0 ? "var(--color-primary)" : "var(--color-red)",
                }}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              {row.deficitDays === 0 ? (
                <Pill tone="green" size="sm">
                  Cubierto
                </Pill>
              ) : (
                <Pill tone="red" size="sm">
                  {row.deficitDays} dias en deficit
                </Pill>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function ScheduleView({
  hospitalData,
  hospitalKey,
  presences,
  edits,
  setEdits,
  schedulerStatus,
  onShowToast,
  onGenerated,
}) {
  const year = 2026;
  const [monthIndex, setMonthIndex] = useState(() => {
    const stored = Number(readStoredValue("fl-schedule-month", "0"));
    return Number.isInteger(stored) && stored >= 0 && stored < 12 ? stored : 0;
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [generationPending, setGenerationPending] = useState(false);
  const [latestExcelUrl, setLatestExcelUrl] = useState("");

  useEffect(() => {
    writeStoredValue("fl-schedule-month", String(monthIndex));
  }, [monthIndex]);

  const deferredSearch = useDeferredValue(search);

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) => index + 1),
    [monthIndex],
  );

  const categories = useMemo(
    () => Array.from(new Set(hospitalData.workers.map((worker) => worker.categoria))).sort(),
    [hospitalData.workers],
  );

  const filteredWorkers = useMemo(() => {
    const query = normalizeText(deferredSearch);

    return hospitalData.workers.filter((worker) => {
      if (categoryFilter !== "all" && worker.categoria !== categoryFilter) {
        return false;
      }

      if (!matchesShiftFilter(worker, shiftFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return normalizeText(worker.name).includes(query);
    });
  }, [categoryFilter, deferredSearch, hospitalData.workers, shiftFilter]);

  const getShift = (workerName, dayIndex) =>
    getScheduleValue(hospitalData, workerName, monthIndex, dayIndex, edits);

  const monthlyCoverageGaps = useMemo(
    () =>
      hospitalData.coverage.filter((row) => {
        const month = Number((row.date || "").slice(5, 7)) - 1;
        return month === monthIndex && row.meetsCoverage === "NO";
      }).length,
    [hospitalData.coverage, monthIndex],
  );

  const coverageSummary = useMemo(
    () =>
      buildMonthlyCoverageSummary(
        hospitalData,
        presences,
        hospitalKey,
        edits,
        year,
        monthIndex,
        COVERAGE_CATEGORIES,
      ),
    [edits, hospitalData, hospitalKey, monthIndex, presences],
  );

  async function handleGenerate() {
    setGenerationPending(true);
    try {
      const response = await requestScheduleGeneration({
        hospital: hospitalKey,
        year,
      });
      if (response?.data) {
        onGenerated?.(response.data, hospitalKey);
      }
      if (response?.excelUrl) {
        setLatestExcelUrl(response.excelUrl);
      }
      setStatusMessage({
        tone: "success",
        text: "Cuadrante regenerado con el algoritmo y datos del dashboard actualizados.",
      });
    } catch (error) {
      setStatusMessage({
        tone: "warning",
        text: error.message,
      });
    } finally {
      setGenerationPending(false);
    }
  }

  function handleExport() {
    exportScheduleAsCsv({
      workers: filteredWorkers,
      monthIndex,
      year,
      getValue: getShift,
      filenamePrefix: `cuadrante-${hospitalKey}`,
    });
    setStatusMessage({
      tone: "success",
      text: "Exportacion CSV generada con el estado actual del cuadrante.",
    });
  }

  function handleSetShift(worker, dayIndex, nextValue) {
    const beforeValue = getShift(worker.name, dayIndex);
    if (beforeValue === nextValue) {
      setSelectedCell(null);
      return;
    }

    const editKey = `${worker.name}|${monthIndex}|${dayIndex}`;
    const nextEdits = {
      ...edits,
      [editKey]: nextValue,
    };

    const rows = buildCoverageToastRows({
      hospitalData,
      presences,
      hospitalKey,
      edits,
      nextEdits,
      worker,
      beforeValue,
      nextValue,
      year,
      monthIndex,
      day: dayIndex + 1,
    });

    setEdits(nextEdits);
    setSelectedCell(null);

    if (rows.length) {
      onShowToast({
        title: `${worker.name} · ${beforeValue || "vacio"} -> ${nextValue || "vacio"}`,
        rows,
      });
    }
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Cuadrante mensual</h1>
          <p>
            Edicion operativa del cuadrante cargado por el algoritmo, con impacto
            directo sobre la cobertura.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <MonthPicker year={year} monthIndex={monthIndex} onChange={setMonthIndex} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar trabajador..."
        />
        <SelectField
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: "all", label: "Todas las categorias" },
            ...categories.map((category) => ({
              value: category,
              label: category,
            })),
          ]}
        />
        <SelectField
          value={shiftFilter}
          onChange={setShiftFilter}
          options={[
            { value: "all", label: "Todos los turnos" },
            { value: "M", label: "Manana" },
            { value: "T", label: "Tarde" },
            { value: "N", label: "Noche" },
            { value: "ROT", label: "Rotatorio / Peon" },
          ]}
        />
        <div className="toolbar-spacer" />
        <Button
          variant="primary"
          icon="wand"
          onClick={handleGenerate}
          disabled={generationPending}
        >
          {generationPending ? "Lanzando..." : "Generar con algoritmo"}
        </Button>
        <Button variant="default" icon="download" onClick={handleExport}>
          Exportar CSV
        </Button>
        {latestExcelUrl ? (
          <Button
            variant="soft"
            icon="download"
            onClick={() => window.open(latestExcelUrl, "_blank", "noopener,noreferrer")}
          >
            Descargar Excel
          </Button>
        ) : null}
      </div>

      <div
        className={`banner ${monthlyCoverageGaps > 0 || statusMessage?.tone === "warning" ? "banner-warn" : ""}`.trim()}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            color:
              monthlyCoverageGaps > 0 || statusMessage?.tone === "warning"
                ? "#7a5900"
                : "var(--color-primary-strong)",
            flexShrink: 0,
          }}
        >
          <Icon
            name={
              monthlyCoverageGaps > 0 || statusMessage?.tone === "warning"
                ? "warn"
                : "check"
            }
            size={16}
          />
        </div>
        <div style={{ flex: 1 }}>
          <strong>
            {statusMessage?.text
              ? "Estado del generador"
              : "Cuadrante cargado desde datos del algoritmo"}
          </strong>
          <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
            {statusMessage?.text ||
              `${filteredWorkers.length} personas visibles · ${monthlyCoverageGaps} incidencias de cobertura registradas en este mes · integracion ${schedulerStatus === "connected" ? "activa" : "pendiente"}.`}
          </div>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <div className="table-shell">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="sticky-column" style={{ minWidth: 260 }}>
                  Trabajador · categoria
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
              {filteredWorkers.map((worker, workerIndex) => (
                <tr key={worker.id}>
                  <td
                    className="sticky-column"
                    onClick={() => setSelectedWorker(worker)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="worker-main">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                          background: "var(--color-primary-soft)",
                          color: "var(--color-primary-strong)",
                          fontWeight: 800,
                        }}
                      >
                        {String(workerIndex + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="worker-name">{worker.name}</div>
                        <div className="worker-meta">
                          <span>{worker.categoria}</span>
                          <span>·</span>
                          <span>{worker.turnoBase}</span>
                          {worker.plaza ? <span>· {worker.plaza}</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  {days.map((day, dayIndex) => {
                    const value = getShift(worker.name, dayIndex);
                    const selected =
                      selectedCell?.workerId === worker.id &&
                      selectedCell?.dayIndex === dayIndex;

                    return (
                      <td
                        key={`${worker.id}-${day}`}
                        className="schedule-row-cell"
                        style={{
                          background: isHoliday(year, monthIndex, day)
                            ? "#fff4f1"
                            : isWeekend(year, monthIndex, day)
                              ? "#fbfcfd"
                              : "#fff",
                        }}
                      >
                        <ScheduleCell
                          value={value}
                          selected={selected}
                          onClick={() =>
                            setSelectedCell({
                              workerId: worker.id,
                              worker,
                              dayIndex,
                            })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CoverageSummary summaryRows={coverageSummary} />

      {selectedCell ? (
        <CellEditorModal
          worker={selectedCell.worker}
          monthIndex={monthIndex}
          day={selectedCell.dayIndex + 1}
          currentValue={getShift(selectedCell.worker.name, selectedCell.dayIndex)}
          onSave={(nextValue) =>
            handleSetShift(selectedCell.worker, selectedCell.dayIndex, nextValue)
          }
          onClose={() => setSelectedCell(null)}
        />
      ) : null}

      {selectedWorker ? (
        <WorkerDetailModal
          hospitalData={hospitalData}
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
        />
      ) : null}
    </>
  );
}
