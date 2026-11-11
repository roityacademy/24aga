/* 24AGÁ — Follow-up automático inteligente
   A clínica define as etapas (ex.: 1 hora, 1 dia e 3 dias depois da última mensagem).
   A plataforma calcula o próximo envio, respeita horário de silêncio e dias fechados,
   para sozinha quando o paciente responde, agenda ou pede para parar,
   e nunca faz follow-up de assunto de saúde. Na demonstração, um "relógio simulado" avança o tempo. */

const FU_UNITS = { min:['minuto','minutos',1], h:['hora','horas',60], d:['dia','dias',1440] };
const FU_TRIGGERS = {
  semResposta:{ t:'Parou de responder', d:'O paciente parou no meio da conversa com a IA.', stages:['IA em atendimento','Novo contato'] },
  naoAgendou:{ t:'Pediu informação e não agendou', d:'Conversou, mas não marcou horário.', stages:['Interessada em avaliação'] },
  proposta:{ t:'Proposta sem resposta', d:'Recebeu a proposta e ainda não decidiu.', stages:['Proposta enviada','Em decisão'] },
  faltou:{ t:'Faltou à consulta', d:'Oferece reagendar com carinho, sem cobrança.', stages:[] },
};
const FU_STATUS = { ativo:'Em sequência', respondeu:'Respondeu', agendou:'Agendou', parou:'Pediu para parar', concluido:'Sequência concluída', pausado:'Pausado', saude:'Bloqueado: saúde' };

function fuDefaults() {
  return {
    on:true,
    steps:[
      { id:'f1', n:1, u:'h', on:true, text:'Oi, {nome}! Vi que a nossa conversa ficou pela metade. Quer que eu te mostre os horários livres para {servico}?' },
      { id:'f2', n:1, u:'d', on:true, text:'{nome}, passando para saber se ficou alguma dúvida sobre {servico}. Tenho horários livres nesta semana. Posso reservar um para você?' },
      { id:'f3', n:3, u:'d', on:true, text:'Oi, {nome}! Separei 2 horários para você com {profissional}. Quer que eu reserve? Se preferir não receber mais mensagens, é só responder PARAR.' },
      { id:'f4', n:7, u:'d', on:false, text:'{nome}, vou deixar seu contato com a equipe da {clinica}. Quando quiser agendar, é só mandar um oi por aqui!' },
    ],
    rules:{ fromLast:true, stopReply:true, stopBook:true, quiet:true, quietStart:'20:00', quietEnd:'08:00', skipSunday:true, skipHealth:true, aiPersonal:true },
    triggers:{ semResposta:true, naoAgendou:true, proposta:true, faltou:true },
    clock:0, log:[],
  };
}
function fuState() {
  if (!S.followup) {
    S.followup = fuDefaults();
    const now = Date.now();
    const pick = S.patients.filter(p => Object.values(FU_TRIGGERS).some(tr => tr.stages.includes(p.stage)));
    pick.forEach((p, i) => { p.fu = { status:'ativo', step: i % 3, last: new Date(now - (i % 3 === 0 ? 25 : i % 3 === 1 ? 600 : 2000) * 60000).toISOString(), sent:[] }; });
    const fal = S.appts.find(a => a.status === 'falta' && a.pid);
    if (fal) { const p = patById(fal.pid); if (p && !p.fu) p.fu = { status:'ativo', step:0, last:new Date(now - 40*60000).toISOString(), sent:[], why:'faltou' }; }
    saveState();
  }
  return S.followup;
}
const fuNow = () => new Date(Date.now() + (S.followup ? S.followup.clock : 0) * 60000);
const fuDelayMin = s => s.n * FU_UNITS[s.u][2];
const fuDelayTxt = s => `${s.n} ${FU_UNITS[s.u][s.n === 1 ? 0 : 1]}`;
const fuSteps = () => fuState().steps.filter(s => s.on);
const fuMin = t => { const [h, m] = t.split(':').map(Number); return h*60 + m; };

