import React, { useEffect, useMemo, useState } from "react";
import { ChatbotFab, ChatbotPanel } from "./components/chatbot";
import { CoverageToast } from "./components/CoverageToast";
import { GenerationRequiredState } from "./components/GenerationRequiredState";
import { AppShell } from "./components/layout";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { formatHospitalLabel } from "./lib/format";
import { readStoredValue, writeStoredValue } from "./lib/storage";
import { normalizeLoadedDashboardData } from "./services/dataService";
import { getSchedulerStatus, requestScheduleGeneration } from "./services/schedulerGateway";
import { CoverageView } from "./views/CoverageView";
import { HomeView } from "./views/HomeView";
import { HoursView } from "./views/HoursView";
import { ScheduleView } from "./views/ScheduleView";
import { WorkersView } from "./views/WorkersView";

function ErrorState({ message }) {
  return (
    <div className="loading-state">
      <div className="loading-state-inner" style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-red)" }}>
          No se pudo cargar el dashboard
        </div>
        <p style={{ color: "var(--color-ink-soft)" }}>{message}</p>
      </div>
    </div>
  );
}

function createEmptyHospitalData(key) {
  return {
    key,
    workers: [],
    monthlySchedule: {},
    coverage: [],
    annualHours: {},
    monthlyHours: {},
    summary: {
      hospital: key,
      year: 2026,
      summerRule: "",
      totalCoverageGaps: 0,
      averageDeviationHours: 0,
    },
  };
}

