import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatHospitalLabel, formatPercent, normalizeText } from "../lib/format";
import { Button, Icon } from "./ui";

function buildHospitalInsights(data, hospitalKey) {
  const hospitalData = data.hospitals[hospitalKey];
  const workers = hospitalData.workers || [];
  const coverage = hospitalData.coverage || [];
  const summary = hospitalData.summary || {};
  const totalCoverageGaps = Number(summary.totalCoverageGaps || 0);
  const averageDeviationHours = Number(summary.averageDeviationHours || 0);

  const workersByCategory = workers.reduce((accumulator, worker) => {
    const category = worker.categoria || "Sin categoria";
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});

  const coverageIncidents = coverage.filter((row) => row.meetsCoverage === "NO");
  const incidentsByCategory = coverageIncidents.reduce((accumulator, row) => {
    const category = row.category || "Sin categoria";
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});

  const topIncidents = Object.entries(incidentsByCategory)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return {
    label: formatHospitalLabel(hospitalKey),
    workers,
    summary,
    totalCoverageGaps,
    averageDeviationHours,
    workersByCategory,
    topIncidents,
    coveragePercent: coverage.length
      ? ((coverage.length - totalCoverageGaps) / coverage.length) * 100
      : 100,
  };
}

function answerPlanningQuestion(data, hospitalKey, question) {
  const text = normalizeText(question);
  const active = buildHospitalInsights(data, hospitalKey);
  const clinico = buildHospitalInsights(data, "clinico");
  const gil = buildHospitalInsights(data, "gil");

  if (
    (text.includes("cuantas") ||
      text.includes("cuantos") ||
      text.includes("plantilla") ||
      text.includes("personas")) &&
    (text.includes("cada hospital") ||
      text.includes("ambos") ||
      text.includes("hospitales"))
  ) {
    return [
      "Plantilla cargada actualmente:",
      `- Hospital Clinico: ${clinico.workers.length} personas`,
      `- Hospital Gil Casares: ${gil.workers.length} personas`,
      `- Total: ${clinico.workers.length + gil.workers.length} personas`,
    ].join("\n");
  }

  if (
    text.includes("cuantas") ||
    text.includes("cuantos") ||
    text.includes("plantilla") ||
    text.includes("personas")
  ) {
    const lines = Object.entries(active.workersByCategory)
      .sort((left, right) => right[1] - left[1])
      .map(([category, amount]) => `- ${category}: ${amount}`);

    return [
      `En ${active.label} hay ${active.workers.length} personas cargadas.`,
      lines.length ? `Distribucion principal:\n${lines.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (
    (text.includes("categoria") || text.includes("categorias")) &&
    (text.includes("incidencia") ||
      text.includes("cobertura") ||
      text.includes("faltas"))
  ) {
    if (!active.topIncidents.length) {
      return `No hay incidencias de cobertura abiertas en ${active.label}.`;
    }

    return [
      `Categorias con mas tension en ${active.label}:`,
      ...active.topIncidents.map(
        ([category, amount]) => `- ${category}: ${amount} incidencias`,
      ),
    ].join("\n");
  }

  if (
    text.includes("cobertura") ||
    text.includes("incidencias") ||
    text.includes("faltas")
  ) {
    return [
      `Resumen de cobertura de ${active.label}:`,
      `- Cobertura estimada: ${formatPercent(active.coveragePercent)}`,
      `- Faltas de cobertura: ${active.totalCoverageGaps}`,
      active.topIncidents[0]
        ? `- Categoria mas tensionada: ${active.topIncidents[0][0]} (${active.topIncidents[0][1]})`
        : "- No hay categorias tensionadas ahora mismo",
    ].join("\n");
  }

  if (
    text.includes("hora") ||
    text.includes("desvio") ||
    text.includes("desviacion")
  ) {
    return [
      `En ${active.label} el desvio medio anual es de ${active.averageDeviationHours >= 0 ? "+" : ""}${active.averageDeviationHours.toFixed(1)}h por persona.`,
      'La vista "Horas" enseña el detalle individual y el grado de cumplimiento anual.',
    ].join("\n");
  }

  if (
    text.includes("baja") ||
    text.includes("sustitu") ||
    text.includes("ultima hora")
  ) {
    return [
      "Orden recomendado para cubrir una baja de ultima hora:",
      "- 1) Revisar la vista Cobertura para ver la categoria y el turno por debajo del minimo.",
      "- 2) Ir al Cuadrante para localizar una persona compatible de la misma categoria.",
      active.topIncidents[0]
        ? `- 3) Priorizar ${active.topIncidents[0][0]}, porque es donde mas tension se ve ahora.`
        : "- 3) Priorizar el turno afectado y volver a comprobar cobertura tras el cambio.",
    ].join("\n");
  }

  if (
    text.includes("resumen") ||
    text.includes("estado") ||
    text.includes("como estamos")
  ) {
    return [
      `Resumen rapido de ${active.label}:`,
      `- Personas cargadas: ${active.workers.length}`,
      `- Cobertura estimada: ${formatPercent(active.coveragePercent)}`,
      `- Faltas de cobertura: ${active.totalCoverageGaps}`,
      `- Desvio medio anual: ${active.averageDeviationHours >= 0 ? "+" : ""}${active.averageDeviationHours.toFixed(1)}h`,
    ].join("\n");
  }

  return [
    `Puedo responder con los datos cargados de ${active.label}.`,
    "Prueba con preguntas como:",
    "- Cuantas personas hay en cada hospital",
    "- Como estamos de cobertura",
    "- Que categorias tienen incidencias",
    "- Cual es el desvio medio de horas",
    "- Como cubrir una baja de ultima hora",
  ].join("\n");
}

export function ChatbotFab({ onToggle }) {
  return (
    <button className="chat-fab" onClick={onToggle} title="Abrir asistente">
      <Icon name="sparkle" size={22} />
    </button>
  );
}

export function ChatbotPanel({ data, hospitalKey, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Asistente local listo. Puedo ayudarte con cobertura, plantilla, horas o incidencias del cuadrante cargado.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const suggestions = useMemo(
    () => [
      "Cuantas personas trabajan en cada hospital",
      "Como estamos de cobertura",
      "Como cubrir una baja de ultima hora",
    ],
    [],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function send(nextText = input) {
    const message = nextText.trim();
    if (!message || loading) {
      return;
    }

    setInput("");
    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setLoading(true);

    window.setTimeout(() => {
      const answer = answerPlanningQuestion(data, hospitalKey, message);
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
      setLoading(false);
    }, 250);
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.16)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="sparkle" size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Asistente EXCELENTIA</div>
          <div style={{ fontSize: 11.5, opacity: 0.9 }}>
            Consultas locales sobre el cuadrante cargado
          </div>
        </div>
        <Button variant="ghost" size="sm" icon="close" onClick={onClose} />
      </div>

      <div className="chat-panel-body">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-message ${message.role}`}
          >
            <div className="chat-bubble">{message.content}</div>
          </div>
        ))}

        {loading ? (
          <div className="chat-message assistant">
            <div className="chat-bubble">Analizando datos...</div>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {messages.length === 1 ? (
        <div style={{ padding: "10px 12px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="default"
              size="sm"
              onClick={() => send(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="chat-panel-footer">
        <Button
          variant="soft"
          size="sm"
          icon="mic"
          title="Voz no disponible todavia"
          onClick={() =>
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content:
                  "El modo voz no esta conectado todavia. Escribe tu pregunta y respondo con los datos cargados.",
              },
            ])
          }
        />
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Escribe tu consulta..."
        />
        <Button
          variant="primary"
          size="sm"
          icon="send"
          onClick={() => send()}
          disabled={!input.trim() || loading}
        />
      </div>
    </div>
  );
}
