// Workers list, Cobertura grid (basada en PRESENCIAS reales), Horas progress

// ── Helpers para cobertura basada en PRESENCIAS ────────
// Mapea turnoBase del trabajador + puesto a la clave de PRESENCIAS
function presenciaKey(puesto, turno){
  const isPeon = (puesto||'').toUpperCase().includes('PEON') || (puesto||'').toUpperCase().includes('PEÓN');
  const t = (turno||'').toUpperCase();
  const tcode = t.startsWith('M') ? 'T.M' : t.startsWith('T') ? 'T.T' : t.startsWith('N') ? 'T.N' : null;
  if (!tcode) return null;
  return (isPeon ? 'PEON ' : 'LIMPIADOR ') + tcode;
}
// Día de la semana → clave de PRESENCIAS
function dayKeyForDate(y, m, d){
  if (isFestivo(y, m, d)) return 'Festivos';
  const dow = new Date(y, m, d).getDay(); // 0=Dom
  return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dow];
}

// Cuenta asignaciones reales en una fecha para un (puesto, turno), aplicando edits
function countAssigned(h, edits, year, monthIdx, day, cat){
  // cat p.ej. "LIMPIADOR T.M"
  const isPeon = cat.startsWith('PEON');
  const tcode = cat.endsWith('T.M') ? 'M' : cat.endsWith('T.T') ? 'T' : cat.endsWith('T.N') ? 'N' : null;
  if (!tcode) return 0;
  let count = 0;
  for (const w of h.workers){
    const puestoEsPeon = (w.puesto||'').toUpperCase().includes('PEON') || (w.puesto||'').toUpperCase().includes('PEÓN');
    if (isPeon !== puestoEsPeon) continue;
    // turno del día
    const editKey = `${w.name}|${monthIdx}|${day-1}`;
    let v;
    if (edits && edits[editKey] !== undefined) v = edits[editKey];
    else {
      const sched = h.monthlySched[w.name];
      v = sched && sched[monthIdx+1] ? (sched[monthIdx+1][day-1]||'').toString().trim() : '';
    }
    if ((v||'').toUpperCase() === tcode) count++;
  }
  return count;
}

function requiredFor(presencias, hospitalKey, dayKey, cat){
  const p = presencias && presencias[hospitalKey];
  if (!p || !p[dayKey]) return 0;
  return Math.round(p[dayKey][cat] || 0);
}

