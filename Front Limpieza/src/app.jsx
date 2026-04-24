// App root + sidebar + header + data loader + chatbot.

function App() {
  const [data, setData] = React.useState(null);
  const [view, setView] = React.useState("home");
  const [hospital, setHospital] = React.useState(
    () => localStorage.getItem("dlp-hospital") || "clinico",
  );
  const [chatOpen, setChatOpen] = React.useState(false);
  const [err, setErr] = React.useState(null);
  // Edits: { [hospital]: { [workerName|monthIdx|dayIdx]: shift } }
  const [allEdits, setAllEdits] = React.useState({ clinico: {}, gil: {} });
  const [toast, setToast] = React.useState(null); // { title, rows:[{cat, dayKey, before, after, nec}] }
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("data.json")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);
  React.useEffect(() => {
    if (view !== "home") localStorage.setItem("dlp-view", view);
  }, [view]);
  React.useEffect(
    () => localStorage.setItem("dlp-hospital", hospital),
    [hospital],
  );
  React.useEffect(() => {
    if (!isTablet) setMobileNavOpen(false);
  }, [isTablet]);

  if (err)
    return <div style={{ padding: 40, color: "#8a1f15" }}>Error: {err}</div>;
  if (!data) return <LoadingScreen />;

  const h = data[hospital];
  // Attach presencias globally to each hospital's h for easy access in views
  h.presencias = data.presencias;
  const edits = allEdits[hospital] || {};
  const setEdits = (updater) =>
    setAllEdits((prev) => ({
      ...prev,
      [hospital]:
        typeof updater === "function" ? updater(prev[hospital] || {}) : updater,
    }));

  const detailViews = ["cuadrante", "trabajadores", "cobertura", "horas"];
  const lastDetailView = detailViews.includes(localStorage.getItem("dlp-view"))
    ? localStorage.getItem("dlp-view")
    : "cuadrante";

  let content;
  if (view === "home")
    content = (
      <HomeLanding
        h={h}
        hospital={hospital}
        onOpenDetails={() => setView(lastDetailView)}
        onGoGenerate={() => setView("cuadrante")}
        onGoExport={() => setView("cuadrante")}
        onGoCoverage={() => setView("cobertura")}
        onOpenChat={() => setChatOpen(true)}
      />
    );
  else if (view === "cuadrante")
    content = (
      <ViewCuadrante
        key={hospital}
        h={h}
        hospital={hospital}
        edits={edits}
        setEdits={setEdits}
        onShowToast={setToast}
      />
    );
  else if (view === "trabajadores") content = <ViewWorkers h={h} />;
  else if (view === "cobertura")
    content = <ViewCobertura h={h} hospital={hospital} edits={edits} />;
  else if (view === "horas") content = <ViewHoras h={h} />;
  if (!content)
    content = (
      <HomeLanding
        h={h}
        hospital={hospital}
        onOpenDetails={() => setView(lastDetailView)}
        onGoGenerate={() => setView("cuadrante")}
        onGoExport={() => setView("cuadrante")}
        onGoCoverage={() => setView("cobertura")}
        onOpenChat={() => setChatOpen(true)}
      />
    );

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}
    >
      <Sidebar
        view={view}
        setView={setView}
        hospital={hospital}
        setHospital={setHospital}
        data={data}
        isTablet={isTablet}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar
          hospital={hospital}
          data={data}
          onOpenChat={() => setChatOpen((v) => !v)}
          isTablet={isTablet}
          isMobile={isMobile}
          onToggleNav={() => setMobileNavOpen((v) => !v)}
        />
        <div data-screen-label={view} style={{ flex: 1, minWidth: 0 }}>
          {content}
        </div>
      </main>
      <ChatbotFAB onToggle={() => setChatOpen((v) => !v)} />
      {chatOpen && (
        <ChatbotPanel
          data={data}
          hospital={hospital}
          onClose={() => setChatOpen(false)}
        />
      )}
      {toast && (
        <CoverageToast
          toast={toast}
          onClose={() => setToast(null)}
          onGoToCobertura={() => {
            setView("cobertura");
            setToast(null);
          }}
        />
      )}
    </div>
  );
}

