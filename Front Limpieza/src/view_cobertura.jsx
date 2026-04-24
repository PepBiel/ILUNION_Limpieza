// Cobertura (coverage) view — compare assigned vs required presence, daily/weekly.

function ViewCobertura({ data }) {
  const [hospital, setHospital] = React.useState('CLINICO');
  const pres = hospital === 'CLINICO' ? data.presClinico : data.presGil;

  const days = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO','FESTIVOS'];
  const cats = [
    { key:'limpMañana', label:'Limpiadoras · Mañana', tone:'green' },
    { key:'limpTarde',  label:'Limpiadoras · Tarde',  tone:'green' },
    { key:'limpNoche',  label:'Limpiadoras · Noche',  tone:'green' },
    { key:'peonMañana', label:'Peones · Mañana',      tone:'blue' },
    { key:'peonTarde',  label:'Peones · Tarde',       tone:'blue' },
  ];

  // Simulated assigned (close to req, with small over/unders)
  const sim = (req) => {
    const out = {};
    for (const d of days) out[d] = req[d] ? req[d] : {};
    const assigned = {};
    for (const d of days) {
      assigned[d] = {};
      for (const c of cats) {
        const r = out[d][c.key] || 0;
        const delta = ((d==='DOMINGO' || d==='FESTIVOS') ? -0.3 : 0.2) + (Math.sin(d.length*3)-0.5)*1.2;
        assigned[d][c.key] = Math.max(0, Math.round(r + delta));
      }
    }
    return assigned;
  };
  const assigned = React.useMemo(() => sim(pres), [pres]);

  return (
    <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:18}}>
      <SectionTitle subtitle="Comparativa entre presencias requeridas y asignadas por día tipo"
        right={
          <div style={{display:'flex', gap:6}}>
            <FilterTabs value={hospital} onChange={setHospital}
              options={[['CLINICO','Clínico'],['GIL','Gil Casares']]}/>
          </div>
        }>
        Cobertura operativa
      </SectionTitle>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <Stat label="Cobertura semanal" value="98.2%" tone="green" trend="objetivo ≥95%"/>
        <Stat label="Días bajo mínimos" value="3" tone="amber" trend="de 30 este mes"/>
        <Stat label="Refuerzos estivales" value="—" trend="Julio–Agosto"/>
        <Stat label="Desviación media" value="+0.4" trend="px · día"/>
      </div>

      <Card padding={0}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid var(--line-2)',
                     display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:14, fontWeight:600}}>Presencias por día de la semana</div>
            <div style={{fontSize:12, color:'var(--ink-3)'}}>
              Hospital {hospital==='CLINICO'?'Clínico':'Gil Casares'} · requerido vs. asignado
            </div>
          </div>
          <div style={{display:'flex', gap:14, fontSize:11, color:'var(--ink-3)'}}>
            <LegendSwatch color="var(--il-green)" label="Asignado ≥ requerido"/>
            <LegendSwatch color="var(--il-amber)" label="Exactamente"/>
            <LegendSwatch color="var(--il-red)"   label="Déficit"/>
          </div>
        </div>

        <div style={{overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
            <thead>
              <tr style={{background:'#fbfbf9'}}>
                <Th>Categoría · turno</Th>
                {days.map(d =>
                  <th key={d} style={{padding:'10px 8px', fontSize:10.5, textTransform:'uppercase',
                                      letterSpacing:0.5, color:'var(--ink-3)', fontWeight:700, textAlign:'center'}}>
                    {d}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.key} style={{borderTop:'1px solid var(--line-2)'}}>
                  <Td><div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{width:6, height:6, borderRadius:3,
                                  background: c.tone==='green'?'var(--il-green)':'var(--il-blue)'}}/>
                    <span style={{fontWeight:500}}>{c.label}</span>
                  </div></Td>
                  {days.map(d => {
                    const req = pres[d]?.[c.key] || 0;
                    const asg = assigned[d]?.[c.key] || 0;
                    const diff = asg - req;
                    const tone = diff < 0 ? 'red' : (diff === 0 ? 'amber' : 'green');
                    const bg = tone==='red' ? 'var(--il-red-soft)' : (tone==='amber' ? 'var(--il-amber-soft)' : 'var(--il-green-soft)');
                    const fg = tone==='red' ? '#8a1f15' : (tone==='amber' ? '#7a4200' : 'var(--il-green-dark)');
                    return (
                      <td key={d} style={{padding:'0 4px', textAlign:'center'}}>
                        <div style={{
                          margin:'6px auto', width:'calc(100% - 4px)', height:42,
                          background: bg, color: fg,
                          borderRadius:6, display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center'
                        }}>
                          <div className="mono" style={{fontSize:14, fontWeight:700, lineHeight:1}}>
                            {asg}<span style={{color:'var(--ink-4)', fontWeight:500}}>/{req}</span>
                          </div>
                          <div style={{fontSize:9.5, fontWeight:600, marginTop:2}}>
                            {diff > 0 ? `+${diff}` : diff}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Protocolo de refuerzo */}
      <Card>
        <div style={{fontSize:14, fontWeight:600, marginBottom:10}}>Protocolo — refuerzos y cambios de cobertura</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <ProtocolRow title="Turno de mañana (L–V)"
                       detail="5 / 3 / 4 / 3 / 4 px — cobertura base según convenio"/>
          <ProtocolRow title="Turno de tarde"
                       detail="1º mes: 1 px · 2º y 3º mes: 1 px adicional"/>
          <ProtocolRow title="Turno de noche"
                       detail="1º y 3º mes: 2 px fijos · 1 noche sí / 1 noche no"/>
          <ProtocolRow title="Fin de semana / festivo"
                       detail="Rotación por trabajador: 1 sí / 1 no · 1 sí / 2 no"/>
        </div>
      </Card>
    </div>
  );
}

function LegendSwatch({ color, label }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:6}}>
      <span style={{width:10, height:10, borderRadius:3, background:color}}/>
      <span>{label}</span>
    </div>
  );
}

function ProtocolRow({ title, detail }) {
  return (
    <div style={{padding:'10px 12px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--line-2)'}}>
      <div style={{fontSize:12, fontWeight:600, color:'var(--ink-1)'}}>{title}</div>
      <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2}}>{detail}</div>
    </div>
  );
}

Object.assign(window, { ViewCobertura });
