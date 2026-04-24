// Chatbot — flotante inferior derecha

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatPct(value) {
  return `${Math.round(value * 10) / 10}%`;
}

function buildHospitalInsights(data, hospital) {
  const h = data[hospital];
  const hospitalName = hospital === 'clinico' ? 'Hospital Clínico' : 'Hospital Gil Casares';
  const workers = h.workers || [];
  const coverage = h.coverage || [];
  const resumen = h.resumen || {};
  const faltasCobertura = Number(resumen.faltas_cobertura_totales || 0);
  const desviacionMedia = Number(resumen.desviacion_media_anual_horas || 0);
  const categorias = Array.from(new Set(workers.map(w => w.categoria).filter(Boolean)));
  const workersByCategory = workers.reduce((acc, w) => {
    const cat = w.categoria || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const incidencias = coverage.filter(c => c.cumple === 'NO');
  const incidenciasByCategory = incidencias.reduce((acc, row) => {
    const cat = row.categoria || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const coveragePct = coverage.length ? ((coverage.length - faltasCobertura) / coverage.length) * 100 : 100;
  const topIncidencias = Object.entries(incidenciasByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return {
    hospital,
    hospitalName,
    workers,
    coverage,
    resumen,
    categorias,
    workersByCategory,
    incidencias,
    incidenciasByCategory,
    topIncidencias,
    totalPersonas: workers.length,
    faltasCobertura,
    desviacionMedia,
    coveragePct,
  };
}

function answerPlanningQuestion(data, hospital, question) {
  const q = normalizeText(question);
  const active = buildHospitalInsights(data, hospital);
  const clinico = buildHospitalInsights(data, 'clinico');
  const gil = buildHospitalInsights(data, 'gil');

  if ((q.includes('cuantas') || q.includes('cuantos') || q.includes('plantilla') || q.includes('personas')) &&
      (q.includes('cada hospital') || q.includes('ambos') || q.includes('hospitales'))) {
    return [
      'Ahora mismo la plantilla cargada es:',
      `• Hospital Clínico: ${clinico.totalPersonas} personas`,
      `• Hospital Gil Casares: ${gil.totalPersonas} personas`,
      `• Total general: ${clinico.totalPersonas + gil.totalPersonas} personas`,
    ].join('\n');
  }

  if (q.includes('cuantas') || q.includes('cuantos') || q.includes('plantilla') || q.includes('personas') || q.includes('trabajan')) {
    const breakdown = Object.entries(active.workersByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `• ${cat}: ${count}`)
      .join('\n');
    return [
      `En ${active.hospitalName} hay ${active.totalPersonas} personas cargadas.`,
      breakdown ? `Distribución principal:\n${breakdown}` : '',
    ].filter(Boolean).join('\n\n');
  }

  if ((q.includes('categoria') || q.includes('categorias')) && (q.includes('incidencia') || q.includes('cobertura') || q.includes('faltas'))) {
    if (!active.topIncidencias.length) {
      return `Buena noticia: en ${active.hospitalName} no veo incidencias de cobertura pendientes.`;
    }
    return [
      `Las categorías con más incidencias de cobertura en ${active.hospitalName} son:`,
      ...active.topIncidencias.map(([cat, count]) => `• ${cat}: ${count} incidencias`),
    ].join('\n');
  }

  if (q.includes('cobertura') || q.includes('faltas') || q.includes('incidencias')) {
    return [
      `Resumen de cobertura de ${active.hospitalName}:`,
      `• Cobertura estimada: ${formatPct(active.coveragePct)}`,
      `• Faltas de cobertura detectadas: ${active.faltasCobertura}`,
      active.topIncidencias[0] ? `• Categoría más tensionada: ${active.topIncidencias[0][0]} (${active.topIncidencias[0][1]} incidencias)` : '• No hay categorías tensionadas en este momento',
    ].join('\n');
  }

  if (q.includes('hora') || q.includes('desviacion') || q.includes('desvio')) {
    return [
      `En ${active.hospitalName} la desviación media anual es de ±${active.desviacionMedia.toFixed(1)}h por persona.`,
      'Si querés, también podés revisar la vista “Horas” para ver el detalle mensual y anual.',
    ].join('\n');
  }

  if (q.includes('baja') || q.includes('sustitu') || q.includes('sustituyo') || q.includes('ultima hora')) {
    return [
      'Para cubrir una baja de última hora te recomiendo este orden:',
      '• 1) Abrí “Cobertura” y revisá qué categoría/turno queda por debajo del mínimo.',
      '• 2) Entrá a “Cuadrante” para localizar una persona compatible de la misma categoría.',
      active.topIncidencias[0] ? `• 3) Priorizá ${active.topIncidencias[0][0]}, que es donde hoy veo más tensión.` : '• 3) Priorizá la categoría afectada en el turno con menor cobertura.',
      '• 4) Confirmá luego el impacto en cobertura antes de cerrar el cambio.',
    ].join('\n');
  }

  if (q.includes('resumen') || q.includes('estado') || q.includes('como estamos')) {
    return [
      `Resumen rápido de ${active.hospitalName}:`,
      `• Personas cargadas: ${active.totalPersonas}`,
      `• Cobertura estimada: ${formatPct(active.coveragePct)}`,
      `• Faltas de cobertura: ${active.faltasCobertura}`,
      `• Desviación media anual: ±${active.desviacionMedia.toFixed(1)}h`,
    ].join('\n');
  }

  return [
    `Puedo ayudarte con datos reales de ${active.hospitalName}.`,
    'Probá preguntas como:',
    '• ¿Cuántas personas trabajan en cada hospital?',
    '• ¿Qué categorías tienen incidencias de cobertura?',
    '• ¿Cómo estamos de cobertura?',
    '• ¿Cuál es la desviación media de horas?',
    '• ¿Cómo sustituyo una baja de última hora?',
  ].join('\n');
}

function ChatbotFAB({ onToggle }){
  const isMobile = useIsMobile(760);
  return (
    <button onClick={onToggle} style={{
      position:'fixed', right:isMobile ? 14 : 22, bottom:isMobile ? 14 : 22, zIndex:50,
      width:isMobile ? 48 : 54, height:isMobile ? 48 : 54, borderRadius:27, border:'none', cursor:'pointer',
      background:'var(--il-green)', color:'#fff',
      boxShadow:'0 8px 22px rgba(0,80,50,0.28)',
      display:'grid', placeItems:'center'
    }} title="Asistente de planificación">
      <Icon name="sparkle" size={22}/>
    </button>
  );
}

function ChatbotPanel({ data, hospital, onClose }){
  const isMobile = useIsMobile(760);
  const [messages, setMessages] = React.useState([
    { role:'assistant',
      content:'Hola 👋 Soy el asistente de planificación. Puedo ayudarte a consultar coberturas, horas o cambios en el cuadrante. ¿Qué necesitas?' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [voicePulse, setVoicePulse] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth', block:'end'}); }, [messages, loading]);

  const suggestions = [
    '¿Cuántas personas trabajan en cada hospital?',
    '¿Qué categorías tienen incidencias de cobertura?',
    '¿Cómo sustituyo una baja de última hora?',
  ];

  async function send(text){
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    const next = [...messages, { role:'user', content:msg }];
    setMessages(next);
    setLoading(true);

    try {
      const reply = answerPlanningQuestion(data, hospital, msg);
      setMessages([...next, { role:'assistant', content: reply }]);
    } catch (e) {
      setMessages([...next, { role:'assistant',
        content:'Perdona, tuve un problema al procesar la consulta. Probá con preguntas sobre plantilla, cobertura, horas o incidencias.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onMicClick(){
    setVoicePulse(true);
    setTimeout(() => setVoicePulse(false), 800);
    setMessages((prev) => ([...prev, {
      role:'assistant',
      content:'🎤 Modo voz disponible próximamente. Mientras tanto, escribí tu consulta y te respondo al instante.'
    }]));
  }

  return (
    <div style={{
      position:'fixed', right:isMobile ? 10 : 22, bottom:isMobile ? 70 : 88, zIndex:60,
      width:isMobile ? 'calc(100vw - 20px)' : 380,
      maxWidth:isMobile ? 'calc(100vw - 20px)' : 'calc(100vw - 44px)',
      height:isMobile ? 'calc(100vh - 95px)' : 540,
      maxHeight:isMobile ? 'calc(100vh - 95px)' : 'calc(100vh - 120px)',
      background:'#fff', border:'1px solid var(--line)', borderRadius:16,
      boxShadow:'var(--shadow-lg)', display:'flex', flexDirection:'column', overflow:'hidden'
    }}>
      <div style={{padding:'13px 14px', background:'var(--il-green)', color:'#fff',
                   display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:30, height:30, borderRadius:8,
                     background:'rgba(255,255,255,0.15)', display:'grid', placeItems:'center'}}>
          <Icon name="sparkle" size={16}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13.5, fontWeight:700}}>Asistente EXCELENTIA</div>
          <div style={{fontSize:10.5, opacity:0.9}}>Turnos, cobertura y horas · IA</div>
        </div>
        <button onClick={onClose} style={{
          width:28, height:28, borderRadius:7, border:'none', cursor:'pointer',
          background:'rgba(255,255,255,0.18)', color:'#fff',
          display:'grid', placeItems:'center'
        }}><Icon name="close" size={14}/></button>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'14px', background:'#fafbfa'}}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start',
            marginBottom:10
          }}>
            <div style={{
              maxWidth:'86%', padding:'9px 13px', borderRadius:12,
              fontSize:12.5, lineHeight:1.5,
              background: m.role==='user' ? 'var(--il-green)' : '#fff',
              color: m.role==='user' ? '#fff' : 'var(--ink-1)',
              border: m.role==='user' ? 'none' : '1px solid var(--line)',
              whiteSpace:'pre-wrap'
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{display:'flex', gap:4, padding:'10px 13px', background:'#fff',
                       border:'1px solid var(--line)', borderRadius:12, width:'fit-content'}}>
            {[0,1,2].map(i => (
              <div key={i} style={{width:6, height:6, borderRadius:3, background:'var(--ink-3)',
                animation:`blink 1.2s ${i*0.2}s infinite ease-in-out`}}/>
            ))}
            <style>{`@keyframes blink{0%,60%,100%{opacity:0.3}30%{opacity:1}}`}</style>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {messages.length<=1 && (
        <div style={{padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:5, borderTop:'1px solid var(--line)'}}>
          {suggestions.map(s => (
            <button key={s} onClick={()=>send(s)} style={{
              padding:'6px 10px', border:'1px solid var(--line)', borderRadius:999,
              background:'#fff', cursor:'pointer', fontSize:11, fontFamily:'inherit', color:'var(--ink-2)'
            }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{padding:isMobile ? '8px 10px' : '10px 12px', borderTop:'1px solid var(--line)',
                   display:'flex', gap:8, alignItems:'center'}}>
        <button onClick={onMicClick} title="Hablar (próximamente)" style={{
          width:38, height:38, border:'none', borderRadius:10,
          background: voicePulse ? 'var(--il-yellow)' : 'var(--il-green-tint)',
          color: voicePulse ? '#fff' : 'var(--il-green-dark)', cursor:'pointer',
          display:'grid', placeItems:'center',
          boxShadow: voicePulse ? '0 0 0 4px rgba(155,124,0,0.18)' : 'none',
          transition:'all .2s ease'
        }}><Icon name="mic" size={15}/></button>
        <input
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Escribe tu pregunta…"
          style={{flex:1, border:'1px solid var(--line)', borderRadius:10,
                  padding:'9px 12px', fontSize:13, fontFamily:'inherit', outline:'none'}}
        />
        <button onClick={()=>send()} disabled={!input.trim() || loading} style={{
          width:38, height:38, border:'none', borderRadius:10,
          background: input.trim() && !loading ? 'var(--il-green)' : '#eceee8',
          color:'#fff', cursor: input.trim() && !loading ? 'pointer' : 'default',
          display:'grid', placeItems:'center'
        }}><Icon name="send" size={15}/></button>
      </div>
    </div>
  );
}

Object.assign(window, { ChatbotFAB, ChatbotPanel });
