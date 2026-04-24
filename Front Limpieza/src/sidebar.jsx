// Sidebar — left navigation

function Sidebar({ view, setView }) {
  const items = [
    { id:'cuadrante',   label:'Cuadrante',    icon:'calendar', badge:null },
    { id:'cobertura',   label:'Cobertura',    icon:'gauge',    badge:null },
    { id:'trabajadores',label:'Trabajadores', icon:'people',   badge:'216' },
    { id:'incidencias', label:'Incidencias',  icon:'alert',    badge:'7' },
    { id:'resumen',     label:'Horas / Cómputo', icon:'sigma', badge:null },
  ];

  return (
    <aside style={{
      width:232, background:'var(--surface)',
      borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column',
      position:'sticky', top:0, height:'100vh', flexShrink:0,
    }}>
      {/* Logo block */}
      <div style={{padding:'20px 20px 18px', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg, var(--il-green) 0%, var(--il-green-dark) 100%)',
            display:'grid', placeItems:'center', color:'#fff',
            boxShadow:'inset 0 -2px 0 rgba(0,0,0,.12)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20V10l8-6 8 6v10"/>
              <path d="M10 20v-6h4v6"/>
              <path d="M12 7v4M10 9h4" strokeWidth="1.6"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:14, fontWeight:700, letterSpacing:-0.3, color:'var(--ink-1)'}}>EXCELENTIA</div>
            <div style={{fontSize:11, color:'var(--ink-3)'}}>Solución para ILUNION</div>
          </div>
        </div>
      </div>

      {/* Hospital switch */}
      <div style={{padding:'14px 14px 8px'}}>
        <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:0.8,
                     color:'var(--ink-3)', fontWeight:700, padding:'0 6px 8px'}}>Hospital</div>
        <div style={{display:'flex', gap:6}}>
          <HospitalChip label="Clínico" active />
          <HospitalChip label="Gil Casares" />
        </div>
      </div>

      <div style={{height:1, background:'var(--line)', margin:'10px 14px'}}/>

      {/* Nav */}
      <nav style={{padding:'4px 10px', flex:1}}>
        {items.map(it => (
          <NavItem key={it.id}
                   active={view===it.id}
                   onClick={()=>setView(it.id)}
                   {...it}/>
        ))}
      </nav>

      {/* Bottom status */}
      <div style={{padding:'14px 16px', borderTop:'1px solid var(--line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <div style={{width:8, height:8, borderRadius:4, background:'var(--il-green)',
                       boxShadow:'0 0 0 3px color-mix(in oklab, var(--il-green) 30%, transparent)'}}/>
          <div style={{fontSize:12, color:'var(--ink-2)', fontWeight:500}}>Algoritmo conectado</div>
        </div>
        <div style={{fontSize:11, color:'var(--ink-3)', lineHeight:1.4}}>
          Última sincronización hace 4 min. Backend v0.1.
        </div>
      </div>
    </aside>
  );
}

function HospitalChip({ label, active }) {
  return (
    <div style={{
      flex:1, padding:'7px 8px', textAlign:'center',
      fontSize:12, fontWeight:active ? 600 : 500,
      borderRadius:8,
      background: active ? 'var(--il-green-soft)' : 'transparent',
      color: active ? 'var(--il-green-dark)' : 'var(--ink-3)',
      border: active ? '1px solid color-mix(in oklab, var(--il-green) 35%, transparent)' : '1px solid var(--line)',
      cursor:'pointer', userSelect:'none'
    }}>{label}</div>
  );
}

function NavItem({ label, icon, badge, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding:'9px 12px', border:'none', background: active ? 'var(--il-green-tint)' : (hover ? 'var(--line-2)' : 'transparent'),
        color: active ? 'var(--il-green-dark)' : 'var(--ink-2)',
        borderRadius:8, fontSize:13, fontWeight: active ? 600 : 500,
        cursor:'pointer', textAlign:'left', marginBottom:2, position:'relative',
        fontFamily:'inherit'
      }}
    >
      {active && <div style={{position:'absolute', left:-10, top:6, bottom:6, width:3,
                              background:'var(--il-green)', borderRadius:2}}/>}
      <Icon name={icon} size={16} stroke={active ? 'var(--il-green)' : 'currentColor'}/>
      <span style={{flex:1}}>{label}</span>
      {badge && (
        <span style={{
          fontSize:10.5, padding:'1px 7px', borderRadius:999,
          background: active ? 'var(--il-green)' : 'var(--line)',
          color: active ? '#fff' : 'var(--ink-2)',
          fontWeight:600, fontFamily:'JetBrains Mono, monospace'
        }}>{badge}</span>
      )}
    </button>
  );
}

Object.assign(window, { Sidebar });