// ── Trabajadores ───────────────────────────────────
function ViewWorkers({ h }){
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const [search, setSearch] = React.useState('');
  const [filterCat, setFilterCat] = React.useState('all');
  const [selected, setSelected] = React.useState(null);

  const categorias = React.useMemo(() => Array.from(new Set(h.workers.map(w=>w.categoria))).sort(), [h]);
  const workers = h.workers.filter(w => {
    if (filterCat!=='all' && w.categoria!==filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!w.name.toLowerCase().includes(q) &&
          !(w.observaciones||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{padding:isMobile ? '14px 12px 16px' : isTablet ? '18px 16px 20px' : '22px 28px 28px'}}>
      <div style={{display:'flex', alignItems:isMobile ? 'stretch' : 'center', flexDirection:isMobile ? 'column' : 'row', gap:12, marginBottom:18}}>
        <div>
          <div style={{fontSize:18, fontWeight:700}}>Plantilla</div>
          <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{h.workers.length} personas · turnos, categorías y observaciones</div>
        </div>
        <div style={{flex:1}}/>
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar nombre u observación…" fullWidth={isMobile}/>
        <Select value={filterCat} onChange={setFilterCat} fullWidth={isMobile} options={[
          {v:'all', l:'Todas las categorías'},
          ...categorias.map(c=>({v:c, l:c}))
        ]}/>
      </div>

      <Card padding={0}>
        <div style={{maxHeight:isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 220px)', overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:isMobile ? 760 : 'auto'}}>
            <thead>
              <tr style={{background:'#fafbfa', position:'sticky', top:0, zIndex:2}}>
                <th style={thX}>Persona</th>
                <th style={thX}>Categoría</th>
                <th style={thX}>Turno</th>
                <th style={thX}>Plazas</th>
                <th style={{...thX, minWidth:340}}>Observaciones</th>
                <th style={{...thX, textAlign:'right'}}>Horas/año</th>
                <th style={{...thX, textAlign:'right'}}>Desvío</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, wi)=> {
                const horas = h.horasAnuales[w.name];
                const desv = horas ? horas.desviacion : 0;
                const obs = w.observaciones || '';
                return (
                  <tr key={w.name} onClick={()=>setSelected(w)}
                    style={{borderTop:'1px solid var(--line)', cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafbfa'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <td style={tdX}>
                      <div style={{display:'flex', gap:10, alignItems:'center'}}>
                        <Avatar name={w.name} idx={wi} size={32}/>
                        <div style={{fontSize:13, fontWeight:600}}>{w.name}</div>
                      </div>
                    </td>
                    <td style={tdX}><Pill tone="neutral" size="sm">{w.categoria}</Pill></td>
                    <td style={tdX}>{w.turnoBase}</td>
                    <td style={{...tdX, color:'var(--ink-3)', fontSize:12}}>
                      {w.plazas
                        ? <Pill tone={String(w.plazas).includes('CORRETURNOS') ? 'amber' : 'slate'} size="sm">{String(w.plazas)}</Pill>
                        : <span style={{color:'var(--line-strong)'}}>—</span>}
                    </td>
                    <td style={{...tdX, fontSize:12, color: obs ? 'var(--ink-2)' : 'var(--line-strong)',
                                lineHeight:1.4, maxWidth:400}}>
                      {obs || '—'}
                    </td>
                    <td className="mono" style={{...tdX, textAlign:'right'}}>{w.horasAño}h</td>
                    <td className="mono" style={{...tdX, textAlign:'right',
                        color: desv<0 ? '#8a1f15' : desv>0 ? 'var(--il-green-dark)' : 'var(--ink-3)',
                        fontWeight: desv!==0 ? 700 : 500}}>
                      {desv>0?'+':''}{desv}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <WorkerDetail w={selected} h={h} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
const thX = {padding:'12px 14px', textAlign:'left', fontSize:10.5, textTransform:'uppercase',
             letterSpacing:0.6, fontWeight:700, color:'var(--ink-3)', whiteSpace:'nowrap'};
const tdX = {padding:'10px 14px', verticalAlign:'middle'};

// ── Cobertura basada en PRESENCIAS reales ─────────────────
function ViewCobertura({ h, hospital, edits }){
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const [monthIdx, setMonthIdx] = React.useState(0);
  const year = 2026, nDays = daysInMonth(year, monthIdx);

  const cats = ['LIMPIADOR T.M','LIMPIADOR T.T','LIMPIADOR T.N','PEON T.M','PEON T.T'];
  const days = Array.from({length:nDays}, (_,i)=>i+1);

  // Build matrix: [cat][day] = { asignado, necesario, diff, cumple }
  const matrix = React.useMemo(()=>{
    const m = {};
    let totalAsig = 0, totalNec = 0, faltas = 0;
    for (const cat of cats){
      m[cat] = {};
      for (const d of days){
        const dkey = dayKeyForDate(year, monthIdx, d);
        const nec = requiredFor(h.presencias, hospital, dkey, cat);
        const asig = countAssigned(h, edits, year, monthIdx, d, cat);
        const diff = asig - nec;
        m[cat][d] = { asig, nec, diff, cumple: asig >= nec };
        totalAsig += asig;
        totalNec += nec;
        if (asig < nec) faltas++;
      }
    }
    return { m, totalAsig, totalNec, faltas };
  }, [h, hospital, edits, monthIdx]);

  return (
    <div style={{padding:isMobile ? '14px 12px 16px' : isTablet ? '18px 16px 20px' : '22px 28px 28px'}}>
      <div style={{display:'flex', alignItems:isMobile ? 'stretch' : 'center', flexDirection:isMobile ? 'column' : 'row', gap:12, marginBottom:18}}>
        <div>
          <div style={{fontSize:18, fontWeight:700}}>Cobertura de turnos</div>
          <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>
            Asignado vs. presencia mínima · día a día
          </div>
        </div>
        <div style={{flex:1}}/>
        <MonthPicker monthIdx={monthIdx} setMonthIdx={setMonthIdx}/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap:12, marginBottom:16}}>
        <SummaryCard
          label="Turnos asignados"
          value={matrix.totalAsig}
          sub={`de ${matrix.totalNec} mínimo necesarios`}
          tone="green"/>
        <SummaryCard
          label="Días-categoría bajo mínimos"
          value={matrix.faltas}
          sub={matrix.faltas===0 ? 'mes cubierto' : 'por debajo de PRESENCIAS'}
          tone={matrix.faltas===0 ? 'green' : 'red'}/>
        <SummaryCard
          label="Cobertura"
          value={matrix.totalNec>0 ? `${Math.round(matrix.totalAsig/matrix.totalNec*100)}%` : '—'}
          sub={`sobre mínimo de PRESENCIAS`}
          tone="blue"/>
      </div>

      <LeyendaCobertura/>

      <Card padding={0} style={{overflow:'hidden', marginTop:12}}>
        <div style={{overflow:'auto', maxHeight:'calc(100vh - 430px)'}}>
          <table style={{borderCollapse:'separate', borderSpacing:0, fontSize:11,
                         minWidth: (isMobile ? 160 : 200) + nDays*38}}>
            <thead>
              <tr>
                <th style={{...stickyCol(isMobile ? 160 : 200), background:'#fafbfa', padding:'10px 14px',
                            textAlign:'left', fontSize:10.5, color:'var(--ink-3)',
                            fontWeight:700, textTransform:'uppercase', letterSpacing:0.6,
                            borderBottom:'1px solid var(--line)', zIndex:5}}>Categoría · turno</th>
                {days.map(d => (
                  <th key={d} style={{
                    width:38, minWidth:38,
                    background: isFestivo(year,monthIdx,d) ? 'var(--il-red-soft)' :
                                isWeekend(year,monthIdx,d) ? '#f1efe9' : '#fafbfa',
                    color: isFestivo(year,monthIdx,d) ? '#8a1f15' : 'var(--ink-3)',
                    fontSize:10, fontWeight:700, textAlign:'center',
                    borderLeft:'1px solid var(--line)', borderBottom:'1px solid var(--line)',
                    padding:'6px 2px'
                  }}>
                    <div style={{fontSize:9, opacity:0.7, fontWeight:500}}>{dayLetter(year, monthIdx, d)}</div>
                    <div className="mono">{d}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => (
                <tr key={cat}>
                  <td style={{...stickyCol(isMobile ? 160 : 200), background:'#fff', padding:'9px 14px',
                              borderBottom:'1px solid var(--line)',
                              fontSize:12, fontWeight:600, zIndex:4}}>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <Icon name={cat.endsWith('T.M')?'sun':cat.endsWith('T.T')?'sunset':'moon'}
                            size={13} stroke="var(--ink-3)"/>
                      <span>{cat.replace('T.M',' · Mañana').replace('T.T',' · Tarde').replace('T.N',' · Noche')}</span>
                    </div>
                  </td>
                  {days.map(d => {
                    const cell = matrix.m[cat][d];
                    return <CoverageCell key={d} cell={cell}/>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{marginTop:14, fontSize:11.5, color:'var(--ink-3)'}}>
        Los valores mínimos se leen del Excel de <strong>PRESENCIAS</strong> (por día de la semana).
        Las modificaciones en el cuadrante se reflejan aquí en tiempo real.
      </div>
    </div>
  );
}

function CoverageCell({ cell }){
  const { asig, nec, cumple } = cell;
  if (nec === 0 && asig === 0) {
    return <td style={{width:38, minWidth:38, height:42, padding:0,
                       background:'#fafbfa', borderLeft:'1px solid var(--line)',
                       borderBottom:'1px solid var(--line)'}}/>;
  }
  let bg, fg;
  if (!cumple) { bg = '#fae0dc'; fg = '#8a1f15'; }
  else if (asig > nec) { bg = 'var(--il-green-soft)'; fg = 'var(--il-green-dark)'; }
  else { bg = '#eef5e9'; fg = 'var(--il-green-dark)'; }
  return (
    <td style={{
      width:38, minWidth:38, height:42, padding:0,
      background:bg, borderLeft:'1px solid var(--line)',
      borderBottom:'1px solid var(--line)', textAlign:'center',
      verticalAlign:'middle'
    }} title={`Asignado ${asig} · mínimo ${nec}`}>
      <div className="mono" style={{fontSize:11, fontWeight:700, color:fg, lineHeight:1.1}}>{asig}</div>
      <div className="mono" style={{fontSize:9, color:fg, opacity:0.65, lineHeight:1}}>/{nec}</div>
    </td>
  );
}

function LeyendaCobertura(){
  const isMobile = useIsMobile(760);
  const items = [
    {bg:'#fae0dc', fg:'#8a1f15', label:'Por debajo de mínimo'},
    {bg:'#eef5e9', fg:'var(--il-green-dark)', label:'Justo al mínimo'},
    {bg:'var(--il-green-soft)', fg:'var(--il-green-dark)', label:'Por encima de mínimo'},
  ];
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:isMobile ? 10 : 16, alignItems:'center', fontSize:11.5, color:'var(--ink-3)'}}>
      <span style={{fontWeight:600}}>Leyenda:</span>
      {items.map((i,ix)=>(
        <div key={ix} style={{display:'flex', alignItems:'center', gap:6}}>
          <div style={{width:18, height:18, borderRadius:4, background:i.bg, border:'1px solid var(--line)'}}/>
          <span>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, sub, tone='neutral' }){
  const c = {
    green:{bg:'var(--il-green-soft)', fg:'var(--il-green-dark)'},
    red:{bg:'var(--il-red-soft)', fg:'#8a1f15'},
    blue:{bg:'var(--il-blue-soft)', fg:'#1a3e74'},
    neutral:{bg:'#eceee8', fg:'var(--ink-2)'}
  }[tone];
  return (
    <Card padding={16}>
      <div style={{fontSize:10.5, textTransform:'uppercase', fontWeight:700,
                   letterSpacing:0.6, color:'var(--ink-3)'}}>{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:9, marginTop:6}}>
        <div className="mono" style={{fontSize:28, fontWeight:700, color:c.fg, lineHeight:1}}>{value}</div>
        <div style={{fontSize:12, color:'var(--ink-3)'}}>{sub}</div>
      </div>
    </Card>
  );
}

// ── Horas / Cómputo ───────────────────────────────────
function ViewHoras({ h }){
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const [sort, setSort] = React.useState('name');
  const workers = [...h.workers].sort((a,b) => {
    const ha = h.horasAnuales[a.name] || {};
    const hb = h.horasAnuales[b.name] || {};
    if (sort==='desvio') return (ha.desviacion||0) - (hb.desviacion||0);
    if (sort==='pct') {
      const pa = ha.objetivo ? ha.asignadas/ha.objetivo : 0;
      const pb = hb.objetivo ? hb.asignadas/hb.objetivo : 0;
      return pb - pa;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{padding:isMobile ? '14px 12px 16px' : isTablet ? '18px 16px 20px' : '22px 28px 28px'}}>
      <div style={{display:'flex', alignItems:isMobile ? 'stretch' : 'center', flexDirection:isMobile ? 'column' : 'row', gap:12, marginBottom:18}}>
        <div>
          <div style={{fontSize:18, fontWeight:700}}>Cómputo anual de horas</div>
          <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>Asignado vs. objetivo contractual · 2026</div>
        </div>
        <div style={{flex:1}}/>
        <Select value={sort} onChange={setSort} fullWidth={isMobile} options={[
          {v:'name', l:'Por nombre'},
          {v:'desvio', l:'Por desvío'},
          {v:'pct', l:'Por % cumplido'}
        ]}/>
      </div>

      <Card padding={0}>
        <div style={{overflow:'auto'}}>
        <div style={{minWidth:isMobile ? 650 : 0}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--line)',
                     display:'grid', gridTemplateColumns:'1fr 120px 180px 100px 100px',
                     gap:12, fontSize:10.5, color:'var(--ink-3)',
                     textTransform:'uppercase', letterSpacing:0.6, fontWeight:700}}>
          <div>Persona</div>
          <div style={{textAlign:'right'}}>Objetivo</div>
          <div>Progreso</div>
          <div style={{textAlign:'right'}}>Asignadas</div>
          <div style={{textAlign:'right'}}>Desvío</div>
        </div>
        <div style={{maxHeight:'calc(100vh - 260px)', overflow:'auto'}}>
        {workers.map((w, wi) => {
          const ha = h.horasAnuales[w.name] || {asignadas:0, objetivo:w.horasAño||0, desviacion:0};
          const pct = ha.objetivo ? Math.min(110, (ha.asignadas/ha.objetivo)*100) : 0;
          const good = Math.abs(ha.desviacion||0) < 10;
          return (
            <div key={w.name} style={{padding:'10px 16px', borderTop:'1px solid var(--line)',
                                      display:'grid', gridTemplateColumns:'1fr 120px 180px 100px 100px',
                                      gap:12, alignItems:'center'}}>
              <div style={{display:'flex', gap:10, alignItems:'center', minWidth:0}}>
                <Avatar name={w.name} idx={wi} size={28}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:600, whiteSpace:'nowrap',
                              overflow:'hidden', textOverflow:'ellipsis'}}>{w.name}</div>
                  <div style={{fontSize:10.5, color:'var(--ink-3)'}}>{w.categoria}</div>
                </div>
              </div>
              <div className="mono" style={{textAlign:'right', fontSize:12.5}}>{ha.objetivo}h</div>
              <ProgressBar pct={pct} good={good}/>
              <div className="mono" style={{textAlign:'right', fontSize:12.5, fontWeight:600}}>{ha.asignadas}h</div>
              <div className="mono" style={{textAlign:'right', fontSize:12.5, fontWeight:700,
                                            color: (ha.desviacion||0)<0 ? '#8a1f15' :
                                                   (ha.desviacion||0)>0 ? 'var(--il-green-dark)' : 'var(--ink-3)'}}>
                {(ha.desviacion||0)>0?'+':''}{ha.desviacion||0}h
              </div>
            </div>
          );
        })}
        </div>
        </div>
        </div>
      </Card>
    </div>
  );
}
function ProgressBar({ pct, good }){
  return (
    <div style={{position:'relative', height:8, background:'#eceee8', borderRadius:4, overflow:'hidden'}}>
      <div style={{
        position:'absolute', left:0, top:0, bottom:0, width:`${Math.min(100,pct)}%`,
        background: good ? 'var(--il-green)' : pct>100 ? '#c63b2a' : '#e0a500'
      }}/>
      {pct > 100 && (
        <div style={{position:'absolute', top:0, bottom:0, left:'100%', width:2, background:'#8a1f15'}}/>
      )}
    </div>
  );
}

Object.assign(window, { ViewWorkers, ViewCobertura, ViewHoras,
                         presenciaKey, dayKeyForDate, countAssigned, requiredFor });
