import React from "react";
import { HOSPITAL_OPTIONS } from "../lib/constants";
import { formatHospitalLabel, formatPercent } from "../lib/format";
import { Button, Icon } from "./ui";

const NAV_ITEMS = [
  { id: "home", label: "Inicio", subtitle: "Acciones principales", icon: "home" },
  {
    id: "schedule",
    label: "Cuadrante",
    subtitle: "Ver y editar turnos",
    icon: "calendar",
  },
  {
    id: "coverage",
    label: "Cobertura",
    subtitle: "Comparar con minimo diario",
    icon: "gauge",
  },
  {
    id: "workers",
    label: "Plantilla",
    subtitle: "Observaciones y plazas",
    icon: "people",
  },
  { id: "hours", label: "Horas", subtitle: "Computo anual", icon: "sigma" },
];

function buildCoveragePercentage(hospitalData) {
  const gaps = Number(hospitalData.summary?.totalCoverageGaps || 0);
  const coverageRows = hospitalData.coverage?.length || 0;

  if (!coverageRows) {
    return 100;
  }

  return Math.max(0, ((coverageRows - gaps) / coverageRows) * 100);
}

function SidebarContent({
  activeView,
  onViewChange,
  activeHospital,
  onHospitalChange,
  data,
  onCloseMobile,
  mobile,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-logo">
            <img src="/assets/ilunion-logo.png" alt="ILUNION" />
          </div>
          <div>
            <div className="brand-title">EXCELENTIA</div>
            <div className="brand-subtitle">Limpieza hospitalaria</div>
          </div>
          {mobile ? (
            <Button variant="ghost" size="sm" icon="close" onClick={onCloseMobile} />
          ) : null}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Hospital</div>
        <div className="hospital-switch">
          {HOSPITAL_OPTIONS.map((option) => {
            const count = data.hospitals[option.id].workers.length;
            return (
              <button
                key={option.id}
                className={`hospital-chip ${activeHospital === option.id ? "active" : ""}`.trim()}
                onClick={() => {
                  onHospitalChange(option.id);
                  onCloseMobile?.();
                }}
              >
                <div>{option.label}</div>
                <div style={{ fontSize: 10.5, marginTop: 4 }}>{count} personas</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section" style={{ paddingTop: 12 }}>
        <div className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeView === item.id ? "active" : ""}`.trim()}
              onClick={() => {
                onViewChange(item.id);
                onCloseMobile?.();
              }}
            >
              <div className="sidebar-link-icon">
                <Icon name={item.icon} size={18} />
              </div>
              <div>
                <div className="sidebar-link-title">{item.label}</div>
                <div className="sidebar-link-subtitle">{item.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-contact-card">
          <div className="sidebar-contact-logo">
            <img
              src="/assets/logo_excelentIA-removebg-preview.png"
              alt="ExcelentIA"
            />
          </div>
          <div className="sidebar-contact-copy">
            <div className="sidebar-contact-name">Encargado 1</div>
            <div>
              <div className="sidebar-contact-role">(Encargado del servicio)</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  data,
  activeHospital,
  onHospitalChange,
  activeView,
  onViewChange,
  currentHospitalData,
  schedulerStatus,
  chatOpen,
  onToggleChat,
  isTablet,
  mobileSidebarOpen,
  onOpenMobileSidebar,
  onCloseMobileSidebar,
  children,
}) {
  const coveragePct = buildCoveragePercentage(currentHospitalData);
  const gaps = currentHospitalData.summary?.totalCoverageGaps || 0;
  const deviation = currentHospitalData.summary?.averageDeviationHours || 0;
  return (
    <div className="app-shell">
      {!isTablet ? (
        <SidebarContent
          activeView={activeView}
          onViewChange={onViewChange}
          activeHospital={activeHospital}
          onHospitalChange={onHospitalChange}
          data={data}
        />
      ) : (
        <>
          {mobileSidebarOpen ? (
            <div className="mobile-overlay" onClick={onCloseMobileSidebar} />
          ) : null}
          <div className={`mobile-sidebar ${mobileSidebarOpen ? "open" : ""}`.trim()}>
            <SidebarContent
              activeView={activeView}
              onViewChange={onViewChange}
              activeHospital={activeHospital}
              onHospitalChange={onHospitalChange}
              data={data}
              onCloseMobile={onCloseMobileSidebar}
              mobile
            />
          </div>
        </>
      )}

      <main className="app-main">
        <header className="topbar">
          {isTablet ? (
            <Button variant="soft" size="sm" icon="menu" onClick={onOpenMobileSidebar} />
          ) : null}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {formatHospitalLabel(activeHospital)}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
              Santiago de Compostela · cuadrante 2026
            </div>
          </div>
          <div className="toolbar-spacer" />
          <div className="topbar-summary">
            <div className="mini-pill">
              Cobertura <strong>{formatPercent(coveragePct)}</strong>
            </div>
            <div className="mini-pill">
              Incidencias <strong>{gaps}</strong>
            </div>
            <div className="mini-pill">
              Desvio <strong>{deviation >= 0 ? `+${deviation}` : deviation}h</strong>
            </div>
          </div>
          <Button variant="default" size="sm" icon="chat" onClick={onToggleChat}>
            {chatOpen ? "Cerrar ayuda" : "Asistente"}
          </Button>
          {!isTablet ? <Button variant="ghost" size="sm" icon="bell" /> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
