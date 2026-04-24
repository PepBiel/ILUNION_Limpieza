// Resumen de horas / cómputo anual por trabajador

function ViewResumen({ data }) {
  const rows = data.workers.slice(0, 80).map((w, i) => {
    // simulate hours completed so far (progress towards horasAnio)
    const progressPct = 0.32 + (Math.sin(i*0.7) + 1) * 0.18; // 0.32–0.68
    const hoursDone = Math.round(w.horasAnio * progressPct);
    const hoursPending = w.horasAnio - hoursDone;
    const deviation = Math.round((Math.sin(i*1.3))*25); // +/- 25h
    return { ...w, hoursDone, hoursPending, progressPct, deviation };
  });

  return (
    <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:18}}>
      <SectionTitle subtitle="Cómputo anual: horas trabajadas vs jornada contratada — cómputa M, T, N, PF, B, PS, L, PR"
        right={<Btn size="sm" icon="download" variant="ghost">Exportar cómputo</Btn>}>
        Horas / Cómputo anual
      </SectionTitle>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <Stat label="Jornada anual media" value="1.697h" trend="por trabajador"/>
        <Stat label="Horas acumuladas" value="167k" tone="green" trend="año en curso"/>
        <Stat label="Por encima de jornada" value="8" tone="amber" trend="trabajadores"/>
        <Stat label="Por debajo de jornada" value="3" tone="red" trend="requieren ajuste"/>
      </div>

      <Card padding={0}>
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line-2)', fontSize:13, fontWeight:600}}>
          Progreso del cómputo por trabajador
        </div>
        <div style={{maxHeight:'calc(100vh - 360px)', overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
            <thead style={{position:'sticky', top:0, background:'#fff', boxShadow:'0 1px 0 var(--line-2)'}}>
              <tr>
                <Th>Trabajador</Th>
                <Th>Centro</Th>
                <Th align="right">Jornada año</Th>
                <Th align="right">Trabajadas</Th>
                <Th align="right">Pendientes</Th>
                <Th style={{minWidth:200}}>Progreso</Th>
                <Th align="right">Desvío</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const toneDev = r.deviation > 10 ? 'amber' : (r.deviation < -10 ? 'red' : 'neutral');
                return (
                  <tr key={r.id} style={{borderTop:'1px solid var(--line-2)'}}>
                    <Td><div style={{fontWeight:500}}>{r.name}</div>
                        <div style={{fontSize:11, color:'var(--ink-3)'}}>{r.puesto==='LIMPIADORA'?'Limpiadora':'Peón'} · {r.plaza}</div>
                    </Td>
                    <Td>
                      <Pill size="sm" tone={r.centro==='CLINICO'?'green':'blue'}>
                        {r.centro==='CLINICO'?'Clínico':'Gil Casares'}
                      </Pill>
                    </Td>
                    <Td align="right"><span className="mono">{r.horasAnio}h</span></Td>
                    <Td align="right"><span className="mono" style={{fontWeight:600, color:'var(--il-green-dark)'}}>
                      {r.hoursDone}h
                    </span></Td>
                    <Td align="right"><span className="mono" style={{color:'var(--ink-3)'}}>
                      {r.hoursPending}h
                    </span></Td>
                    <Td>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div style={{flex:1, height:6, background:'var(--line-2)', borderRadius:3, overflow:'hidden'}}>
                          <div style={{
                            width:`${Math.round(r.progressPct*100)}%`, height:'100%',
                            background: r.progressPct > 0.6 ? 'var(--il-green)' : 'var(--il-green-dark)',
                            borderRadius:3, transition:'width .3s'
                          }}/>
                        </div>
                        <span className="mono" style={{fontSize:11, color:'var(--ink-3)', minWidth:34, textAlign:'right'}}>
                          {Math.round(r.progressPct*100)}%
                        </span>
                      </div>
                    </Td>
                    <Td align="right">
                      <Pill size="sm" tone={toneDev}>{r.deviation>0?`+${r.deviation}h`:`${r.deviation}h`}</Pill>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ViewResumen });