// Toast shown when an edit changes coverage
function CoverageToast({ toast, onClose, onGoToCobertura }) {
  const isMobile = useIsMobile(760);
  React.useEffect(() => {
    const t = setTimeout(onClose, 8500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: isMobile ? "auto" : 82,
        bottom: isMobile ? 72 : "auto",
        right: isMobile ? 10 : 22,
        left: isMobile ? 10 : "auto",
        zIndex: 90,
        width: 400,
        maxWidth: isMobile ? "none" : "calc(100vw - 44px)",
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 14,
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        animation: "slideIn .25s ease-out",
      }}
    >
      <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div
        style={{
          padding: "13px 15px",
          display: "flex",
          gap: 11,
          alignItems: "flex-start",
          background: "var(--il-green-soft)",
          borderBottom:
            "1px solid color-mix(in oklab, var(--il-green) 20%, transparent)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--il-green)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="check" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--il-green-dark)",
            }}
          >
            Cobertura actualizada
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--il-green-dark)",
              opacity: 0.85,
              marginTop: 2,
            }}
          >
            {toast.title}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--il-green-dark)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <div style={{ padding: "10px 15px" }}>
        {toast.rows.map((r, i) => {
          const delta = r.after - r.before;
          const belowBefore = r.before < r.nec;
          const belowAfter = r.after < r.nec;
          let tone = "neutral";
          if (belowAfter && !belowBefore) tone = "red";
          else if (!belowAfter && belowBefore) tone = "green";
          else if (delta > 0) tone = "green";
          else if (delta < 0) tone = "amber";
          const color =
            tone === "red"
              ? "#8a1f15"
              : tone === "green"
                ? "var(--il-green-dark)"
                : tone === "amber"
                  ? "#7a4200"
                  : "var(--ink-2)";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
              }}
            >
              <div style={{ fontSize: 11.5, flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.catLabel}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {r.dayLabel}
                </div>
              </div>
              <div
                className="mono"
                style={{ fontSize: 12, color: "var(--ink-3)" }}
              >
                {r.before}/{r.nec}
              </div>
              <Icon name="chevron" size={11} stroke="var(--ink-3)" />
              <div
                className="mono"
                style={{ fontSize: 13, fontWeight: 700, color }}
              >
                {r.after}/{r.nec}
              </div>
              {belowAfter && (
                <Pill tone="red" size="sm">
                  bajo mínimo
                </Pill>
              )}
              {!belowAfter && belowBefore && (
                <Pill tone="green" size="sm">
                  cubierto
                </Pill>
              )}
            </div>
          );
        })}
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <Btn size="sm" variant="soft" onClick={onGoToCobertura}>
            Ver cobertura
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn size="sm" variant="ghost" onClick={onClose}>
            Cerrar
          </Btn>
        </div>
      </div>
    </div>
  );
}

