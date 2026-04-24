// Incidencias view — list & register new incidents

function ViewIncidencias({ data }) {
  const sampleIncidents = React.useMemo(() => buildSampleIncidents(data), [data]);

  const byCode = {};
  INCIDENCIAS_META.forEach(m => { if (m.group!=='Turno' && m.group!=='Descanso') byCode[m.code] = 0; });
  sampleIncidents.forEach(i => { byCode[i.code] = (byCode[i.code]||0) + 1; });

  const [filter, setFilter] = React.useState('ALL');
  const filtered = sampleIncidents.filter(i => filter==='ALL' || i.code===filter);

  return (
    <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:18}}>
      <SectionTitle subtitle="Permisos, bajas, vacaciones y ajustes del cuadrante"
        right={<Btn variant="primary" size="sm" icon="plus">Registrar incidencia</Btn>}>
        Incidencias
      </SectionTitle>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <Stat label="Incidencias activas" value={sampleIncidents.length} tone="amber"/>
        <Stat label="Bajas en curso" value={byCode['B']||0} tone="red"/>
        <Stat label="Vacaciones 2026" value={byCode['V26']||0} tone="green"/>
        <Stat label="Modificaciones hoy" value="12" trend="≈ 30% cuadrante"/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:16}}>
        {/* Incidencia types sidebar */}
        <Card padding={0}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line-2)',
                       fontSize:12, fontWeight:600}}>Tipos de incidencia</div>
          <div style={{padding:'8px 8px 12px', maxHeight:'calc(100vh - 380px)', overflow:'auto'}}>
            <TypeRow code="ALL" name="Todas" count={sampleIncidents.length}
                     active={filter==='ALL'} onClick={()=>setFilter('ALL')}/>
            {['Permiso','Ausencia','Vacaciones'].map(group => (
              <div key={group}>
                <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:0.6,
                             color:'var(--ink-3)', fontWeight:700, padding:'10px 8px 4px'}}>{group}</div>
                {INCIDENCIAS_META.filter(m=>m.group===group).map(m => (
                  <TypeRow key={m.code} code={m.code} name={m.name} count={byCode[m.code]||0}
                           active={filter===m.code} onClick={()=>setFilter(m.code)}/>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* List */}
        <Card padding={0}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line-2)',
                       display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontSize:13, fontWeight:600}}>
              {filter==='ALL' ? 'Todas las incidencias' : INC_BY_CODE[filter]?.name}
              <span style={{fontSize:11, color:'var(--ink-3)', fontWeight:500, marginLeft:8}}>
                · {filtered.length} registro{filtered.length!==1?'s':''}
              </span>
            </div>
            <div style={{display:'flex', gap:6}}>
              <Btn size="sm" variant="ghost" icon="filter">Filtrar</Btn>
              <Btn size="sm" variant="ghost" icon="download">Exportar</Btn>
            </div>
          </div>

          <div style={{maxHeight:'calc(100vh - 380px)', overflow:'auto'}}>
            {filtered.map(inc => <IncidentRow key={inc.id} inc={inc}/>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TypeRow({ code, name, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', display:'flex', alignItems:'center', gap:10,
      padding:'7px 10px', border:'none', background: active ? 'var(--il-green-tint)' : 'transparent',
      borderRadius:6, cursor:'pointer', textAlign:'left', fontFamily:'inherit',
      color: active ? 'var(--il-green-dark)' : 'var(--ink-2)', marginBottom:1
    }}>
      {code !== 'ALL'
        ? <span className={`s-${code}`} style={{
            width:30, height:20, borderRadius:4, display:'grid', placeItems:'center',
            fontSize:10, fontWeight:700
          }}>{code}</span>
        : <span style={{width:30, height:20, borderRadius:4, background:'var(--line-2)',
                        display:'grid', placeItems:'center', fontSize:10, fontWeight:700,
                        color:'var(--ink-3)'}}>·</span>}
      <span style={{flex:1, fontSize:12.5, fontWeight: active?600:500}}>{name}</span>
      <span className="mono" style={{fontSize:11, color:'var(--ink-3)', fontWeight:500}}>{count}</span>
    </button>
  );
}

function IncidentRow({ inc }) {
  const meta = INC_BY_CODE[inc.code];
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      borderBottom:'1px solid var(--line-2)'
    }}>
      <span className={`s-${inc.code}`} style={{
        width:36, height:36, borderRadius:8, display:'grid', placeItems:'center',
        fontSize:12, fontWeight:700
      }}>{inc.code}</span>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500, color:'var(--ink-1)'}}>{inc.worker}</div>
        <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:1}}>
          {meta.name} · {inc.centro} · {inc.dateRange}
        </div>
      </div>
      <div style={{fontSize:11, color:'var(--ink-3)'}}>{inc.note}</div>
      <Pill tone={inc.estado==='Aprobada' ? 'green' : (inc.estado==='Pendiente' ? 'amber' : 'neutral')}>
        {inc.estado}
      </Pill>
      <Btn variant="ghost" size="sm" icon="chevron"/>
    </div>
  );
}

function buildSampleIncidents(data) {
  const out = [];
  const codes = ['V26','B','PF','A','PS','RJ','PR','L','V25'];
  const estados = ['Aprobada','Aprobada','Aprobada','Pendiente','Aprobada','Aprobada'];
  const notes = [
    'Cobertura asignada', 'Sustitución pendiente', 'Solicitado 14 días antes',
    'Notificación SS', 'Reducción 20%', 'Documentación completa', ''
  ];
  for (let i=0; i<18; i++) {
    const w = data.workers[(i*11) % data.workers.length];
    const code = codes[i % codes.length];
    const d1 = (i*3)+2;
    const d2 = d1 + (code==='V26'?7:(code==='B'?14:1));
    out.push({
      id:i+1, code,
      worker: w.name,
      centro: w.centro === 'CLINICO' ? 'H. Clínico' : 'H. Gil Casares',
      dateRange: `${String(d1).padStart(2,'0')}–${String(d2).padStart(2,'0')} abr 2026`,
      note: notes[i%notes.length],
      estado: estados[i%estados.length]
    });
  }
  return out;
}

Object.assign(window, { ViewIncidencias });
