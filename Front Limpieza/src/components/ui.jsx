import React from "react";

export function Icon({
  name,
  size = 16,
  stroke = "currentColor",
  strokeWidth = 1.8,
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="9" r="3.5" />
        <path d="M2.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" />
        <circle cx="17" cy="8.5" r="2.7" />
        <path d="M16 14.3c2.6.3 4.6 1.9 5.5 4.7" />
      </>
    ),
    gauge: (
      <>
        <path d="M4 15a8 8 0 1 1 16 0" />
        <path d="M12 15l4-4" />
        <circle cx="12" cy="15" r="1.2" />
      </>
    ),
    sigma: (
      <>
        <path d="M6 4h12l-6 8 6 8H6" />
      </>
    ),
    chat: (
      <>
        <path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    chevron: (
      <>
        <path d="m9 6 6 6-6 6" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v12m0 0 5-5m-5 5-5-5M4 20h16" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 5 5L20 7" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12M18 6 6 18" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    bell: (
      <>
        <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
      </>
    ),
    sunset: (
      <>
        <path d="M12 10V3M8 6l4-3 4 3M3 18h18M5 14a7 7 0 0 1 14 0M2 22h20" />
      </>
    ),
    moon: (
      <>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </>
    ),
    rest: (
      <>
        <path d="M4 18h16M6 18V8a4 4 0 0 1 4-4h8a2 2 0 0 1 2 2v12" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2.5 2.5 1L20 19.5 19 22l-1-2.5L15.5 18.5 18 17.5z" />
      </>
    ),
    wand: (
      <>
        <path d="m15 4 5 5M8 11l5 5M4 4h2M4 4v2M18 2h2M18 2v2M3 20l10-10" />
      </>
    ),
    warn: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16v.1" />
      </>
    ),
    send: (
      <>
        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
      </>
    ),
    history: (
      <>
        <path d="M12 8v4l2.5 2.5" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
    mic: (
      <>
        <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v4.5A3.5 3.5 0 0 0 12 15Z" />
        <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
      </>
    ),
    home: (
      <>
        <path d="M4 11 12 4l8 7" />
        <path d="M6 10.5V20h12v-9.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
  };

  return <svg {...props}>{icons[name] || null}</svg>;
}

export function Button({
  children,
  variant = "default",
  size = "md",
  icon,
  iconRight,
  className = "",
  style,
  ...props
}) {
  return (
    <button
      {...props}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      style={style}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={16} /> : null}
    </button>
  );
}

export function Card({ children, className = "", style }) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function Pill({ children, tone = "neutral", size = "md" }) {
  return <span className={`pill pill-${tone} pill-${size}`}>{children}</span>;
}

export function Avatar({ name, idx = 0, size = 34 }) {
  const parts = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts.map((part) => part[0]).join("").toUpperCase() || "?";
  const hue = [210, 36, 72, 166, 20, 250][idx % 6];

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `oklch(0.92 0.04 ${hue})`,
        color: `oklch(0.42 0.1 ${hue})`,
      }}
    >
      {initials}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="control control-search">
      <Icon name="search" size={15} stroke="var(--color-muted)" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function SelectField({ value, onChange, options }) {
  return (
    <select
      className="control control-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Modal({ children, onClose, width = 620 }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function MetricCard({ label, value, detail, tone = "neutral" }) {
  return (
    <Card className={`metric-card metric-card-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </Card>
  );
}