function HomeLanding({
  h,
  hospital,
  onOpenDetails,
  onGoGenerate,
  onGoExport,
  onGoCoverage,
  onOpenChat,
}) {
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const hospitalName =
    hospital === "clinico" ? "Hospital Clínico" : "Hospital Gil Casares";
  const faltas = Number(h.resumen["faltas_cobertura_totales"] || 0);
  const coberturaTotal =
    Array.isArray(h.coverage) && h.coverage.length > 0 ? h.coverage.length : 1;
  const coberturaPct = Math.max(
    0,
    Math.min(
      100,
      Math.round(((coberturaTotal - faltas) / coberturaTotal) * 100),
    ),
  );
  const desv = Number(h.resumen["desviacion_media_anual_horas"] || 0).toFixed(
    1,
  );

  return (
    <div style={{ padding: isMobile ? "14px 12px 18px" : isTablet ? "20px 18px 24px" : "26px 30px 32px" }}>
      <Card
        style={{
          background:
            "linear-gradient(135deg, var(--il-green-dark) 0%, var(--il-green) 70%)",
          color: "#fff",
          border: "none",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: isMobile ? 0 : 280 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255, 209, 0, 0.18)",
                border: "1px solid rgba(255, 209, 0, 0.35)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--il-yellow-bright)",
                }}
              />
              Panel rápido
            </div>
            <div
              style={{
                fontSize: isMobile ? 23 : 30,
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: 4,
              }}
            >
              Gestión simple de {hospitalName}
            </div>
            <div
              style={{
                fontSize: isMobile ? 13.5 : 15,
                opacity: 0.92,
                marginTop: 10,
                maxWidth: 760,
              }}
            >
              Elige una acción grande para empezar. Esta portada está pensada
              para operar en pocos clics.
            </div>
          </div>
          <Btn
            size="lg"
            variant="default"
            onClick={onOpenDetails}
            icon="home"
            style={{ fontWeight: 700, minWidth: isMobile ? "100%" : 190 }}
          >
            Ver detalles
          </Btn>
        </div>
      </Card>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
              ? "repeat(2, minmax(160px, 1fr))"
              : "repeat(4, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <SummaryTile
          label="Personas activas"
          value={h.workers.length}
          sub="plantilla total"
          tone="blue"
        />
        <SummaryTile
          label="Cobertura estimada"
          value={`${coberturaPct}%`}
          sub="sobre mínimo requerido"
          tone={coberturaPct >= 95 ? "blue" : "amber"}
        />
        <SummaryTile
          label="Incidencias"
          value={faltas}
          sub="faltas de cobertura"
          tone={faltas === 0 ? "blue" : "red"}
        />
        <SummaryTile
          label="Desvío medio"
          value={`±${desv}h`}
          sub="por persona / año"
          tone="amber"
        />
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        <BigAction
          title="Generar"
          subtitle="Abrir cuadrante para generar o ajustar turnos"
          icon="wand"
          onClick={onGoGenerate}
          variant="primary"
        />
        <BigAction
          title="Exportar"
          subtitle="Ir al cuadrante para descargar el plan mensual"
          icon="download"
          onClick={onGoExport}
          variant="default"
        />
        <BigAction
          title="Revisar cobertura"
          subtitle="Ver rápidamente dónde faltan personas"
          icon="gauge"
          onClick={onGoCoverage}
          variant="soft"
        />
        <BigAction
          title="Pedir ayuda"
          subtitle="Abrir el asistente para hacer consultas directas"
          icon="chat"
          onClick={onOpenChat}
          variant="default"
        />
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, tone = "blue" }) {
  const isMobile = useIsMobile(760);
  const t = {
    blue: { bg: "var(--il-green-soft)", fg: "var(--il-green-dark)" },
    amber: { bg: "var(--il-yellow-bright-soft)", fg: "var(--il-yellow)" },
    red: { bg: "var(--il-red-soft)", fg: "#8a1f15" },
  }[tone];
  return (
    <Card
      padding={16}
      style={{
        background: t.bg,
        border:
          tone === "amber"
            ? "1px solid rgba(255, 209, 0, 0.55)"
            : "1px solid transparent",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          color: t.fg,
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: isMobile ? 28 : 34,
          lineHeight: 1.1,
          fontWeight: 800,
          marginTop: 8,
          color: t.fg,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 4, color: t.fg, opacity: 0.82, fontSize: 12.5 }}>
        {sub}
      </div>
    </Card>
  );
}

function BigAction({ title, subtitle, icon, onClick, variant }) {
  const isMobile = useIsMobile(760);
  const isImportant = title === "Generar" || title === "Revisar cobertura";
  return (
    <Card
      padding={16}
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 14,
        border: isImportant
          ? "1px solid rgba(255, 209, 0, 0.5)"
          : "1px solid var(--line)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: isImportant
            ? "var(--il-yellow-bright-soft)"
            : "var(--il-green-tint)",
          color: isImportant ? "var(--il-yellow)" : "var(--il-green-dark)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div style={{ flex: 1, width: "100%" }}>
        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-3)" }}>
          {subtitle}
        </div>
      </div>
      <Btn size={isMobile ? "md" : "lg"} variant={variant} onClick={onClick} style={{ width: isMobile ? "100%" : "auto" }}>
        Abrir
      </Btn>
    </Card>
  );
}

