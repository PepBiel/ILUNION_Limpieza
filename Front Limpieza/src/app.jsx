import React, { useEffect, useMemo, useState } from "react";
import { ChatbotFab, ChatbotPanel } from "./components/chatbot";
import { CoverageToast } from "./components/CoverageToast";
import { AppShell } from "./components/layout";
import { LoadingScreen } from "./components/LoadingScreen";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { readStoredValue, writeStoredValue } from "./lib/storage";
import { loadDashboardData, normalizeLoadedDashboardData } from "./services/dataService";
import { getSchedulerStatus } from "./services/schedulerGateway";
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

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
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
  const [toast, setToast] = useState(null);

  const isTablet = useBreakpoint(1040);
  const schedulerStatus = getSchedulerStatus();

  useEffect(() => {
    loadDashboardData()
      .then((nextData) => setData(nextData))
      .catch((nextError) => setError(nextError.message || String(nextError)));
  }, []);

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

  const currentHospitalData = useMemo(
    () => data?.hospitals?.[activeHospital] ?? null,
    [activeHospital, data],
  );

  const currentEdits = editsByHospital[activeHospital] || {};

  function setCurrentEdits(nextEdits) {
    setEditsByHospital((current) => ({
      ...current,
      [activeHospital]: nextEdits,
    }));
  }

  function handleGenerated(nextRawData, hospitalKey) {
    if (!nextRawData) {
      return;
    }

    const normalized = normalizeLoadedDashboardData(nextRawData);
    setData(normalized);
    setEditsByHospital((current) => ({
      ...current,
      [hospitalKey]: {},
    }));
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data || !currentHospitalData) {
    return <LoadingScreen />;
  }

  let content = null;

  if (activeView === "schedule") {
    content = (
      <ScheduleView
        hospitalData={currentHospitalData}
        hospitalKey={activeHospital}
        presences={data.presences}
        edits={currentEdits}
        setEdits={setCurrentEdits}
        schedulerStatus={schedulerStatus}
        onShowToast={setToast}
        onGenerated={handleGenerated}
      />
    );
  } else if (activeView === "coverage") {
    content = (
      <CoverageView
        hospitalData={currentHospitalData}
        hospitalKey={activeHospital}
        presences={data.presences}
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
        data={data}
        activeHospital={activeHospital}
        onHospitalChange={setActiveHospital}
        activeView={activeView}
        onViewChange={setActiveView}
        currentHospitalData={currentHospitalData}
        schedulerStatus={schedulerStatus}
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
          data={data}
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
