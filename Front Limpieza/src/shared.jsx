// Shared helpers, constants, atomic components

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_LETTER = ['D','L','M','X','J','V','S'];

const SHIFT_OPTIONS = [
  { code:'M',   name:'Mañana',            group:'Turno',      hours:7,  icon:'sun' },
  { code:'T',   name:'Tarde',             group:'Turno',      hours:7,  icon:'sunset' },
  { code:'N',   name:'Noche',             group:'Turno',      hours:10, icon:'moon' },
  { code:'D',   name:'Descanso',          group:'Descanso',   hours:0,  icon:'rest' },
  { code:'V26', name:'Vacaciones 2026',   group:'Vacaciones', hours:0 },
  { code:'V25', name:'Vacaciones 2025',   group:'Vacaciones', hours:0 },
  { code:'AV',  name:'Adicional vac.',    group:'Vacaciones', hours:0 },
  { code:'B',   name:'Baja',              group:'Ausencia',   hours:7, computa:true },
  { code:'A',   name:'Asuntos propios',   group:'Permiso',    hours:0 },
  { code:'PF',  name:'Permiso familiar',  group:'Permiso',    hours:7, computa:true },
  { code:'PS',  name:'Permiso sindical',  group:'Permiso',    hours:7, computa:true },
  { code:'PR',  name:'Permiso retribuido',group:'Permiso',    hours:7, computa:true },
  { code:'L',   name:'Lactancia',         group:'Permiso',    hours:7, computa:true },
  { code:'RJ',  name:'Reducción jornada', group:'Permiso',    hours:0 },
  { code:'PSS', name:'Permiso sin sueldo',group:'Permiso',    hours:0 },
  { code:'E',   name:'Excedencia',        group:'Ausencia',   hours:0 },
];
const SHIFT_BY_CODE = Object.fromEntries(SHIFT_OPTIONS.map(x => [x.code, x]));

// festivos Galicia 2026
const FESTIVOS_2026 = new Set([
  '2026-01-01','2026-01-06','2026-04-03','2026-05-01',
  '2026-07-25','2026-08-15','2026-10-12','2026-11-01',
  '2026-12-06','2026-12-08','2026-12-25'
]);

function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function ymd(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function isWeekend(y,m,d){ const w = new Date(y,m,d).getDay(); return w===0 || w===6; }
function isFestivo(y,m,d){ return FESTIVOS_2026.has(ymd(y,m,d)); }
function dayLetter(y,m,d){ return DAY_LETTER[new Date(y,m,d).getDay()]; }

function Icon({ name, size=16, stroke='currentColor', strokeWidth=1.8 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke,
              strokeWidth, strokeLinecap:'round', strokeLinejoin:'round' };
  const I = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    people:   <><circle cx="9" cy="9" r="3.5"/><path d="M2.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="8.5" r="2.7"/><path d="M16 14.3c2.6.3 4.6 1.9 5.5 4.7"/></>,
    gauge:    <><path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-4"/><circle cx="12" cy="15" r="1.2"/></>,
    alert:    <><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18.2v.1"/></>,
    sigma:    <><path d="M6 4h12l-6 8 6 8H6"/></>,
    chat:     <><path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z"/></>,
    plus:     <><path d="M12 5v14M5 12h14"/></>,
    search:   <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    chevron:  <><path d="m9 6 6 6-6 6"/></>,
    download: <><path d="M12 4v12m0 0 5-5m-5 5-5-5M4 20h16"/></>,
    check:    <><path d="m5 12 5 5L20 7"/></>,
    close:    <><path d="M6 6l12 12M18 6 6 18"/></>,
    filter:   <><path d="M4 5h16M7 12h10M10 19h4"/></>,
    bell:     <><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    sun:      <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>,
    sunset:   <><path d="M12 10V3M8 6l4-3 4 3M3 18h18M5 14a7 7 0 0 1 14 0M2 22h20"/></>,
    moon:     <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></>,
    rest:     <><path d="M4 18h16M6 18V8a4 4 0 0 1 4-4h8a2 2 0 0 1 2 2v12"/></>,
    sparkle:  <><path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2.5 2.5 1L20 19.5 19 22l-1-2.5L15.5 18.5 18 17.5z"/></>,
    wand:     <><path d="m15 4 5 5M8 11l5 5M4 4h2M4 4v2M18 2h2M18 2v2M3 20l10-10"/></>,
    warn:     <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16v.1"/></>,
    send:     <><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></>,
    history:  <><path d="M12 8v4l2.5 2.5"/><circle cx="12" cy="12" r="9"/><path d="M3 12a9 9 0 0 0 15.5 6.3"/></>,
    mic:      <><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v4.5A3.5 3.5 0 0 0 12 15Z"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6"/></>,
    home:     <><path d="M4 11 12 4l8 7"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/></>,
  };
  return <svg {...p}>{I[name] || null}</svg>;
}

