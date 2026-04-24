import React, { useDeferredValue, useMemo, useState } from "react";
import { SearchInput, SelectField, Card, Pill } from "../components/ui";
import { WorkerDetailModal } from "../components/WorkerDetailModal";
import { formatDeviation, normalizeText } from "../lib/format";

export function WorkersView({ hospitalData }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedWorker, setSelectedWorker] = useState(null);

  const deferredSearch = useDeferredValue(search);

  const categories = useMemo(
    () =>
      Array.from(new Set(hospitalData.workers.map((worker) => worker.categoria))).sort(),
    [hospitalData.workers],
  );

  const filteredWorkers = useMemo(() => {
    const query = normalizeText(deferredSearch);

    return hospitalData.workers.filter((worker) => {
      if (categoryFilter !== "all" && worker.categoria !== categoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        normalizeText(worker.name).includes(query) ||
        normalizeText(worker.observations).includes(query) ||
        normalizeText(worker.plaza).includes(query)
      );
    });
  }, [categoryFilter, deferredSearch, hospitalData.workers]);

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Plantilla y observaciones</h1>
          <p>
            {hospitalData.workers.length} personas con turno base, categoria, plaza
            y restricciones operativas.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, plaza u observacion..."
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
        <div className="toolbar-spacer" />
        <div style={{ color: "var(--color-ink-soft)", fontSize: 12.5 }}>
          {filteredWorkers.length} resultados
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Categoria</th>
                <th>Turno base</th>
                <th>Plaza</th>
                <th>Observaciones</th>
                <th style={{ textAlign: "right" }}>Horas / anio</th>
                <th style={{ textAlign: "right" }}>Desvio</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker, index) => {
                const annualHours = hospitalData.annualHours?.[worker.name] ?? {
                  deviation: 0,
                };

                return (
                  <tr
                    key={worker.id}
                    className="worker-row"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <td>
                      <div className="worker-main">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            display: "grid",
                            placeItems: "center",
                            background: "var(--color-primary-soft)",
                            color: "var(--color-primary-strong)",
                            fontWeight: 800,
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <div className="worker-name">{worker.name}</div>
                          <div className="worker-meta">{worker.center}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Pill tone="neutral" size="sm">
                        {worker.categoria}
                      </Pill>
                    </td>
                    <td>{worker.turnoBase}</td>
                    <td>
                      {worker.plaza ? (
                        <Pill
                          tone={worker.plaza.includes("CORRETURNOS") ? "amber" : "blue"}
                          size="sm"
                        >
                          {worker.plaza}
                        </Pill>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ color: "var(--color-ink-soft)", maxWidth: 420 }}>
                      {worker.observations || "Sin observaciones"}
                    </td>
                    <td style={{ textAlign: "right" }} className="mono">
                      {worker.annualHours}h
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