export default function App() {
  const [data, setData] = useState(null);
  const [activeView, setActiveView] = useState(() =>
    readStoredValue("fl-view", "home"),
  );
  const [activeHospital, setActiveHospital] = useState(() =>
    readStoredValue("fl-hospital", "clinico"),
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editsByHospital, setEditsByHospital] = useState({
    clinico: {},
    gil: {},
  });
  const [generatedHospitals, setGeneratedHospitals] = useState({
    clinico: false,
    gil: false,
  });
  const [generationStateByHospital, setGenerationStateByHospital] = useState({
    clinico: {
      pending: false,
      latestExcelUrl: "",
      statusMessage: null,
    },
    gil: {
      pending: false,
      latestExcelUrl: "",
      statusMessage: null,
    },
  });
  const [toast, setToast] = useState(null);

  const isTablet = useBreakpoint(1040);
  const schedulerStatus = getSchedulerStatus();

  useEffect(() => {
    writeStoredValue("fl-view", activeView);
  }, [activeView]);

  useEffect(() => {
    writeStoredValue("fl-hospital", activeHospital);
  }, [activeHospital]);

  useEffect(() => {
    if (!isTablet) {
      setMobileSidebarOpen(false);
    }
  }, [isTablet]);

  const visibleData = useMemo(() => {
    const emptyClinico = createEmptyHospitalData("clinico");
    const emptyGil = createEmptyHospitalData("gil");

    return {
      hospitals: {
        clinico: generatedHospitals.clinico
          ? data?.hospitals?.clinico ?? emptyClinico
          : emptyClinico,
        gil: generatedHospitals.gil
          ? data?.hospitals?.gil ?? emptyGil
          : emptyGil,
      },
      presences: data?.presences ?? {},
    };
  }, [data, generatedHospitals]);

  const currentHospitalData = useMemo(
    () => visibleData.hospitals[activeHospital],
    [activeHospital, visibleData],
  );

  const currentEdits = editsByHospital[activeHospital] || {};
  const currentGenerationState = generationStateByHospital[activeHospital];
  const currentHospitalGenerated = generatedHospitals[activeHospital];

  function setCurrentEdits(nextEdits) {
    setEditsByHospital((current) => ({
      ...current,
      [activeHospital]: nextEdits,
    }));
  }

  async function handleGenerateForHospital(hospitalKey, options = {}) {
    const { openSchedule = false } = options;

    setGenerationStateByHospital((current) => ({
      ...current,
      [hospitalKey]: {
        ...current[hospitalKey],
        pending: true,
        statusMessage: null,
      },
    }));

    if (openSchedule) {
      setActiveView("schedule");
    }

    try {
      const response = await requestScheduleGeneration({
        hospital: hospitalKey,
        year: 2026,
      });

      if (!response?.data) {
        throw new Error("La generacion no devolvio datos de dashboard.");
      }

      const normalized = normalizeLoadedDashboardData(response.data);
      setData(normalized);
      setGeneratedHospitals((current) => ({
        ...current,
        [hospitalKey]: true,
      }));
      setEditsByHospital((current) => ({
        ...current,
        [hospitalKey]: {},
      }));
      setGenerationStateByHospital((current) => ({
        ...current,
        [hospitalKey]: {
          pending: false,
          latestExcelUrl: response.excelUrl || "",
          statusMessage: {
            tone: "success",
            text: "Cuadrante regenerado con el algoritmo y datos del dashboard actualizados.",
          },
        },
      }));
    } catch (nextError) {
      setGenerationStateByHospital((current) => ({
        ...current,
        [hospitalKey]: {
          ...current[hospitalKey],
          pending: false,
          statusMessage: {
            tone: "warning",
            text: nextError.message || String(nextError),
          },
        },
      }));
    }
  }

  let content = null;

  if (!currentHospitalGenerated) {
    const hospitalLabel = formatHospitalLabel(activeHospital);
    const baseProps = {
      onGenerate: () =>
        handleGenerateForHospital(activeHospital, {
          openSchedule: true,
        }),
      pending: currentGenerationState.pending,
      schedulerStatus,
      statusMessage: currentGenerationState.statusMessage,
    };

    if (activeView === "home") {
      content = (
        <GenerationRequiredState
          {...baseProps}
          title={`Aun no se ha generado el cuadrante de ${hospitalLabel}`}
          description="Al iniciar el dashboard no se muestra ningun calendario previo. Para cargar datos en esta sesion, genera primero el hospital seleccionado."
          ctaLabel="Generar y abrir cuadrante"
        />
      );
    } else {
      content = (
        <GenerationRequiredState
          {...baseProps}
          title={`La vista de ${hospitalLabel} esta vacia hasta generar`}
          description="Este hospital no mostrara cuadrante, cobertura, plantilla ni computo anual hasta que lances una generacion nueva en esta sesion."
          ctaLabel="Generar cuadrante"
        />
      );
    }
  } else if (activeView === "schedule") {
    content = (
      <ScheduleView
        hospitalData={currentHospitalData}
        hospitalKey={activeHospital}
        presences={visibleData.presences}
        edits={currentEdits}
        setEdits={setCurrentEdits}
        schedulerStatus={schedulerStatus}
        onShowToast={setToast}
        latestExcelUrl={currentGenerationState.latestExcelUrl}
        statusMessage={currentGenerationState.statusMessage}
        generationPending={currentGenerationState.pending}
        onGenerate={() => handleGenerateForHospital(activeHospital)}
      />
    );
  } else if (activeView === "coverage") {
    content = (
      <CoverageView
        hospitalData={currentHospitalData}
        hospitalKey={activeHospital}
        presences={visibleData.presences}
        edits={currentEdits}
      />
    );
  } else if (activeView === "workers") {
    content = <WorkersView hospitalData={currentHospitalData} />;
  } else if (activeView === "hours") {
    content = <HoursView hospitalData={currentHospitalData} />;
  } else {
    content = (
      <HomeView
        hospitalData={currentHospitalData}
        hospitalKey={activeHospital}
        schedulerStatus={schedulerStatus}
        onViewChange={setActiveView}
        onOpenChat={() => setChatOpen(true)}
      />
    );
  }

  return (
    <>
      <AppShell
        data={visibleData}
        activeHospital={activeHospital}
        onHospitalChange={setActiveHospital}
        activeView={activeView}
        onViewChange={setActiveView}
        currentHospitalData={currentHospitalData}
        currentHospitalGenerated={currentHospitalGenerated}
        generatedHospitals={generatedHospitals}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((current) => !current)}
        isTablet={isTablet}
        mobileSidebarOpen={mobileSidebarOpen}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
      >
        <div className="screen">{content}</div>
      </AppShell>

      <ChatbotFab onToggle={() => setChatOpen((current) => !current)} />

      {chatOpen ? (
        <ChatbotPanel
          data={visibleData}
          hospitalKey={activeHospital}
          onClose={() => setChatOpen(false)}
        />
      ) : null}

      {toast ? (
        <CoverageToast
          toast={toast}
          onClose={() => setToast(null)}
          onGoToCoverage={() => {
            setActiveView("coverage");
            setToast(null);
          }}
        />
      ) : null}
    </>
  );
}