function Pill({ children, tone='neutral', size='md' }) {
  const tones = {
    neutral:{bg:'#eceee8', fg:'#474b42'},
    green:  {bg:'var(--il-green-soft)', fg:'var(--il-green-dark)'},
    red:    {bg:'var(--il-red-soft)', fg:'#8a1f15'},
    amber:  {bg:'var(--il-amber-soft)', fg:'#7a4200'},
    blue:   {bg:'var(--il-blue-soft)', fg:'#1a3e74'},
    slate:  {bg:'#e7ebef', fg:'#334155'},
  };
  const t = tones[tone] || tones.neutral;
  const pad = size==='sm' ? '2px 8px' : '3px 11px';
  const fs  = size==='sm' ? 11 : 12;
  return <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    background:t.bg, color:t.fg, padding:pad, borderRadius:999,
    fontSize:fs, fontWeight:600, lineHeight:1.3, whiteSpace:'nowrap'
  }}>{children}</span>;
}

function Btn({ children, variant='default', size='md', icon, iconRight, onClick, style={}, disabled, title }) {
  const sizes = {
    sm:{h:30, pad:'0 11px', fs:12.5, r:8},
    md:{h:38, pad:'0 16px', fs:13.5, r:10},
    lg:{h:46, pad:'0 22px', fs:15, r:12},
  };
  const s = sizes[size];
  const V = {
    primary:{ bg:'var(--il-green)', fg:'#fff', border:'1px solid var(--il-green)',
              hover:'var(--il-green-dark)' },
    default:{ bg:'#fff', fg:'var(--ink-1)', border:'1px solid var(--line)',
              hover:'var(--il-green-tint)' },
    ghost:  { bg:'transparent', fg:'var(--ink-2)', border:'1px solid transparent',
              hover:'#eef0ec' },
    danger: { bg:'#fff', fg:'#8a1f15', border:'1px solid var(--il-red-soft)',
              hover:'var(--il-red-soft)' },
    soft:   { bg:'var(--il-green-tint)', fg:'var(--il-green-dark)', border:'1px solid transparent',
              hover:'var(--il-green-soft)' }
  };
  const v = V[variant];
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
        height:s.h, padding: children ? s.pad : 0, minWidth: children ? 0 : s.h,
        fontSize:s.fs, fontWeight:600, borderRadius:s.r,
        background:(hover && !disabled) ? v.hover : v.bg, color:v.fg, border:v.border,
        cursor:disabled ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        opacity:disabled?0.5:1, transition:'background .12s ease', ...style
      }}>
      {icon && <Icon name={icon} size={s.fs+3}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fs+3}/>}
    </button>
  );
}

function Card({ children, padding=18, style={} }) {
  return <div style={{
    background:'#fff', border:'1px solid var(--line)',
    borderRadius:14, padding, boxShadow:'var(--shadow-sm)', ...style
  }}>{children}</div>;
}

function Avatar({ name, idx=0, size=30 }) {
  const parts = (name||'').split(/\s+/).filter(x=>x && x.length>2).slice(0,2);
  const ini = parts.map(x=>x[0]).join('').toUpperCase() || '?';
  const hues = [155, 28, 75, 240, 200, 330, 45, 195];
  const h = hues[idx % hues.length];
  return <div style={{
    width:size, height:size, borderRadius:size/3, flexShrink:0,
    background:`oklch(0.92 0.05 ${h})`, color:`oklch(0.38 0.12 ${h})`,
    display:'grid', placeItems:'center',
    fontSize:size*0.35, fontWeight:700, letterSpacing:0.2
  }}>{ini}</div>;
}

function useIsMobile(breakpoint = 900) {
  const getValue = () =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false;
  const [isMobile, setIsMobile] = React.useState(getValue);

  React.useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}

Object.assign(window, {
  MONTHS_ES, MONTHS_SHORT, DAY_LETTER,
  SHIFT_OPTIONS, SHIFT_BY_CODE, FESTIVOS_2026,
  daysInMonth, ymd, isWeekend, isFestivo, dayLetter,
  Icon, Pill, Btn, Card, Avatar, useIsMobile
});