// ─── Sidebar (simpler, more accessible: big clear items) ───
function Sidebar({
  view,
  setView,
  hospital,
  setHospital,
  data,
  isTablet,
  mobileOpen,
  onCloseMobile,
}) {
  const items = [
    { id: "home", label: "Inicio", icon: "home", sub: "Acciones principales" },
    {
      id: "cuadrante",
      label: "Cuadrante",
      icon: "calendar",
      sub: "Ver y editar turnos",
    },
    {
      id: "cobertura",
      label: "Cobertura",
      icon: "gauge",
      sub: "Presencias por día",
    },
    {
      id: "trabajadores",
      label: "Trabajadores",
      icon: "people",
      sub: "Plantilla y datos",
    },
    { id: "horas", label: "Horas", icon: "sigma", sub: "Cómputo anual" },
  ];

  const body = (
    <aside
      style={{
        width: isTablet ? "min(86vw, 320px)" : 240,
        background: "#fff",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        position: isTablet ? "relative" : "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "#fff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 18px rgba(11, 34, 52, .08)",
              border: "1px solid rgba(255, 209, 0, 0.38)",
              padding: 8,
            }}
          >
            <img
              src="ILUNION_vertical_RGB_color.png"
              alt="ILUNION"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
              ILUNION
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
              LIMPIEZA HOSPITALARIA
            </div>
          </div>
          {isTablet && (
            <button
              onClick={onCloseMobile}
              style={{
                marginLeft: "auto",
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "none",
                background: "var(--il-green-tint)",
                color: "var(--il-green-dark)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 14px 10px" }}>
        <div
          style={{
            fontSize: 10.5,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "var(--ink-3)",
            fontWeight: 700,
            padding: "0 6px 8px",
          }}
        >
          Hospital
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
        >
          {[
            {
              id: "clinico",
              label: "H. Clínico",
              count: data.clinico.workers.length,
            },
            {
              id: "gil",
              label: "H. Gil Casares",
              count: data.gil.workers.length,
            },
          ].map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setHospital(x.id);
                if (isTablet) onCloseMobile();
              }}
              style={{
                padding: "9px 8px",
                textAlign: "center",
                border: "none",
                cursor: "pointer",
                borderRadius: 9,
                fontFamily: "inherit",
                background:
                  hospital === x.id ? "var(--il-green-soft)" : "transparent",
                color:
                  hospital === x.id ? "var(--il-green-dark)" : "var(--ink-3)",
                fontSize: 12,
                fontWeight: hospital === x.id ? 700 : 600,
                boxShadow:
                  hospital === x.id
                    ? "inset 0 0 0 1px color-mix(in oklab, var(--il-green) 35%, transparent)"
                    : "none",
              }}
            >
              {x.label}
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.8,
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                {x.count} personas
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{ height: 1, background: "var(--line)", margin: "8px 14px" }}
      />

      <nav style={{ padding: "4px 10px", flex: 1 }}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => {
              setView(it.id);
              if (isTablet) onCloseMobile();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 12px",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              background:
                view === it.id ? "var(--il-green-tint)" : "transparent",
              color: view === it.id ? "var(--il-green-dark)" : "var(--ink-1)",
              borderRadius: 10,
              marginBottom: 4,
              textAlign: "left",
              position: "relative",
            }}
          >
            {view === it.id && (
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  background: "var(--il-green)",
                  borderRadius: 2,
                }}
              />
            )}
            <div
              style={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 8,
                background:
                  view === it.id ? "var(--il-green)" : "var(--il-green-tint)",
                color: view === it.id ? "#fff" : "var(--il-green-dark)",
              }}
            >
              <Icon name={it.icon} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: view === it.id ? 700 : 600,
                }}
              >
                {it.label}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}
              >
                {it.sub}
              </div>
            </div>
          </button>
        ))}
      </nav>

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--line)",
          background: "#fafbfa",
        }}
      >
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid rgba(255, 209, 0, 0.35)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <img
            src="logo_excelentIA-removebg-preview.png"
            alt="EXCELENTIA"
            style={{
              width: "100%",
              display: "block",
              objectFit: "contain",
              borderRadius: 10,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar name="Encargada Ana" idx={2} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Encargado 1</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
              Encargado de servicio
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  if (!isTablet) return body;

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 34, 52, 0.35)",
            zIndex: 38,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 39,
          transform: mobileOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform .22s ease",
          boxShadow: mobileOpen ? "var(--shadow-lg)" : "none",
        }}
      >
        {body}
      </div>
    </>
  );
}