/* Ajusta o horário: não envia no horário de silêncio nem em dia fechado (move para a abertura). */
function fuAdjust(d) {
  const r = fuState().rules; const x = new Date(d);
  for (let guard = 0; guard < 10; guard++) {
    const mins = x.getHours()*60 + x.getMinutes();
    if (r.quiet) {
      const qs = fuMin(r.quietStart), qe = fuMin(r.quietEnd);
      const inQuiet = qs > qe ? (mins >= qs || mins < qe) : (mins >= qs && mins < qe);
      if (inQuiet) { if (mins >= qs && qs > qe) x.setDate(x.getDate() + 1); x.setHours(Math.floor(qe/60), qe%60, 0, 0); continue; }
    }
    const closed = (r.skipSunday && x.getDay() === 0) || !dayWindow(ymd(x));
    if (closed) { x.setDate(x.getDate() + 1); x.setHours(Math.floor(fuMin(r.quietEnd)/60), fuMin(r.quietEnd)%60, 0, 0); continue; }
    break;
  }
  return x;
}
function fuWhy(p) {
  if (p.fu && p.fu.why) return p.fu.why;
  return Object.keys(FU_TRIGGERS).find(k => FU_TRIGGERS[k].stages.includes(p.stage)) || 'semResposta';
}
function fuNext(p) {
  const steps = fuSteps(); if (!p.fu || p.fu.status !== 'ativo' || p.fu.step >= steps.length) return null;
  const raw = new Date(new Date(p.fu.last).getTime() + fuDelayMin(steps[p.fu.step]) * 60000);
  return { raw, at: fuAdjust(raw), step: steps[p.fu.step], idx: p.fu.step };
}
function fuText(p, s) {
  const svc = svcById(p.interests[0]); const st = fuState();
  let t = s.text.replace(/\{nome\}/g, p.name.split(' ')[0]).replace(/\{servico\}/g, svc ? svc.name.toLowerCase().replace(' (botox)','') : 'a sua avaliação')
    .replace(/\{profissional\}/g, DR()).replace(/\{clinica\}/g, CLINIC());
  if (st.rules.aiPersonal) {
    const why = fuWhy(p);
    if (why === 'proposta') t = t.replace(/se ficou alguma dúvida sobre [^.?]+/, 'se ficou alguma dúvida sobre a proposta que preparamos para você');
    if (why === 'faltou') t = `Oi, ${p.name.split(' ')[0]}! Sentimos sua falta na consulta. Imprevistos acontecem: quer que eu veja um novo horário para você?`;
  }
  return t;
}
/* Janela de 24h do WhatsApp: dentro dela a mensagem é livre (sem custo); depois, só modelo aprovado pela Meta. */
function fuWindow(p, at) {
  const c = S.conversations.find(c => c.pid === p.id);
  const lastPat = c ? [...c.msgs].reverse().find(m => m.from === 'paciente') : null;
  const base = lastPat ? new Date(lastPat.at) : new Date(p.fu ? p.fu.last : p.last);
  return (at - base) <= 24*3600*1000 ? 'free' : 'template';
}
function fuSend(p, nx) {
  const st = fuState();
  let c = S.conversations.find(c => c.pid === p.id);
  if (!c) { c = { id:uid('c'), pid:p.id, state:'ia', unread:0, ctx:{ nameOk:true }, msgs:[] }; S.conversations.unshift(c); }
  const text = fuText(p, nx.step); const win = fuWindow(p, nx.at);
  c.msgs.push({ from:'sistema', text:`Follow-up automático · etapa ${nx.idx+1} (${fuDelayTxt(nx.step)} depois)${win === 'template' ? ' · modelo aprovado pela Meta' : ''}`, at:nx.at.toISOString() }, { from:'ia', text, at:nx.at.toISOString() });
  c.state = c.state === 'resolvida' ? 'ia' : c.state;
  p.fu.sent.push({ at:nx.at.toISOString(), step:nx.idx, win }); p.fu.last = nx.at.toISOString(); p.fu.step++;
  if (p.fu.step >= fuSteps().length) p.fu.status = 'concluido';
  addHistory(p.id, `Follow-up automático enviado (etapa ${nx.idx+1})`);
  st.log.unshift({ at:nx.at.toISOString(), pid:p.id, step:nx.idx, text, win });
}
/* Processa a fila até o "agora" simulado. */
function fuRun() {
  const st = fuState(); if (!st.on) return 0; const now = fuNow(); let n = 0;
  for (let guard = 0; guard < 200; guard++) {
    const due = S.patients.filter(p => p.fu && p.fu.status === 'ativo' && st.triggers[fuWhy(p)] !== false).map(p => [p, fuNext(p)]).filter(([, x]) => x && x.at <= now).sort((a, b) => a[1].at - b[1].at);
    if (!due.length) break;
    const [p, nx] = due[0];
    if (st.rules.stopBook && S.appts.some(a => a.pid === p.id && activeAppt(a) && parseYmd(a.date) >= sod(now) && a.type !== 'bloqueio')) { p.fu.status = 'agendou'; continue; }
    if (st.rules.skipHealth && p.stage === 'Aguardando humano') { p.fu.status = 'saude'; continue; }
    fuSend(p, nx); n++;
  }
  if (n) notify('followup', `${n} follow-up${n > 1 ? 's' : ''} automático${n > 1 ? 's' : ''} enviado${n > 1 ? 's' : ''}`, ['followup'], { push:true, title:'24AGÁ · follow-up' });
  return n;
}
/* Quando o paciente responde, a sequência para (gancho chamado pelo atendimento). */
function fuOnPatientMessage(p, text) {
  if (!S.followup || !p || !p.fu) return;
  if (/^\s*(parar|pare|sair|cancelar mensagens|nao quero mais)\b/.test(norm(text))) { p.fu.status = 'parou'; p.optOut = true; addHistory(p.id, 'Pediu para não receber follow-up'); return; }
  if (S.followup.rules.stopReply && p.fu.status === 'ativo') { p.fu.status = 'respondeu'; addHistory(p.id, 'Respondeu: follow-up pausado automaticamente'); }
}
function fuStart(p, why) {
  if (p.optOut) return toast('Este paciente pediu para não receber follow-up');
  p.fu = { status:'ativo', step:0, last:fuNow().toISOString(), sent:[], why: why || fuWhy(p) };
}

