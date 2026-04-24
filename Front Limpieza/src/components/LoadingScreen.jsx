import React from "react";

export function LoadingScreen({ label = "Cargando dashboard..." }) {
  return (
    <div className="loading-state">
      <div className="loading-state-inner">
        <div className="loading-spinner" />
        <div>{label}</div>
      </div>
    </div>
  );
}