function TopBar({ hospital, data, onOpenChat, isTablet, isMobile, onToggleNav }) {
  const h = data[hospital];
  const hospitalName =
    hospital === "clinico" ? "Hospital Clínico" : "Hospital Gil Casares";
  const faltas = h.resumen["faltas_cobertura_totales"] || 0;
  const desv = Number(h.resumen["desviacion_media_anual_horas"] || 0).toFixed(
    1,
  );

  return (
    <header
      style={{
        minHeight: isMobile ? 58 : 64,
        borderBottom: "1px solid var(--line)",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: isMobile ? "8px 12px" : "0 28px",
        gap: isMobile ? 8 : 16,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {isTablet && (
        <button
          onClick={onToggleNav}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "none",
            background: "var(--il-green-tint)",
            color: "var(--il-green-dark)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
          title="Abrir menú"
        >
          <Icon name="filter" size={15} />
        </button>
      )}
      <div>
        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: -0.2 }}>
          {hospitalName}
        </div>
        <div style={{ fontSize: isMobile ? 10.5 : 12, color: "var(--ink-3)", marginTop: 1 }}>
          Santiago de Compostela · Cuadrante 2026
        </div>
      </div>
      <div style={{ flex: 1 }} />

      {!isTablet && (
        <>
          <MiniPill
            label="Cobertura anual"
            value={faltas === 0 ? "100%" : `${(100 - faltas / 20).toFixed(1)}%`}
            tone={faltas === 0 ? "green" : "amber"}
          />
          <MiniPill label="Desvío medio" value={`±${desv}h`} tone="blue" />
          <MiniPill
            label="Incidencias faltas"
            value={faltas}
            tone={faltas === 0 ? "green" : "red"}
          />
        </>
      )}
      {isTablet && (
        <MiniPill
          label="Cobertura"
          value={faltas === 0 ? "100%" : `${Math.max(0, Math.round(100 - faltas / 20))}%`}
          tone={faltas === 0 ? "green" : "amber"}
        />
      )}

      {!isMobile && (
        <div
          style={{
            width: 1,
            height: 26,
            background: "var(--line)",
            margin: "0 4px",
          }}
        />
      )}
      <Btn size="sm" variant="default" icon="chat" onClick={onOpenChat}>
        {isMobile ? "IA" : "Pregunta algo"}
      </Btn>
      {!isMobile && <Btn size="sm" variant="ghost" icon="bell" title="Notificaciones" />}
    </header>
  );
}

function MiniPill({ label, value, tone = "neutral" }) {
  const c =
    {
      green: { bg: "var(--il-green-soft)", fg: "var(--il-green-dark)" },
      red: { bg: "var(--il-red-soft)", fg: "#8a1f15" },
      amber: { bg: "var(--il-yellow-bright-soft)", fg: "var(--il-yellow)" },
      blue: { bg: "var(--il-blue-soft)", fg: "#1a3e74" },
      neutral: { bg: "#eceee8", fg: "var(--ink-2)" },
    }[tone] || {};
  return (
    <div
      style={{
        padding: "5px 12px",
        borderRadius: 10,
        background: c.bg,
        display: "flex",
        gap: 7,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          color: c.fg,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </span>
      <span
        className="mono"
        style={{ fontSize: 13, fontWeight: 700, color: c.fg }}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: "0 auto 14px",
            border: "3px solid var(--line)",
            borderTopColor: "var(--il-green)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ fontSize: 13 }}>Cargando cuadrantes…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
