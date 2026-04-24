// Workers list

function ViewWorkers({ data }) {
  const [search, setSearch] = React.useState('');
  const [centro, setCentro] = React.useState('ALL');
  const [puesto, setPuesto] = React.useState('ALL');

  const rows = data.workers.filter(w => {
    if (centro !== 'ALL' && w.centro !== centro) return false;
    if (puesto !== 'ALL' && w.puesto !== puesto) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // stats
  const byCentro = groupBy(data.workers, 'centro');
  const byPuesto = groupBy(data.workers, 'puesto');
  const byTurno  = groupBy(data.workers, 'turno');

  return (
    <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:18, minWidth:0}}>
      <SectionTitle subtitle="Plantilla fija del servicio de limpieza"
        right={<Btn size="sm" icon="download" variant="ghost">Exportar</Btn>}>
        Trabajadores
      </SectionTitle>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        <Stat label="Plantilla fija" value={data.workers.length}/>
        <Stat label="H. Clínico" value={byCentro['CLINICO']?.length || 0}/>
        <Stat label="H. Gil Casares" value={byCentro['GIL']?.length || 0}/>
        <Stat label="Horas/año acum." value={(data.workers.reduce((s,w)=>s+(w.horasAnio||0),0)/1000).toFixed(0)+'k'}/>
      </div>

      <Card padding={0}>
        <div style={{display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid var(--line-2)'}}>
          <div style={{position:'relative'}}>
            <div style={{position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)'}}>
              <Icon name="search" size={14}/>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              style={{height:30, width:260, padding:'0 10px 0 30px',
                      border:'1px solid var(--line)', borderRadius:7, fontSize:12, fontFamily:'inherit'}}/>
          </div>
          <FilterTabs value={centro} onChange={setCentro}
            options={[['ALL','Todos'],['CLINICO','Clínico'],['GIL','Gil Casares']]}/>
          <FilterTabs value={puesto} onChange={setPuesto}
            options={[['ALL','Todos'],['LIMPIADORA','Limpiadoras'],['PEON','Peones']]}/>
          <div style={{flex:1}}/>
          <div style={{fontSize:12, color:'var(--ink-3)'}}>{rows.length} resultado{rows.length!==1?'s':''}</div>
        </div>

        <div style={{maxHeight:'calc(100vh - 380px)', overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead style={{position:'sticky', top:0, background:'#fff', boxShadow:'0 1px 0 var(--line-2)'}}>
              <tr>
                <Th>#</Th><Th>Trabajador</Th><Th>Centro</Th><Th>Categoría</Th>
                <Th>Turno</Th><Th>Plaza</Th><Th align="right">Horas/año</Th><Th>Observaciones</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 80).map((w, i) => (
                <tr key={w.id} style={{borderBottom:'1px solid var(--line-2)'}}>
                  <Td style={{color:'var(--ink-3)', fontFamily:'JetBrains Mono, monospace', fontSize:11.5}}>
                    {String(w.id).padStart(3,'0')}
                  </Td>
                  <Td><div style={{fontWeight:500}}>{w.name}</div></Td>
                  <Td>
                    <Pill size="sm" tone={w.centro==='CLINICO'?'green':'blue'}>
                      {w.centro === 'CLINICO' ? 'Clínico' : 'Gil Casares'}
                    </Pill>
                  </Td>
                  <Td>{w.puesto === 'LIMPIADORA' ? 'Limpiadora' : 'Peón'}</Td>
                  <Td><span style={{fontSize:12, color:'var(--ink-2)'}}>{w.turno}</span></Td>
                  <Td><span className="mono" style={{fontSize:11.5, color:'var(--ink-2)'}}>{w.plaza}</span></Td>
                  <Td align="right"><span className="mono" style={{fontWeight:500}}>{w.horasAnio}</span></Td>
                  <Td><div style={{fontSize:11.5, color:'var(--ink-3)', maxWidth:360, lineHeight:1.4}}>
                    {w.observaciones || '—'}
                  </div></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 80 && (
            <div style={{padding:'12px 14px', fontSize:12, color:'var(--ink-3)', textAlign:'center'}}>
              Mostrando 80 de {rows.length} · <a href="#" style={{color:'var(--il-green-dark)'}}>ver todos</a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function groupBy(arr, key) {
  const o = {};
  arr.forEach(x => { const k = x[key]; (o[k] = o[k] || []).push(x); });
  return o;
}

function FilterTabs({ value, onChange, options }) {
  return (
    <div style={{display:'flex', background:'var(--line-2)', borderRadius:7, padding:2}}>
      {options.map(([v,l]) => (
        <button key={v} onClick={()=>onChange(v)}
          style={{
            padding:'5px 10px', fontSize:12, fontWeight: value===v ? 600 : 500,
            border:'none', background: value===v ? '#fff' : 'transparent',
            color: value===v ? 'var(--ink-1)' : 'var(--ink-3)',
            borderRadius:5, cursor:'pointer', fontFamily:'inherit',
            boxShadow: value===v ? '0 1px 2px rgba(0,0,0,.06)' : 'none'
          }}>{l}</button>
      ))}
    </div>
  );
}

function Th({ children, align }) {
  return <th style={{
    padding:'10px 14px', fontSize:10.5, textTransform:'uppercase', letterSpacing:0.5,
    color:'var(--ink-3)', fontWeight:700, textAlign: align || 'left'
  }}>{children}</th>;
}
function Td({ children, align, style={} }) {
  return <td style={{padding:'10px 14px', textAlign: align || 'left', verticalAlign:'middle', ...style}}>{children}</td>;
}

Object.assign(window, { ViewWorkers });
