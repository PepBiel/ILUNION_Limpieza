// Cuadrante mensual — grid editable, usa datos reales del algoritmo

function ViewCuadrante({ h, hospital, edits, setEdits, onShowToast }){
  const isTablet = useIsMobile(1040);
  const isMobile = useIsMobile(760);
  const [monthIdx, setMonthIdx] = React.useState(() => {
    const v = Number(localStorage.getItem('dlp-month'));
    return Number.isInteger(v) && v>=0 && v<12 ? v : 0;
  });
  const [filterCat, setFilterCat] = React.useState('all');
  const [filterTurno, setFilterTurno] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState(null);  // {workerIdx, dayIdx}
  const [selectedWorker, setSelectedWorker] = React.useState(null);

  React.useEffect(()=>localStorage.setItem('dlp-month', monthIdx), [monthIdx]);

  const year = 2026;
  const nDays = daysInMonth(year, monthIdx);
  const days = Array.from({length:nDays}, (_,i)=>i+1);

  const categorias = React.useMemo(() => {
    const s = new Set(h.workers.map(w=>w.categoria));
    return Array.from(s).sort();
  }, [h]);

  const workers = React.useMemo(() => {
    return h.workers.filter(w => {
      if (filterCat !== 'all' && w.categoria !== filterCat) return false;
      if (filterTurno !== 'all') {
        const tb = (w.turnoBase||'').trim().toUpperCase();
        if (filterTurno === 'M' && !tb.startsWith('MAÑ')) return false;
        else if (filterTurno === 'T' && !tb.startsWith('TARDE') && tb !== 'NOCHE/TARDE') return false;
        else if (filterTurno === 'N' && !tb.includes('NOCHE')) return false;
        else if (filterTurno === 'ROT' && !tb.includes('ROTATORIO') && !tb.includes('PEON')) return false;
      }
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [h, filterCat, filterTurno, search]);

  function getShift(workerName, dayIdx) {
    const key = `${workerName}|${monthIdx}|${dayIdx}`;
    if (edits[key] !== undefined) return edits[key];
    const sched = h.monthlySched[workerName];
    if (!sched || !sched[monthIdx+1]) return '';
    return (sched[monthIdx+1][dayIdx] || '').toString().trim();
  }

  function setShift(workerName, dayIdx, value) {
    const key = `${workerName}|${monthIdx}|${dayIdx}`;
    const worker = h.workers.find(w => w.name === workerName);
    const before = getShift(workerName, dayIdx);
    if (before === value) return;

    // Compute affected (cat, day) cells to report in toast
    const year = 2026, day = dayIdx+1;
    const dayKey = dayKeyForDate(year, monthIdx, day);
    const isPeon = (worker.puesto||'').toUpperCase().includes('PEON') || (worker.puesto||'').toUpperCase().includes('PEÓN');
    const prefix = isPeon ? 'PEON' : 'LIMPIADOR';
    const turnoToCat = { M: prefix+' T.M', T: prefix+' T.T', N: prefix+' T.N' };

    const affected = new Set();
    if (turnoToCat[(before||'').toUpperCase()]) affected.add(turnoToCat[(before||'').toUpperCase()]);
    if (turnoToCat[(value||'').toUpperCase()])  affected.add(turnoToCat[(value||'').toUpperCase()]);

    // Sim edits (before new state applies)
    const nextEdits = { ...edits, [key]: value };
    const rows = [];
    for (const cat of affected) {
      const nec = requiredFor(h.presencias, hospital, dayKey, cat);
      const before_ = countAssigned(h, edits, year, monthIdx, day, cat);
      const after_  = countAssigned(h, nextEdits, year, monthIdx, day, cat);
      if (before_ === after_) continue;
      rows.push({
        cat, catLabel: cat.replace('T.M',' · Mañana').replace('T.T',' · Tarde').replace('T.N',' · Noche'),
        dayLabel: `${day} ${MONTHS_ES[monthIdx].toLowerCase()} · ${dayKey.toLowerCase()}`,
        before: before_, after: after_, nec
      });
    }

    setEdits(e => ({...e, [key]: value}));

    if (rows.length && onShowToast) {
      onShowToast({
        title: `${worker.name} · ${before || '—'} → ${value || 'vacío'}`,
        rows
      });
    }
  }

  // coverage issues for this month
  const monthCoverage = React.useMemo(() => {
    return h.coverage.filter(c => {
      const m = Number(c.fecha.slice(5,7))-1;
      return m === monthIdx;
    });
  }, [h, monthIdx]);

  const monthFaltas = monthCoverage.filter(c => c.cumple === 'NO').length;

  return (
    <div style={{padding:isMobile ? '14px 12px 16px' : isTablet ? '18px 16px 20px' : '22px 28px 28px'}}>
      {/* Toolbar */}
      <div style={{display:'flex', alignItems:isMobile ? 'stretch' : 'center', flexDirection:isMobile ? 'column' : 'row', gap:12, marginBottom:18, flexWrap:'wrap'}}>
        <MonthPicker monthIdx={monthIdx} setMonthIdx={setMonthIdx}/>
        <div style={{flex:1}}/>
        <SearchBox value={search} onChange={setSearch} fullWidth={isMobile} placeholder="Buscar trabajador…"/>
        <Select value={filterCat} onChange={setFilterCat} fullWidth={isMobile} options={[
          {v:'all', l:'Todas las categorías'},
          ...categorias.map(c=>({v:c, l:c}))
        ]}/>
        <Select value={filterTurno} onChange={setFilterTurno} fullWidth={isMobile} options={[
          {v:'all', l:'Todos los turnos'},
          {v:'M', l:'Mañana'}, {v:'T', l:'Tarde'}, {v:'N', l:'Noche'}, {v:'ROT', l:'Rotatorio / Peón'}
        ]}/>
        <Btn size="md" icon="wand" variant="primary" style={{width:isMobile ? '100%' : 'auto'}} title="Regenera el cuadrante desde el algoritmo (backend)">
          Generar con algoritmo
        </Btn>
      </div>

      {/* Banner algoritmo */}
      <AlgoBanner monthFaltas={monthFaltas} nAsignaciones={workers.length * nDays}/>

      {/* Grid */}
      <Card padding={0} style={{overflow:'hidden'}}>
        <CuadranteGrid
          year={year} monthIdx={monthIdx} days={days} workers={workers}
          getShift={getShift} setShift={setShift}
          selected={selected} setSelected={setSelected}
          onPickWorker={setSelectedWorker}
          isMobile={isMobile}
        />
      </Card>

      {/* Footer resumen cobertura (basado en PRESENCIAS reales) */}
      <CoberturaResumen h={h} hospital={hospital} edits={edits} monthIdx={monthIdx}/>

      {/* Modals */}
      {selected && (
        <CellEditor
          worker={workers[selected.workerIdx]} year={year} monthIdx={monthIdx}
          day={selected.dayIdx+1} current={getShift(workers[selected.workerIdx].name, selected.dayIdx)}
          onSet={(v)=>{ setShift(workers[selected.workerIdx].name, selected.dayIdx, v); setSelected(null); }}
          onClose={()=>setSelected(null)}
        />
      )}
      {selectedWorker && (
        <WorkerDetail w={selectedWorker} h={h} onClose={()=>setSelectedWorker(null)}/>
      )}
    </div>
  );
}

// ── Toolbar atoms ─────────────────────────────────────
function MonthPicker({ monthIdx, setMonthIdx }){
  const isMobile = useIsMobile(760);
  return (
    <div style={{display:'flex', alignItems:'center', gap:0, background:'#fff',
                 border:'1px solid var(--line)', borderRadius:10, overflow:'hidden', width:isMobile ? '100%' : 'auto'}}>
      <button onClick={()=>setMonthIdx(Math.max(0, monthIdx-1))} disabled={monthIdx===0}
        style={navBtn(monthIdx===0)}><Icon name="chevron" size={16} style={{transform:'rotate(180deg)'}}/></button>
      <div style={{padding:'0 14px', minWidth:isMobile ? 0 : 170, flex:isMobile ? 1 : 'none', textAlign:'center'}}>
        <div style={{fontSize:14.5, fontWeight:700}}>{MONTHS_ES[monthIdx]} 2026</div>
        <div style={{fontSize:10.5, color:'var(--ink-3)', fontWeight:500}}>
          {daysInMonth(2026, monthIdx)} días
        </div>
      </div>
      <button onClick={()=>setMonthIdx(Math.min(11, monthIdx+1))} disabled={monthIdx===11}
        style={navBtn(monthIdx===11)}><Icon name="chevron" size={16}/></button>
    </div>
  );
}
function navBtn(disabled){ return {
  width:36, height:38, border:'none', background:'transparent', cursor:disabled?'default':'pointer',
  display:'grid', placeItems:'center', color: disabled ? 'var(--line-strong)' : 'var(--ink-2)'
};}

function SearchBox({ value, onChange, placeholder, fullWidth }){
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, background:'#fff',
                 border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', height:38, width:fullWidth ? '100%' : 220}}>
      <Icon name="search" size={15} stroke="var(--ink-3)"/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{border:'none', outline:'none', fontSize:13, flex:1, background:'transparent', fontFamily:'inherit'}}/>
    </div>
  );
}
function Select({ value, onChange, options, fullWidth }){
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{
      height:38, width:fullWidth ? '100%' : 'auto', padding:'0 30px 0 12px', border:'1px solid var(--line)', borderRadius:10,
      fontSize:13, fontFamily:'inherit', background:'#fff url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path d=\'M1 1l4 4 4-4\' stroke=\'%23666\' fill=\'none\' stroke-width=\'1.5\' stroke-linecap=\'round\'/></svg>") no-repeat right 12px center',
      appearance:'none', cursor:'pointer', color:'var(--ink-1)'
    }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function AlgoBanner({ monthFaltas, nAsignaciones }){
  const isMobile = useIsMobile(760);
  const tone = monthFaltas===0 ? 'green' : 'amber';
  const bg = tone==='green' ? 'var(--il-green-soft)' : 'var(--il-amber-soft)';
  const fg = tone==='green' ? 'var(--il-green-dark)' : '#7a4200';
  return (
    <div style={{
      background:bg, border:`1px solid color-mix(in oklab, ${fg} 20%, transparent)`,
      borderRadius:12, padding:'11px 16px', marginBottom:14,
      display:'flex', alignItems:'center', gap:14, flexWrap:isMobile ? 'wrap' : 'nowrap'
    }}>
      <div style={{width:30, height:30, borderRadius:8, background:'#fff',
                   display:'grid', placeItems:'center', color:fg, flexShrink:0}}>
        <Icon name={monthFaltas===0 ? 'check' : 'warn'} size={16}/>
      </div>
      <div style={{flex:1, fontSize:12.5, color:fg}}>
        <strong>Cuadrante generado por algoritmo.</strong> {nAsignaciones.toLocaleString('es')} asignaciones
        {' · '}{monthFaltas===0
          ? 'todos los turnos cubiertos para este mes.'
          : `${monthFaltas} incidencias de cobertura detectadas este mes.`}
      </div>
      <Btn size="sm" variant="ghost" icon="history" style={{width:isMobile ? '100%' : 'auto'}}>Historial</Btn>
      <Btn size="sm" variant="default" icon="download" style={{width:isMobile ? '100%' : 'auto'}}>Exportar</Btn>
    </div>
  );
}

// ── Grid ─────────────────────────────────────
function CuadranteGrid({ year, monthIdx, days, workers, getShift, setShift, selected, setSelected, onPickWorker, isMobile }){
  const CELL = 32, NAME_W = isMobile ? 180 : 230;
  const gridRef = React.useRef(null);

  return (
    <div style={{overflow:'auto', maxHeight:isMobile ? 'calc(100vh - 310px)' : 'calc(100vh - 350px)'}} ref={gridRef}>
      <table style={{
        borderCollapse:'separate', borderSpacing:0, fontSize:11,
        minWidth: NAME_W + days.length*CELL
      }}>
        <thead>
          <tr>
            <th style={{
              ...stickyCol(NAME_W), background:'#fafbfa', zIndex:5,
              textAlign:'left', padding:'8px 14px', borderBottom:'1px solid var(--line)',
              fontSize:10.5, color:'var(--ink-3)', fontWeight:700,
              textTransform:'uppercase', letterSpacing:0.6
            }}>Trabajador / Categoría</th>
            {days.map(d => {
              const weekend = isWeekend(year, monthIdx, d);
              const festivo = isFestivo(year, monthIdx, d);
              return (
                <th key={d} style={{
                  ...stickyRow(CELL, CELL),
                  background: festivo ? 'var(--il-red-soft)' : weekend ? '#f1efe9' : '#fafbfa',
                  color: festivo ? '#8a1f15' : 'var(--ink-2)',
                  fontSize:10.5, fontWeight:700, textAlign:'center',
                  borderBottom:'1px solid var(--line)',
                  borderLeft:'1px solid var(--line)'
                }}>
                  <div style={{fontSize:9, opacity:0.7, fontWeight:500}}>{dayLetter(year, monthIdx, d)}</div>
                  <div className="mono">{d}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {workers.map((w, wi) => (
            <tr key={w.name}>
              <td style={{
                ...stickyCol(NAME_W), background:'#fff',
                borderBottom:'1px solid var(--line)', padding:'6px 12px', cursor:'pointer'
              }} onClick={()=>onPickWorker(w)}>
                <div style={{display:'flex', gap:9, alignItems:'center'}}>
                  <Avatar name={w.name} idx={wi} size={26}/>
                  <div style={{minWidth:0, flex:1}}>
                    <div style={{fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{w.name}</div>
                    <div style={{fontSize:10, color:'var(--ink-3)', display:'flex', gap:6}}>
                      <span>{w.categoria}</span>
                      <span style={{color:'var(--line-strong)'}}>·</span>
                      <span>{w.turnoBase}</span>
                    </div>
                  </div>
                </div>
              </td>
              {days.map((d, di) => {
                const v = getShift(w.name, di);
                const weekend = isWeekend(year, monthIdx, d);
                const festivo = isFestivo(year, monthIdx, d);
                const isSel = selected && selected.workerIdx===wi && selected.dayIdx===di;
                return (
                  <td key={d} style={{
                    padding:0, height:CELL, width:CELL,
                    borderBottom:'1px solid var(--line)', borderLeft:'1px solid var(--line)',
                    background: festivo ? '#fef4f1' : weekend ? '#fafbfa' : '#fff',
                  }}>
                    <CuadranteCell value={v} selected={isSel}
                      onClick={()=>setSelected({workerIdx:wi, dayIdx:di})}/>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function stickyCol(w){ return { position:'sticky', left:0, width:w, minWidth:w, maxWidth:w, zIndex:4 };}
function stickyRow(w,h){ return { position:'sticky', top:0, width:w, minWidth:w, height:h+6, zIndex:3 };}

function CuadranteCell({ value, onClick, selected }){
  const s = value ? SHIFT_BY_CODE[value.toUpperCase()] : null;
  let bg='transparent', fg='var(--ink-2)', weight=600;
  if (s) {
    if (s.code==='M') { bg='#fef3d4'; fg='#7a4200'; }
    else if (s.code==='T') { bg='#d9e4f0'; fg='#1a3e74'; }
    else if (s.code==='N') { bg='#2d3748'; fg='#fff'; }
    else if (s.group==='Descanso') { bg='#eef1ec'; fg='var(--ink-3)'; weight=500; }
    else if (s.group==='Vacaciones') { bg='var(--il-green-soft)'; fg='var(--il-green-dark)'; }
    else if (s.group==='Permiso') { bg='#f5efe0'; fg='#6b4d12'; }
    else if (s.group==='Ausencia') { bg='#fae0dc'; fg='#8a1f15'; }
    else { bg='#f5f5f5'; fg='var(--ink-2)'; }
  }
  return (
    <button onClick={onClick} style={{
      width:'100%', height:'100%', border:'none', cursor:'pointer', fontFamily:'inherit',
      background: selected ? 'color-mix(in oklab, var(--il-green) 22%, white)' : bg,
      color:fg, fontSize:10.5, fontWeight:weight,
      display:'grid', placeItems:'center',
      boxShadow: selected ? 'inset 0 0 0 2px var(--il-green)' : 'none'
    }}>{value || ''}</button>
  );
}

function CoberturaResumen({ h, hospital, edits, monthIdx }){
  const year = 2026, nDays = daysInMonth(year, monthIdx);
  const cats = ['LIMPIADOR T.M','LIMPIADOR T.T','LIMPIADOR T.N','PEON T.M','PEON T.T'];
  const byCat = {};
  for (const cat of cats){
    let nec=0, asig=0, faltas=0;
    for (let d=1; d<=nDays; d++){
      const dkey = dayKeyForDate(year, monthIdx, d);
      const n = requiredFor(h.presencias, hospital, dkey, cat);
      const a = countAssigned(h, edits, year, monthIdx, d, cat);
      nec += n; asig += a;
      if (a < n) faltas++;
    }
    byCat[cat] = { nec, asig, faltas };
  }
  const entries = Object.entries(byCat).filter(([k,v])=>v.nec>0 || v.asig>0);
  if (entries.length===0) return null;
  return (
    <div style={{marginTop:18}}>
      <div style={{fontSize:11, fontWeight:700, color:'var(--ink-3)',
                   textTransform:'uppercase', letterSpacing:0.6, marginBottom:9, padding:'0 2px'}}>
        Cobertura del mes por categoría
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', gap:10}}>
        {entries.map(([cat, v]) => {
          const pct = v.nec>0 ? Math.min(100, (v.asig/v.nec)*100) : 100;
          const ok = v.faltas===0;
          const label = cat.replace('T.M',' · Mañana').replace('T.T',' · Tarde').replace('T.N',' · Noche');
          return (
            <Card key={cat} padding={13}>
              <div style={{fontSize:11.5, fontWeight:600, color:'var(--ink-2)', marginBottom:7}}>{label}</div>
              <div style={{display:'flex', gap:8, alignItems:'baseline', marginBottom:8}}>
                <div className="mono" style={{fontSize:17, fontWeight:700,
                  color: ok ? 'var(--il-green-dark)' : '#8a1f15'}}>{v.asig}</div>
                <div style={{fontSize:11, color:'var(--ink-3)'}}>de {v.nec} necesarios</div>
                <div style={{flex:1}}/>
                {ok
                  ? <Pill tone="green" size="sm">Cubierto</Pill>
                  : <Pill tone="red" size="sm">{v.faltas} día{v.faltas>1?'s':''}</Pill>}
              </div>
              <div style={{height:4, borderRadius:2, background:'#eceee8', overflow:'hidden'}}>
                <div style={{
                  width:`${pct}%`, height:'100%',
                  background: ok ? 'var(--il-green)' : '#c63b2a'
                }}/>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Cell editor ─────────────────────────────────────
function CellEditor({ worker, year, monthIdx, day, current, onSet, onClose }){
  const isMobile = useIsMobile(760);
  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{background:'#fff', borderRadius:14, width:460, maxWidth:'94vw',
                   maxHeight:isMobile ? '92vh' : 'auto', overflow:isMobile ? 'auto' : 'visible',
                   padding:isMobile ? 14 : 20, boxShadow:'var(--shadow-lg)'}}
           onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', alignItems:'center', gap:11, marginBottom:14}}>
          <Avatar name={worker.name} idx={0} size={38}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13.5, fontWeight:700}}>{worker.name}</div>
            <div style={{fontSize:11.5, color:'var(--ink-3)'}}>
              {worker.categoria} · {day} de {MONTHS_ES[monthIdx].toLowerCase()} 2026
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><Icon name="close" size={16}/></button>
        </div>

        <div style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase',
                     letterSpacing:0.6, fontWeight:700, marginBottom:8}}>Asignar</div>

        {['Turno','Descanso','Vacaciones','Permiso','Ausencia'].map(g => (
          <div key={g} style={{marginBottom:10}}>
            <div style={{fontSize:11, color:'var(--ink-3)', marginBottom:5, fontWeight:600}}>{g}</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
              {SHIFT_OPTIONS.filter(x=>x.group===g).map(o => (
                <button key={o.code} onClick={()=>onSet(o.code)} style={{
                  padding:'6px 10px', border:`1px solid ${current===o.code ? 'var(--il-green)' : 'var(--line)'}`,
                  borderRadius:8, background: current===o.code ? 'var(--il-green-tint)' : '#fff',
                  cursor:'pointer', fontSize:11.5, fontFamily:'inherit',
                  color: current===o.code ? 'var(--il-green-dark)' : 'var(--ink-1)',
                  fontWeight: current===o.code ? 700 : 500
                }}>
                  <span className="mono" style={{fontWeight:700, marginRight:6}}>{o.code}</span>
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{display:'flex', gap:8, marginTop:16}}>
          <Btn variant="ghost" onClick={()=>onSet('')}>Vaciar celda</Btn>
          <div style={{flex:1}}/>
          <Btn variant="default" onClick={onClose}>Cerrar</Btn>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function WorkerDetail({ w, h, onClose }){
  const isMobile = useIsMobile(760);
  const horas = h.horasAnuales[w.name];
  const monthlyBreakdown = MONTHS_ES.map((mn, mi) => {
    const sched = (h.monthlySched[w.name] && h.monthlySched[w.name][mi+1]) || [];
    const counts = {M:0,T:0,N:0,D:0,V26:0,otros:0};
    for (const s of sched){
      const code = (s||'').toString().trim().toUpperCase();
      if (counts[code] !== undefined) counts[code]++;
      else if (code) counts.otros++;
    }
    return {mn, counts};
  });
  return (
    <ModalBackdrop onClose={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff', borderRadius:14, width:640, maxWidth:'94vw', maxHeight:'88vh', overflow:'auto',
        padding:isMobile ? 14 : 24, boxShadow:'var(--shadow-lg)'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:18}}>
          <Avatar name={w.name} idx={0} size={48}/>
          <div style={{flex:1}}>
            <div style={{fontSize:16, fontWeight:700}}>{w.name}</div>
            <div style={{fontSize:12, color:'var(--ink-3)', marginTop:2}}>{w.categoria} · {w.centro}</div>
          </div>
          <button onClick={onClose} style={closeBtn}><Icon name="close" size={16}/></button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap:10, marginBottom:16}}>
          <Stat label="Turno base" value={w.turnoBase}/>
          <Stat label="Horas/año" value={w.horasAño}/>
          <Stat label="Asignadas" value={horas ? horas.asignadas : '—'}/>
          <Stat label="Desvío" value={horas ? (horas.desviacion>=0?'+':'')+horas.desviacion+'h' : '—'}
                tone={horas && horas.desviacion<0 ? 'red' : 'green'}/>
        </div>
        <div style={{fontSize:11, color:'var(--ink-3)', fontWeight:700,
                     textTransform:'uppercase', letterSpacing:0.6, marginBottom:8}}>Distribución mensual</div>
        <div style={{border:'1px solid var(--line)', borderRadius:10, overflow:'auto'}}>
          <table style={{width:'100%', minWidth:isMobile ? 520 : 'auto', fontSize:12, borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#fafbfa', color:'var(--ink-3)'}}>
              <th style={th}>Mes</th><th style={th}>M</th><th style={th}>T</th><th style={th}>N</th>
              <th style={th}>D</th><th style={th}>V</th><th style={th}>Otros</th>
            </tr></thead>
            <tbody>
              {monthlyBreakdown.map(r => (
                <tr key={r.mn} style={{borderTop:'1px solid var(--line)'}}>
                  <td style={{...td, fontWeight:600}}>{r.mn}</td>
                  <td style={td}>{r.counts.M||''}</td>
                  <td style={td}>{r.counts.T||''}</td>
                  <td style={td}>{r.counts.N||''}</td>
                  <td style={td}>{r.counts.D||''}</td>
                  <td style={td}>{r.counts.V26||''}</td>
                  <td style={td}>{r.counts.otros||''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalBackdrop>
  );
}

const th = {padding:'8px 10px', textAlign:'left', fontSize:10.5, textTransform:'uppercase',
            letterSpacing:0.6, fontWeight:700};
const td = {padding:'7px 10px', textAlign:'left', fontFamily:'ui-monospace, Menlo, monospace'};
const closeBtn = {width:30, height:30, borderRadius:8, border:'none', background:'#f2f3f0',
                  cursor:'pointer', display:'grid', placeItems:'center', color:'var(--ink-2)'};

function Stat({ label, value, tone='neutral' }){
  const c = tone==='red' ? '#8a1f15' : tone==='green' ? 'var(--il-green-dark)' : 'var(--ink-1)';
  return (
    <div style={{background:'#fafbfa', borderRadius:10, padding:'10px 12px'}}>
      <div style={{fontSize:10, color:'var(--ink-3)', textTransform:'uppercase',
                   letterSpacing:0.5, fontWeight:700}}>{label}</div>
      <div className="mono" style={{fontSize:16, fontWeight:700, color:c, marginTop:3}}>{value}</div>
    </div>
  );
}

function ModalBackdrop({ children, onClose }){
  const isMobile = useIsMobile(760);
  return <div onClick={onClose} style={{
    position:'fixed', inset:0, background:'rgba(20,30,24,0.45)',
    display:'grid', placeItems:isMobile ? 'end center' : 'center', zIndex:100, backdropFilter:'blur(2px)',
    padding:isMobile ? '10px' : 0
  }}>{children}</div>;
}

Object.assign(window, { ViewCuadrante });