/* ================= TELA ================= */
VIEWS.followup = () => {
  const st = fuState(); const now = fuNow();
  const list = S.patients.filter(p => p.fu).map(p => ({ p, nx: fuNext(p) }));
  const act = list.filter(x => x.p.fu.status === 'ativo').sort((a, b) => (a.nx ? a.nx.at : Infinity) - (b.nx ? b.nx.at : Infinity));
  const done = list.filter(x => x.p.fu.status !== 'ativo');
  const sent = st.log.length; const resp = list.filter(x => ['respondeu','agendou'].includes(x.p.fu.status)).length;
  const today = act.filter(x => x.nx && ymd(x.nx.at) === ymd(now)).length;
  const fmtNx = d => { const diff = Math.round((sod(d) - sod(now))/864e5); const h = pad2(d.getHours()) + ':' + pad2(d.getMinutes()); return diff === 0 ? 'hoje ' + h : diff === 1 ? 'amanhã ' + h : DOW3[d.getDay()] + ' ' + pad2(d.getDate()) + '/' + pad2(d.getMonth()+1) + ' ' + h; };
  const steps = st.steps; const r = st.rules;
  const sw = (k, on, label, desc, act='fuRule') => `<div class="row between fu-rule"><div class="grow"><div>${label}</div><div class="muted xs">${desc}</div></div><button class="switch ${on?'on':''}" data-a="${act}" data-k="${k}" aria-label="${label}" aria-pressed="${on}"></button></div>`;
  return `
  <div class="page-h"><div><span class="eyebrow">Automação inteligente</span><h1>Follow-up automático</h1><p>Você programa a recorrência; a 24AGÁ envia na hora certa, para quando o paciente responde ou agenda e nunca incomoda de madrugada.</p></div>
    <div class="row"><span class="chip ${st.on ? 'st-confirmado' : 'st-cancelado'}"><span class="dot"></span>${st.on ? 'Ligado' : 'Desligado'}</span><button class="switch ${st.on?'on':''}" data-a="fuToggle" aria-label="Ligar follow-up" aria-pressed="${st.on}"></button></div></div>

  <div class="kpis">
    <div class="kpi"><span class="l">Em sequência</span><span class="v">${act.length}</span><span class="s">pacientes recebendo follow-up</span></div>
    <div class="kpi"><span class="l">Próximos hoje</span><span class="v">${today}</span><span class="s">envios programados</span></div>
    <div class="kpi"><span class="l">Enviados</span><span class="v">${sent}</span><span class="s">mensagens automáticas</span></div>
    <div class="kpi"><span class="l">Retomaram contato</span><span class="v">${resp}</span><span class="s">responderam ou agendaram</span></div>
  </div>

  <div class="card fu-clock"><div class="row between" style="flex-wrap:wrap;gap:10px"><div><h3>Simular a passagem do tempo</h3><p class="muted small">Relógio da demonstração: <b>${fmtWhen(now.toISOString())}</b>${st.clock ? ` (${st.clock >= 1440 ? Math.round(st.clock/1440) + ' dia(s)' : Math.round(st.clock/60) + ' hora(s)'} à frente)` : ''}. Avance e veja os envios acontecerem.</p></div>
    <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-a="fuTick" data-m="60">+1 hora</button><button class="btn sm" data-a="fuTick" data-m="1440">+1 dia</button><button class="btn sm primary" data-a="fuTick" data-m="4320">+3 dias</button><button class="btn sm ghost" data-a="fuClockReset" ${st.clock ? '' : 'disabled'}>Voltar ao agora</button></div></div></div>

  <div class="grid2 fu-grid">
    <div class="stack">
      <div class="card"><div class="card-h"><div><h3>Sequência</h3><p class="muted small">Contada a partir da última mensagem. Variáveis: {nome}, {servico}, {profissional}, {clinica}.</p></div></div>
        <div class="fu-steps">${steps.map((s, i) => `<div class="fu-step ${s.on ? '' : 'off'}">
          <div class="fu-dot">${i+1}</div>
          <div class="grow stack" style="gap:8px">
            <div class="row between" style="gap:8px;flex-wrap:wrap"><div class="row" style="gap:6px"><span class="small">Enviar</span><input class="input fu-n" type="number" min="1" max="60" value="${s.n}" data-c="fuStep" data-id="${s.id}" data-k="n" aria-label="Quantidade"><select class="input fu-u" data-c="fuStep" data-id="${s.id}" data-k="u" aria-label="Unidade">${Object.entries(FU_UNITS).map(([k,v]) => `<option value="${k}" ${s.u===k?'selected':''}>${v[1]}</option>`).join('')}</select><span class="small">depois ${i === 0 ? 'da última mensagem' : 'da etapa anterior'}</span></div>
              <div class="row" style="gap:6px"><button class="btn sm ghost" data-a="fuDel" data-id="${s.id}" aria-label="Remover etapa">${ic('x')}</button><button class="switch ${s.on?'on':''}" data-a="fuStepOn" data-id="${s.id}" aria-label="Ativar etapa ${i+1}"></button></div></div>
            <textarea class="input" rows="2" data-c="fuStep" data-id="${s.id}" data-k="text" aria-label="Texto da etapa ${i+1}">${esc(s.text)}</textarea>
          </div></div>`).join('')}</div>
        <button class="btn sm" data-a="fuAdd">${ic('plus')} Adicionar etapa</button>
      </div>
      <div class="card"><div class="card-h"><h3>Quando começar</h3></div>
        ${Object.entries(FU_TRIGGERS).map(([k, tr]) => sw(k, st.triggers[k], tr.t, tr.d, 'fuTrig')).join('')}</div>
    </div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>Regras inteligentes</h3><span class="chip">${ic('spark')} IA</span></div>
        ${sw('stopReply', r.stopReply, 'Parar quando o paciente responder', 'A conversa volta para a IA ou para a equipe.')}
        ${sw('stopBook', r.stopBook, 'Parar quando o paciente agendar', 'Ninguém recebe "quer agendar?" já tendo horário.')}
        ${sw('quiet', r.quiet, `Não enviar entre ${r.quietStart} e ${r.quietEnd}`, 'Mensagens caem para a abertura do dia seguinte.')}
        ${r.quiet ? `<div class="grid2" style="margin:4px 0 8px"><div class="field"><label for="fu-qs">Silêncio a partir de</label><input class="input" type="time" id="fu-qs" value="${r.quietStart}" data-c="fuQuiet" data-k="quietStart"></div><div class="field"><label for="fu-qe">até</label><input class="input" type="time" id="fu-qe" value="${r.quietEnd}" data-c="fuQuiet" data-k="quietEnd"></div></div>` : ''}
        ${sw('skipSunday', r.skipSunday, 'Pular domingos e dias fechados', 'Respeita o horário de funcionamento da clínica.')}
        ${sw('skipHealth', r.skipHealth, 'Nunca fazer follow-up de assunto de saúde', 'Esses casos ficam com a equipe, com prioridade.')}
        ${sw('aiPersonal', r.aiPersonal, 'IA personaliza cada mensagem', 'Usa o serviço de interesse e o motivo (proposta, falta, dúvida).')}
        <div class="note" style="margin-top:10px">Respondeu <b>PARAR</b>? A 24AGÁ marca o pedido e não envia mais nada para aquele número.</div>
      </div>
      <div class="card"><div class="card-h"><h3>Custo no WhatsApp</h3></div>
        <p class="small">Até 24h depois da última mensagem do paciente, o follow-up é <b>grátis</b> na Meta. Depois disso, vai como modelo aprovado pela Meta (cerca de R$ 0,35 por mensagem, cobrado pela Meta). A fila abaixo mostra qual é qual.</p></div>
    </div>
  </div>

  <div class="card"><div class="card-h"><div><h3>Fila de follow-up</h3><p class="muted small">Próximos envios, em ordem.</p></div><button class="btn sm" data-a="fuAddPatient">${ic('plus')} Colocar paciente na sequência</button></div>
    ${act.length ? `<div class="tbl-wrap"><table class="tbl fu-tbl"><thead><tr><th>Paciente</th><th>Motivo</th><th>Etapa</th><th>Próximo envio</th><th>WhatsApp</th><th></th></tr></thead><tbody>
      ${act.map(({ p, nx }) => `<tr><td><button class="lnk" data-a="simGo" data-r="pacientes" data-id="${p.id}">${esc(p.name)}</button><div class="muted xs">${esc(p.stage)}</div></td><td class="small">${esc(FU_TRIGGERS[fuWhy(p)].t)}</td><td>${nx ? `${nx.idx+1} de ${fuSteps().length}` : '—'}</td>
        <td>${nx ? `<b>${fmtNx(nx.at)}</b>${+nx.at !== +nx.raw ? `<div class="muted xs">ajustado (era ${fmtNx(nx.raw)})</div>` : ''}` : '—'}</td>
        <td>${nx ? (fuWindow(p, nx.at) === 'free' ? '<span class="chip st-confirmado">grátis</span>' : '<span class="chip">modelo Meta</span>') : ''}</td>
        <td class="fu-acts"><button class="btn sm" data-a="fuReply" data-id="${p.id}">Simular resposta</button><button class="btn sm ghost" data-a="fuPause" data-id="${p.id}">Pausar</button></td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">Ninguém na fila agora.</div>'}
    ${done.length ? `<div class="lbl" style="margin:14px 0 6px">Fora da sequência</div><div class="row" style="gap:6px;flex-wrap:wrap">${done.map(({ p }) => `<span class="tag">${esc(p.name)} · ${FU_STATUS[p.fu.status]}</span>`).join('')}</div>` : ''}
  </div>

  <div class="card"><div class="card-h"><h3>Últimos envios</h3></div>
    ${st.log.length ? `<div class="list">${st.log.slice(0, 8).map(l => { const p = patById(l.pid); return `<div class="li"><div class="grow"><b>${esc(p ? p.name : '')}</b> <span class="muted xs">· etapa ${l.step+1} · ${fmtWhen(l.at)} · ${l.win === 'free' ? 'grátis' : 'modelo Meta'}</span><div class="small muted">${esc(l.text)}</div></div>${p ? `<button class="btn sm" data-a="fuOpenConv" data-id="${p.id}">Ver conversa</button>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">Avance o relógio para ver os envios.</div>'}
  </div>`;
};

Object.assign(A, {
  fuToggle: () => { const st = fuState(); st.on = !st.on; commit(st.on ? 'Follow-up ligado' : 'Follow-up desligado'); },
  fuRule: t => { const r = fuState().rules; r[t.dataset.k] = !r[t.dataset.k]; commit('Regra salva'); },
  fuTrig: t => { const tr = fuState().triggers; tr[t.dataset.k] = !tr[t.dataset.k]; commit('Salvo'); },
  fuStepOn: t => { const s = fuState().steps.find(x => x.id === t.dataset.id); s.on = !s.on; commit(); },
  fuDel: t => { const st = fuState(); if (st.steps.length <= 1) return toast('Mantenha pelo menos uma etapa'); st.steps = st.steps.filter(x => x.id !== t.dataset.id); commit('Etapa removida'); },
  fuAdd: () => { const st = fuState(); st.steps.push({ id:uid('f'), n:7, u:'d', on:true, text:'Oi, {nome}! Ainda posso te ajudar com {servico}? É só responder por aqui.' }); commit('Etapa adicionada'); },
  fuTick: t => { const st = fuState(); st.clock += Number(t.dataset.m); const n = fuRun(); commit(n ? '' : 'Nenhum envio programado neste intervalo'); },
  fuClockReset: () => { fuState().clock = 0; commit('Relógio de volta ao agora'); },
  fuReply: t => { const p = patById(t.dataset.id); let c = S.conversations.find(c => c.pid === p.id);
    if (!c) { c = { id:uid('c'), pid:p.id, state:'ia', unread:0, ctx:{ nameOk:true }, msgs:[] }; S.conversations.unshift(c); }
    c.msgs.push({ from:'paciente', text:'Oi! Quero sim, pode ver um horário?', at:fuNow().toISOString() }); c.unread = (c.unread||0) + 1;
    fuOnPatientMessage(p, 'quero sim'); commit(`${p.name.split(' ')[0]} respondeu: sequência pausada e conversa de volta para a IA`); },
  fuPause: t => { const p = patById(t.dataset.id); p.fu.status = 'pausado'; commit('Follow-up pausado'); },
  fuOpenConv: t => { const c = S.conversations.find(c => c.pid === t.dataset.id); if (c) goTo('atendimento', c.id); },
  fuAddPatient: () => {
    const opts = S.patients.filter(p => !p.fu || p.fu.status !== 'ativo').slice(0, 40);
    openModal(`${mHead('Colocar na sequência','O primeiro envio sai conforme a etapa 1, respeitando as regras.')}<div class="mb stack">
      <div class="field"><label for="fu-p">Paciente</label><select class="input" id="fu-p">${opts.map(p => `<option value="${p.id}">${esc(p.name)} · ${esc(p.stage)}</option>`).join('')}</select></div>
      <div class="field"><label for="fu-w">Motivo</label><select class="input" id="fu-w">${Object.entries(FU_TRIGGERS).map(([k, tr]) => `<option value="${k}">${tr.t}</option>`).join('')}</select></div></div>
      <div class="mf"><button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="fuAddConfirm">Começar</button></div>`);
  },
  fuAddConfirm: () => { const p = patById($('#fu-p').value); fuStart(p, $('#fu-w').value); closeModal(); commit(`${p.name} entrou na sequência de follow-up`); },
});
Object.assign(C, {
  fuStep: t => { const s = fuState().steps.find(x => x.id === t.dataset.id); const k = t.dataset.k; s[k] = k === 'n' ? Math.max(1, Number(t.value) || 1) : t.value; saveState(); if (k !== 'text') render(); else toast('Texto salvo'); },
  fuQuiet: t => { fuState().rules[t.dataset.k] = t.value; commit('Horário salvo'); },
});
