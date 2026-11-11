/* 24AGÁ — assistente virtual simulada (regras locais) + simulador guiado
   Na versão real, um modelo de linguagem recebe apenas a base aprovada e as mesmas regras de segurança. */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const slotTxt = (d, m) => `${DOW[parseYmd(d).getDay()]} ${fmtDate(d)} às ${hm(m)}`;
const SVC_KEYS_FN = () => S.services.filter(s => s.kw).map(s => [s.id, new RegExp(s.kw)]);
const RE = {
  risk:/(pensamentos ruins|suicid|me matar|me machucar|automutil|crise de ansiedade|crise de panico|nao estou bem|desesper|\b(?:dor|doendo|doi|inchad|inchaco|roxo|hematoma|alergi|reacao|reagiu|sangr|febre|infec|necros|emergenc|urgent|falta de ar|gravid|gestante|amament|vermelhid|pus|caroco|nodulo|dormencia|formigamento|intercorrencia))/,
  clinical:/(cancer|remedio|medicament|diagnost|e grave|quantos quilos|jejum|antibiotic|foto|imagem|dose|unidades|\bml\b|serve pra mim|serve para mim|e indicado|indicad|contraindic|posso fazer|resultado garantido|quanto tempo dura|vai ficar natural|rosacea|melasma|tenho \w+ posso)/,
  human:/(atendente|humano|uma pessoa|alguem da equipe|recepc|falar com|ligar|ligacao|telefonar|falar com a doutora|falar com o doutor)/,
  cancel:/(cancel|desmarc|nao vou poder|nao posso ir|nao vou conseguir ir)/,
  resched:/(reagend|remarc|mudar (o|meu) horario|trocar (o|meu) horario|mudar de dia|outro dia pro meu)/,
  price:/(valor|preco|quanto custa|quanto e|quanto fica|custa|parcel|forma de pagamento|pix|cartao)/,
  address:/(endereco|onde fica|localiza|como chego)/,
  hours:/(sabado|domingo|horario de funcionamento|que horas abre|ate que horas|voces atendem|atendem)/,
  schedule:/(horario|agenda|marcar|agendar|vaga|disponiv|consulta|avaliac|semana que vem|amanha|ver horarios|procurar outra data|tem hora)/,
  yes:/^(sim|s|pode|quero|claro|ok|isso|bora|pode ser|sim,? ver horarios|ver horarios|quero sim|sim por favor)\b/,
  no:/^(nao|n|so queria informac|obrigad|valeu)/,
};
function parsePeriod(t) {
  const per = { part:null, nextWeek:false, tomorrow:false, today:false, dow:null, given:false };
  if (/manha|cedo|\bmanh/.test(t)) per.part = 'manha';
  if (/tarde|depois do almoco/.test(t)) per.part = 'tarde';
  if (/semana que vem|proxima semana/.test(t)) per.nextWeek = true;
  if (/amanha/.test(t)) per.tomorrow = true;
  if (/\bhoje\b/.test(t)) per.today = true;
  const dws = [['domingo',0],['segunda',1],['terca',2],['quarta',3],['quinta',4],['sexta',5],['sabado',6]];
  for (const [w, n] of dws) if (t.includes(w)) per.dow = n;
  if (/qualquer/.test(t)) per.any = true;
  per.given = !!(per.part || per.nextWeek || per.tomorrow || per.today || per.dow != null || per.any);
  return per;
}
function nextSlots(dur, profId, part, n, fromDate, dayFilter, ignoreId, skip) {
  const out = []; const base = fromDate ? parseYmd(fromDate) : sod(new Date());
  for (let i = 0; i < 21 && out.length < n; i++) {
    const d = addDays(base, i); if (dayFilter && !dayFilter(d)) continue;
    const ds = ymd(d);
    const s = freeSlots(ds, dur, profId, null, ignoreId).filter(m => !part || (part === 'manha' ? m < 720 : m >= 780)).filter(m => !skip || !(skip[0] === ds && skip[1] === m));
    if (s.length) out.push([ds, s[0]]);
  }
  return out;
}
function humanHoursNow() { const n = new Date(); const m = n.getHours()*60 + n.getMinutes(); const [a,b] = [S.ai.humanStart, S.ai.humanEnd].map(x => { const [h,mm] = x.split(':').map(Number); return h*60+mm; }); return m >= a && m < b && n.getDay() !== 0; }

function patientSays(c, text, opts={}) {
  c.msgs.forEach(m => { if (m.opts) m.opts = null; });
  c.msgs.push({ from:'paciente', text, at:nowIso() });
  const p = patById(c.pid); if (p) p.last = nowIso();
  if (c.state === 'resolvida') c.state = 'ia';
  if (!S.ai.on && c.state === 'ia') { c.state = 'aguardando'; c.msgs.push({ from:'sistema', text:'Assistente desligada · mensagem aguardando a equipe', at:nowIso() }); notify('humano', `${p.name} aguarda resposta (assistente desligada)`, ['atendimento', c.id]); return commit(); }
  if (c.state !== 'ia') { if (UI.sel.conv !== c.id) c.unread = (c.unread||0) + 1; return commit(); }
  if (opts.instant) { aiReply(c, text); return; }
  c._typing = true; commit();
  setTimeout(() => { c._typing = false; aiReply(c, text); commit(); }, 750);
}

function aiReply(c, raw) {
  const t = norm(raw).trim(); const ctx = c.ctx = c.ctx || {}; const p = patById(c.pid);
  const say = (text, opts) => c.msgs.push({ from:'ia', text, opts, at:nowIso() });
  if (!ctx.counted) { ctx.counted = true; S.ai.usage.conversations++; if (STAGES.indexOf(p.stage) < 1) setStage(p.id, 'IA em atendimento'); }
  const greet = () => { if (!ctx.greeted) { ctx.greeted = true; say(S.ai.intro); } };
  const nextAppt = () => S.appts.filter(a => a.pid === p.id && activeAppt(a) && a.type !== 'bloqueio' && parseYmd(a.date) >= sod(new Date())).sort((a,b) => (a.date+hm(a.start)).localeCompare(b.date+hm(b.start)))[0];

  // 1. Saúde / intercorrência → humano, sempre
  if (RE.risk.test(t)) { greet(); return transfer(c, 'saude'); }
  // Estados pendentes
  if (ctx.stage === 'confirm_cancel') {
    const a = apptById(ctx.appt);
    if (/reagend|remarc/.test(t)) { ctx.mode = 'reagendar'; return offer(c, parsePeriod(t)); }
    if (RE.yes.test(t) || /cancelar/.test(t)) { setApptStatus(a, 'cancelado', 'pedido da paciente pela assistente', 'Assistente virtual'); ctx.stage = null; say(`Pronto, cancelei seu horário de ${slotTxt(a.date, a.start)}. O horário foi liberado. Quando quiser remarcar, é só me chamar.`); return; }
    if (RE.no.test(t) || /manter/.test(t)) { ctx.stage = null; say('Combinado, seu horário continua mantido.'); return; }
  }
  if (ctx.stage === 'oferecendo' && ctx.offered && ctx.offered.length) {
    const pick = matchOffer(t, ctx.offered);
    if (pick) return book(c, pick);
    if (/nenhum|outro|outra data|nao posso|outras opcoes|procurar outra/.test(t)) { const per = parsePeriod(t); if (!per.given) { const last = ctx.offered.at(-1)[0]; ctx.from = ymd(addDays(parseYmd(last), 1)); } return offer(c, per); }
  }
  if (ctx.stage === 'ask_name') {
    const namePart = raw.split(/[,.;!\n]| e prefiro| prefiro/)[0].replace(/^(meu nome (e|é)|me chamo|sou a|sou o|é|e)\s+/i, '').trim();
    if (/^[A-Za-zÀ-ÿ']+(\s+[A-Za-zÀ-ÿ']+)+$/.test(namePart) && namePart.length <= 60) {
      const nm = namePart.split(/\s+/).map(w => w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');
      if (p.name !== nm) { addHistory(p.id, 'Nome confirmado na conversa: ' + nm); p.name = nm; }
      ctx.nameOk = true; const per = parsePeriod(t);
      ctx.period = mergePer(ctx.period, per);
      return startScheduling(c, ctx.period);
    }
    say('Para registrar o agendamento, pode me informar seu nome completo? (nome e sobrenome)'); return;
  }
  if (ctx.stage === 'ask_period') { const per = parsePeriod(t); if (per.given || RE.yes.test(t)) { ctx.period = mergePer(ctx.period, per); ctx.period.given = true; return offer(c, ctx.period); } }
  if (ctx.stage === 'sem_vaga' && /procurar|outra data|outra semana/.test(t)) { ctx.from = ymd(addDays(new Date(), 7)); return offer(c, Object.assign(parsePeriod(t), { dow:null })); }

  // 2. Perguntas clínicas / fotos / doses → avaliação
  if (RE.clinical.test(t)) { greet(); ctx.stage = 'perguntou_agendar'; say('Essa é uma ótima pergunta, e quem pode responder com segurança é ' + drw('a') + ', na sua avaliação individual. Eu não avalio fotos e não indico procedimentos, quantidades ou cuidados específicos. Quer que eu veja um horário de avaliação para você?', ['Sim, ver horários','Falar com a recepção']); return; }
  // 3. Pedido de humano
  if (RE.human.test(t)) { greet(); return transfer(c, 'pedido'); }
  // 4. Cancelamento
  if (RE.cancel.test(t)) { greet(); const a = nextAppt(); if (!a) { say('Não encontrei agendamentos futuros no seu cadastro. Se quiser, chamo a recepção para verificar.', ['Falar com a recepção']); return; }
    ctx.stage = 'confirm_cancel'; ctx.appt = a.id; say(`Encontrei seu horário: ${apptLabel(a)}, ${slotTxt(a.date, a.start)}. Você confirma o cancelamento?`, ['Sim, cancelar','Prefiro reagendar','Não, manter']); return; }
  // 5. Reagendamento
  if (RE.resched.test(t)) { greet(); const a = nextAppt(); if (!a) { say('Não encontrei um agendamento futuro para reagendar. Quer marcar um novo horário?', ['Sim, ver horários']); ctx.stage = 'perguntou_agendar'; return; }
    ctx.mode = 'reagendar'; ctx.appt = a.id; say(`Sem problema! Seu horário atual é ${slotTxt(a.date, a.start)}. Vou verificar os horários disponíveis para você.`); return offer(c, parsePeriod(t)); }
  // 6. Preço
  if (RE.price.test(t)) { greet(); ctx.stage = 'perguntou_agendar';
    const ev = S.settings.evalPrice ? `A consulta de avaliação é ${S.settings.evalPrice}. ` : '';
    say(`${ev}Os valores dos procedimentos dependem do plano definido ${drw('pela')} na avaliação individual, e a equipe passa todos os detalhes.${S.settings.payments ? ' Formas de pagamento: ' + S.settings.payments + '.' : ''} Posso ver um horário de avaliação para você?`, ['Sim, ver horários','Falar com a recepção']); return; }
  // 7. Endereço / funcionamento
  if (RE.address.test(t)) { greet(); say(S.settings.address ? `Estamos em: ${S.settings.address}.` : 'A equipe te envia a localização certinha por aqui. Posso ajudar com mais alguma coisa?'); return; }
  if (RE.hours.test(t) && !RE.schedule.test(t)) { greet(); const h = S.settings.hours; say(`Atendemos de segunda a sexta, das ${hm(h[1][0])} às ${hm(h[1][1])}${h[6] ? `, e aos sábados das ${hm(h[6][0])} às ${hm(h[6][1])}` : ''}. Quer que eu veja um horário?`, ['Sim, ver horários']); ctx.stage = 'perguntou_agendar'; return; }
  // 8. Procedimento mencionado
  const sk = SVC_KEYS_FN().find(([, re]) => re.test(t));
  if (sk) { greet(); const s = svcById(sk[0]); ctx.svc = s.id; if (!p.interests.includes(s.id)) p.interests.push(s.id);
    if (s.id === 'lumini' && S.lumini.show) say(`${S.lumini.name}: ${S.lumini.concept} Começa sempre por uma avaliação individual com ${DR()}.`); else say(s.ai + (/avalia/.test(norm(s.ai)) ? '' : ' Para indicar o tratamento mais adequado, ' + drw('a') + ' precisará realizar sua avaliação individual.'));
    if (RE.schedule.test(t)) { ctx.period = mergePer(ctx.period, parsePeriod(t)); return startScheduling(c, ctx.period); }
    ctx.stage = 'perguntou_agendar'; say('Quer que eu veja horários disponíveis para uma avaliação?', ['Sim, ver horários','Só queria informações']); return; }
  // 9. Intenção de agendar
  if (RE.schedule.test(t) || (ctx.stage === 'perguntou_agendar' && RE.yes.test(t))) { greet(); ctx.period = mergePer(ctx.period, parsePeriod(t)); return startScheduling(c, ctx.period); }
  if (RE.no.test(t)) { say('Imagina! Fico à disposição. Quando quiser agendar sua avaliação, é só me chamar por aqui.'); ctx.stage = null; return; }
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\b/.test(t) && !ctx.greeted) { greet(); say('Como posso te ajudar hoje?', ['Conhecer os procedimentos','Ver horários','Falar com a recepção']); return; }
  if (/conhecer os procedimentos|procedimentos|servicos|o que voces fazem/.test(t)) { greet(); say(cw('Na') + ' temos: ' + S.services.filter(s => s.active).map(s => s.name).join(', ') + '. Sobre qual deles você quer saber?'); return; }
  // 10. Não entendeu
  greet(); ctx.unknown = (ctx.unknown || 0) + 1;
  if (ctx.unknown >= 2) return transfer(c, 'complexa');
  say('Posso te ajudar com informações gerais sobre os procedimentos, horários para avaliação, ou chamar a recepção. O que você prefere?', ['Ver horários','Conhecer os procedimentos','Falar com a recepção']);
}
function mergePer(a, b) { a = a || {}; return { part: b.part || a.part || null, nextWeek: b.nextWeek || a.nextWeek || false, tomorrow: b.tomorrow || a.tomorrow || false, today: b.today || a.today || false, dow: b.dow != null ? b.dow : (a.dow != null ? a.dow : null), any: b.any || a.any, given: b.given || a.given }; }
function startScheduling(c, per) {
  const ctx = c.ctx; const say = (text, opts) => c.msgs.push({ from:'ia', text, opts, at:nowIso() });
  if (!ctx.nameOk) { ctx.stage = 'ask_name'; say('Vou verificar os horários disponíveis para você. Antes, pode me informar seu nome completo? Usamos só para registrar o seu agendamento.'); return; }
  if (!per || !per.given) { ctx.stage = 'ask_period'; say('Você prefere manhã ou tarde? Se tiver um dia da semana preferido, pode me dizer também.', ['Manhã','Tarde','Semana que vem','Qualquer horário']); return; }
  offer(c, per);
}
function offer(c, per) {
  const ctx = c.ctx; const say = (text, opts) => c.msgs.push({ from:'ia', text, opts, at:nowIso() });
  const re = ctx.mode === 'reagendar' && apptById(ctx.appt);
  const dur = re ? re.dur : 40; const pr = re ? re.prof : 'grazi';
  const today = sod(new Date()); let from = ctx.from || ymd(today); ctx.from = null;
  if (per.nextWeek) from = ymd(addDays(mondayOf(today), 7));
  else if (per.tomorrow) from = ymd(addDays(today, 1));
  const filter = per.dow != null ? (d => d.getDay() === per.dow) : per.today ? (d => ymd(d) === ymd(today)) : per.tomorrow ? (d => ymd(d) === ymd(addDays(today,1))) : null;
  const slots = nextSlots(dur, pr, per.part, ctx.n || 3, from, filter, re && re.id, re ? [re.date, re.start] : null);
  if (!slots.length) { ctx.stage = 'sem_vaga'; say(`Não encontrei horários livres ${per.dow != null ? 'nesse dia' : 'nesse período'}${per.dow === 0 ? ' (aos domingos a clínica não atende)' : ''}. Posso procurar em outra data ou passar para a recepção verificar um encaixe.`, ['Procurar outra data','Falar com a recepção']); return; }
  ctx.offered = slots; ctx.stage = 'oferecendo';
  say(`Consultei a agenda ${drw('da')} agora. Estes horários estão livres${re ? '' : ' para sua avaliação (40 min)'}:\n` + slots.map(([d,m], i) => `${i+1}. ${slotTxt(d, m)}`).join('\n') + '\nQual fica melhor para você?', slots.map(([d,m]) => slotTxt(d, m)));
}
function matchOffer(t, offered) {
  const n = t.match(/^\s*(\d)\s*$|\b(opcao|numero|o)\s*(\d)\b/); const idx = n ? Number(n[1] || n[3]) - 1 : /primeir/.test(t) ? 0 : /segund(?!a-feira|a feira)/.test(t) && !/segunda[- ]feira/.test(t) && offered.length > 1 && !/segunda/.test(t) ? 1 : /terceir/.test(t) ? 2 : -1;
  if (idx >= 0 && offered[idx]) return offered[idx];
  const tm = t.match(/(\d{1,2})\s*(h|:)\s*(\d{2})?/);
  const byDay = offered.filter(([d]) => t.includes(norm(DOW[parseYmd(d).getDay()])) || t.includes(fmtDate(d)));
  if (tm) { const mm = Number(tm[1])*60 + Number(tm[3]||0); const f = (byDay.length ? byDay : offered).find(([, m]) => m === mm); if (f) return f; }
  if (byDay.length === 1) return byDay[0];
  return null;
}
function book(c, [d, m]) {
  const ctx = c.ctx; const p = patById(c.pid); const say = (text, opts) => c.msgs.push({ from:'ia', text, opts, at:nowIso() });
  const re = ctx.mode === 'reagendar' && apptById(ctx.appt);
  const dur = re ? re.dur : 40; const pr = re ? re.prof : 'grazi';
  if (conflicts(d, m, dur, pr, null, re && re.id).length) { say('Esse horário acabou de ser ocupado na agenda. Vou buscar outras opções para você.'); ctx.from = d; return offer(c, { part:null, given:true }); }
  if (re) { moveAppt(re, d, m, 'pedido da paciente pela assistente'); re.log[0].by = 'Assistente virtual'; ctx.mode = null; ctx.stage = 'agendado';
    say(`Pronto! Seu horário foi alterado para ${slotTxt(d, m)}. O horário anterior foi liberado. (Confirmação simulada — envio real depende da integração.)`); return; }
  const room = ['s1','s2'].find(r => !conflicts(d, m, dur, pr, r).length) || 's1';
  const a = createAppt({ pid:p.id, type:'avaliacao', svc: ctx.svc || p.interests[0] || null, prof:pr, room, date:d, start:m, dur, status: S.ai.approval ? 'reservado' : 'confirmado', origin:'ia', by:'Assistente virtual' });
  a._new = true; ctx.stage = 'agendado'; ctx.lastAppt = a.id;
  if (S.ai.approval) {
    say(`Perfeito, ${p.name.split(' ')[0]}! Reservei ${slotTxt(d, m)} para sua avaliação. ${drw('A')} confirma em seguida e eu te aviso por aqui. (Mensagem simulada.)`);
    notify('pedido', `Novo pedido de horário: ${p.name} · ${apptLabel(a)} · ${slotTxt(d, m)}. Toque para aprovar.`, ['visao'], { title:'24h · aprovação' });
  } else {
    say(`Agendado, ${p.name.split(' ')[0]}! Sua avaliação está marcada para ${slotTxt(d, m)}. Você vai receber um lembrete antes. (Mensagem simulada.)`);
    notify('agendado', `Agendamento criado pela assistente: ${p.name} · ${slotTxt(d, m)}`, ['agenda']);
  }
}
function transfer(c, kind) {
  const p = patById(c.pid); const say = text => c.msgs.push({ from:'ia', text, at:nowIso() });
  const off = humanHoursNow() ? '' : ` Nossa equipe retorna às ${S.ai.humanStart} e te responde com prioridade.`;
  if (kind === 'saude') say('Entendo. Como sua mensagem envolve sua saúde, vou passar agora para a equipe ' + drw('da') + ', que vai te orientar com segurança. Se for uma emergência, ligue 192 (SAMU). Se precisar conversar agora, o CVV atende 24h pelo 188.' + off);
  else if (kind === 'pedido') say('Claro! Vou chamar a equipe para continuar com você por aqui.' + off);
  else say('Quero que você receba a informação certinha, então vou pedir para a equipe te responder.' + off);
  c.state = 'aguardando'; c.ctx.stage = null;
  c.msgs.push({ from:'sistema', text:'Transferida para atendimento humano' + (kind === 'saude' ? ' · prioridade (assunto de saúde)' : ''), at:nowIso() });
  setStage(p.id, 'Aguardando humano', kind === 'saude' ? 'assunto de saúde' : '');
  notify('humano', `${p.name} aguarda atendimento humano${kind === 'saude' ? ' · prioridade' : ''}`, ['atendimento', c.id], { title: kind === 'saude' ? '24AGÁ · prioridade' : undefined });
}

/* ================= TELA: ASSISTENTE DE IA ================= */
const SIM_STEPS = [
  'Mariana envia a primeira mensagem',
  'Mariana informa nome e preferência',
  'Mariana escolhe um horário: a assistente valida e reserva',
  '' + DR() + ' aprova no celular',
  'Dia da consulta: comparecimento e avaliação',
  '' + DR() + ' monta a proposta (sem decisão da IA)',
  'Proposta impressa e entregue · retorno agendado',
];
VIEWS.assistente = () => {
  const sim = S.sim; const c = sim.view === 'test' ? convById(sim.testConv) : convById(sim.conv);
  const ai = S.ai;
  return `
  <div class="page-h"><div><span class="eyebrow">Configurar minha assistente</span><h1>${esc(ai.name)}</h1><p>Acolhe, responde dúvidas administrativas com textos aprovados, consulta a agenda e conduz agendamentos. Não atua como profissional de saúde.</p></div>
    <div class="row"><span class="chip ${ai.on ? 'st-confirmado' : 'st-cancelado'}"><span class="dot"></span>${ai.on ? 'Ligada' : 'Desligada'}</span></div></div>
  <div class="sim">
    <div class="stack">
      <div class="card"><div class="card-h"><div><h3>Simulador guiado</h3><p class="muted small">Paciente fictícia Mariana Oliveira. Cada etapa altera agenda, funil, painel e notificações de verdade.</p></div></div>
        <div class="row" style="margin-bottom:12px"><button class="btn primary" id="sim-start" data-a="simStart">${ic('play')} ${sim.step ? 'Reiniciar simulação' : 'Iniciar simulação'}</button><button class="btn" data-a="simNext" ${!sim.step || sim.step >= SIM_STEPS.length ? 'disabled' : ''}>Avançar etapa ${ic('arrow')}</button><button class="btn ghost" data-a="simReset" ${!sim.step ? 'disabled' : ''}>${ic('redo')} Reiniciar</button></div>
        <div class="steps">${SIM_STEPS.map((s, i) => `<div class="step ${i < sim.step ? 'done' : ''} ${i === sim.step && sim.step ? 'cur' : ''}"><span class="n">${i < sim.step ? '✓' : i+1}</span><span>${s}</span></div>`).join('')}</div>
        ${sim.changes && sim.changes.length ? `<div style="margin-top:14px"><div class="lbl" style="margin-bottom:6px">O que mudou nesta etapa</div><div class="changes">${sim.changes.map(([t, r, id]) => `<div>${ic('check')}<span class="grow">${esc(t)}</span>${r ? `<button class="btn sm" data-a="simGo" data-r="${r}" data-id="${id||''}">Ver</button>` : ''}</div>`).join('')}</div></div>` : ''}
      </div>
      <div class="phonebox-wrap"><div class="phonebox" style="border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;height:520px;background:var(--chat-bg)">
        <div class="chh" style="background:var(--band);color:var(--band-fg);padding:12px 14px;display:flex;gap:10px;align-items:center"><img src="mono.svg" alt="" style="width:30px;height:30px;object-fit:contain;background:#05070D;border-radius:50%;padding:3px;border:1px solid var(--accent)"><div class="grow"><b style="font-weight:500">${c ? esc(patById(c.pid).name) : 'Simulação'}</b><div style="font-size:11px;color:var(--band-muted)">${c ? CONV_LABEL[c.state] : 'Inicie a simulação ou um caso de teste'} · conversa local</div></div>${sim.view === 'test' ? '<span class="chip">teste</span>' : ''}</div>
        <div class="msgs" id="sim-msgs">${c ? c.msgs.map(msgHtml).join('') + (c._typing ? '<div class="typing">assistente digitando…</div>' : '') : '<div class="empty">A conversa aparece aqui.</div>'}</div>
        ${c ? `<form class="compose" data-f="simSay" style="flex-direction:row"><input class="input" id="sim-in" style="border-radius:999px" autocomplete="off" placeholder="Escreva como a paciente para testar…"><button class="btn primary" aria-label="Enviar">${ic('send')}</button></form>` : ''}
      </div></div>
      <div class="card"><div class="card-h"><h3>Casos de teste</h3><span class="muted xs">cada um abre uma conversa de teste</span></div>
        <div class="tests">${[['livre','Horário livre'],['ocupado','Horário ocupado'],['reagendar','Reagendamento'],['cancelar','Cancelamento'],['falta','Falta de informação'],['complexa','Pergunta complexa'],['humano','Pedido de atendimento humano'],['saude','Assunto de saúde'],['semvaga','Ausência de horários']].map(([k,l]) => `<button class="btn sm" data-a="simTest" data-k="${k}">${l}</button>`).join('')}</div></div>
    </div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>Controles</h3></div>
        <div class="field"><label for="ai-name">Nome da assistente</label><input class="input" id="ai-name" value="${esc(ai.name)}" data-c="aiField" data-k="name"></div>
        ${[['on','Ligar/desligar assistente','Desligada, todas as mensagens vão para a equipe.'],['approval','Exigir aprovação humana para agendamentos','A assistente reserva; você confirma com um toque.'],['logs','Registrar logs e custos de uso','Para acompanhar volume e custo do serviço de IA.']].map(([k,l,d]) => `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="grow"><div>${l}</div><div class="muted xs">${d}</div></div><button class="switch ${ai[k]?'on':''}" data-a="aiToggle" data-k="${k}" aria-label="${l}" aria-pressed="${ai[k]}"></button></div>`).join('')}
        <div class="grid2" style="margin-top:12px"><div class="field"><label for="ai-hs">Equipe disponível a partir de</label><input class="input" type="time" id="ai-hs" value="${ai.humanStart}" data-c="aiField" data-k="humanStart"></div><div class="field"><label for="ai-he">até</label><input class="input" type="time" id="ai-he" value="${ai.humanEnd}" data-c="aiField" data-k="humanEnd"></div></div>
        <p class="muted xs" style="margin-top:6px">Fora desse horário, a assistente atende e avisa quando a equipe retorna.</p>
        ${ai.logs ? `<div class="note" style="margin-top:12px">Uso registrado: <b>${ai.usage.conversations}</b> conversas atendidas pela assistente · custo: <b>${esc(ai.usage.cost)}</b></div>` : ''}
      </div>
      <div class="card"><div class="card-h"><div><h3>Base de conhecimento</h3><p class="muted small">A assistente lê apenas o que estiver aqui e os textos informativos de cada tratamento.</p></div></div>
        <div class="stack">
          <div class="field"><label for="kb-intro">Apresentação</label><textarea class="input" id="kb-intro" data-c="aiField" data-k="intro">${esc(ai.intro)}</textarea></div>
          <div class="grid2"><div class="field"><label for="kb-addr">Endereço</label><input class="input" id="kb-addr" placeholder="A preencher pela clínica" value="${esc(S.settings.address)}" data-c="setField" data-k="address"></div>
          <div class="field"><label for="kb-eval">Valor da avaliação</label><input class="input" id="kb-eval" placeholder="Em branco = a equipe informa" value="${esc(S.settings.evalPrice)}" data-c="setField" data-k="evalPrice"></div></div>
          <div class="field"><label for="kb-pay">Formas de pagamento autorizadas</label><input class="input" id="kb-pay" placeholder="A preencher pela clínica" value="${esc(S.settings.payments)}" data-c="setField" data-k="payments"></div>
          <div class="field"><label for="kb-pol">Políticas de agendamento</label><textarea class="input" id="kb-pol" data-c="setField" data-k="cancelPolicy">${esc(S.settings.cancelPolicy)}</textarea></div>
          <div><div class="lbl">Horário</div><div class="small">Segunda a sexta ${hm(S.settings.hours[1][0])}–${hm(S.settings.hours[1][1])}${S.settings.hours[6] ? ` · Sábado ${hm(S.settings.hours[6][0])}–${hm(S.settings.hours[6][1])}` : ''} <button class="btn sm" data-a="go" data-r="configuracoes">Editar</button></div></div>
          <div><div class="lbl">Serviços visíveis para a assistente</div><div class="row" style="gap:6px;margin-top:4px">${S.services.filter(s=>s.active).map(s => `<span class="tag">${esc(s.name)}</span>`).join('')} <button class="btn sm" data-a="go" data-r="servicos">Editar textos</button></div></div>
          <div><div class="lbl" style="margin-bottom:6px">Mensagens aprovadas</div>${ai.approved.map((m, i) => `<div class="row" style="margin-bottom:6px"><input class="input grow" value="${esc(m)}" data-c="aiApproved" data-i="${i}" aria-label="Mensagem aprovada ${i+1}"><button class="btn sm" data-a="aiDelMsg" data-i="${i}" aria-label="Remover">${ic('x')}</button></div>`).join('')}<button class="btn sm" data-a="aiAddMsg">${ic('plus')} Adicionar mensagem</button></div>
        </div></div>
      <div class="card"><div class="card-h"><h3>Regras de segurança</h3><span class="chip">${ic('shield')} sempre ativas</span></div>
        <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px">
          <li>Não diagnostica, não interpreta fotos, não prescreve.</li><li>Não afirma contraindicações individuais nem sugere doses.</li><li>Não promete resultados.</li><li>Saúde, reações, emergências e situações delicadas: transfere para a equipe com prioridade.</li><li>Só oferece horários que estão livres na agenda.</li><li>Não envia dados clínicos ao serviço de IA, a analytics ou a campanhas.</li></ul>
        <p class="note" style="margin-top:12px">Nesta demonstração, a assistente funciona com regras locais. Na versão real, ela usará um serviço de IA contratado, com a mesma base aprovada e estas regras.</p></div>
    </div>
  </div>`;
};
AFTER.assistente = () => { const m = $('#sim-msgs'); if (m) m.scrollTop = m.scrollHeight; };

function simReset() {
  const sim = S.sim;
  if (sim.pid) { S.appts = S.appts.filter(a => a.pid !== sim.pid); S.proposals = S.proposals.filter(p => p.pid !== sim.pid); S.conversations = S.conversations.filter(c => c.pid !== sim.pid); S.patients = S.patients.filter(p => p.id !== sim.pid); S.tasks = S.tasks.filter(t => t.sim !== true); S.notifications = S.notifications.filter(n => !n.sim); }
  S.sim = { step:0, changes:[] };
}
function simStep() {
  const sim = S.sim; const ch = [];
  const before = S.notifications.length;
  if (sim.step === 0) {
    const p = createPatient({ name:'Mariana', phone:'(65) 98123-4567', origin:'Anúncio Meta (tráfego pago)', stage:'Novo contato', interests:[] });
    const c = { id:uid('c'), pid:p.id, state:'ia', unread:0, ctx:{ n:2 }, msgs:[] };
    S.conversations.unshift(c); sim.pid = p.id; sim.conv = c.id; sim.view = 'sim';
    notify('conversa', 'Nova conversa: Mariana (anúncio)', ['atendimento', c.id], { push:false });
    patientSays(c, N().sim.q, { instant:true });
    ch.push(['Contato criado no funil como “IA em atendimento” (origem: anúncio)', 'pacientes', p.id], ['Conversa visível para a recepção na central de atendimento', 'atendimento', c.id], ['A assistente explicou ' + N().sim.what + ' de forma geral, sem indicar uso, e pediu o nome', null]);
  } else if (sim.step === 1) {
    const c = convById(sim.conv); patientSays(c, 'Mariana Oliveira, prefiro de manhã', { instant:true });
    ch.push(['Nome registrado no cadastro: Mariana Oliveira', 'pacientes', sim.pid], ['A assistente consultou a agenda real e ofereceu 2 horários livres na semana que vem, de manhã', 'agenda']);
  } else if (sim.step === 2) {
    const c = convById(sim.conv); patientSays(c, '1', { instant:true });
    const a = apptById(c.ctx.lastAppt); sim.appt = a && a.id;
    if (a) { UI.agenda.anchor = a.date; ch.push([`Horário validado sem conflito e reservado: ${slotTxt(a.date, a.start)}`, 'agenda'], ['Funil: Mariana passou para “Agendada”', 'pacientes', sim.pid], ['Pedido de aprovação enviado ao seu celular e ao painel', 'visao']); }
  } else if (sim.step === 3) {
    const a = apptById(sim.appt); if (a) { approveAppt(a); ch.push(['Status: Reservado → Confirmado', 'agenda'], ['Mariana recebeu a confirmação na conversa (simulada)', 'atendimento', sim.conv], ['Indicador “Confirmadas” do painel atualizado', 'visao']); }
  } else if (sim.step === 4) {
    const a = apptById(sim.appt); if (a) setApptStatus(a, 'compareceu', 'simulação: avanço até o dia da consulta');
    const p = patById(sim.pid); p.eval = { date:a ? a.date : ymd(new Date()), valid:15, goal:N().sim.goal, obs:'(restrito à profissional)', svcs:['botox'], sess:'', next:'' };
    addHistory(p.id, 'Avaliação profissional registrada ' + drw('pela') + ' (conteúdo restrito)');
    ch.push(['Comparecimento registrado pela recepção', 'agenda'], ['Avaliação registrada ' + drw('pela') + ' em área restrita', 'pacientes', sim.pid], ['Funil: “Compareceu”', 'pacientes', sim.pid]);
  } else if (sim.step === 5) {
    const pr = createProposal(sim.pid, { objective:'Objetivo descrito pela paciente: ' + N().sim.goal.toLowerCase() + '.', items:[{ svc:'botox', name:svcById('botox').name, desc:'Definido na avaliação', qty:1, price:svcById('botox').ref || 0 }], msg:'Mariana, foi um prazer receber você. Preparei este plano com carinho, a partir da nossa conversa e da sua avaliação.' });
    setPropStatus(pr, 'pronta para revisão'); sim.prop = pr.id; UI.sel.proposal = pr.id;
    ch.push([`Proposta ${pr.num} criada ${drw('pela')} (valores fictícios)`, 'propostas', pr.id], ['Nenhum item foi sugerido pela IA: a escolha é da profissional', null]);
  } else if (sim.step === 6) {
    const pr = propById(sim.prop); if (pr) setPropStatus(pr, 'entregue');
    S.tasks.unshift({ id:uid('t'), text:'Retorno administrativo: Mariana Oliveira sobre a proposta', who:'camila', due:ymd(addDays(new Date(), 5)), done:false, sim:true });
    ch.push(['Proposta impressa e marcada como “entregue”', 'propostas', sim.prop], ['Funil: “Proposta enviada”', 'pacientes', sim.pid], ['Tarefa de retorno criada para a recepção em 5 dias', null]);
  }
  S.notifications.slice(0, S.notifications.length - before).forEach(n => n.sim = true);
  sim.step++; sim.changes = ch; sim.view = 'sim';
  commit();
}
function simTest(k) {
  const p = createPatient({ name:'Paciente Teste ' + (S.conversations.filter(c => c.test).length + 1), phone:'(65) 90000-0000', origin:'Site', stage:'Novo contato' });
  const c = { id:uid('c'), pid:p.id, state:'ia', unread:0, ctx:{ nameOk:true, greeted:false }, msgs:[], test:true };
  S.conversations.unshift(c); S.sim.testConv = c.id; S.sim.view = 'test'; S.sim.changes = [];
  const say = txt => patientSays(c, txt, { instant:true });
  const mkAppt = () => { const s = nextSlots(40, 'grazi', null, 1, ymd(addDays(new Date(), 2)))[0]; return createAppt({ pid:p.id, type:'avaliacao', svc:'botox', prof:'grazi', room:'s1', date:s[0], start:s[1], dur:40, status:'confirmado', by:'Camila (recepção)' }); };
  if (k === 'livre') { say(N().sim.livre); S.sim.changes = [['A assistente leu a agenda e ofereceu apenas horários livres da semana que vem, à tarde', 'agenda']]; }
  if (k === 'ocupado') { say('Tem horário pra avaliação semana que vem de manhã?'); const [d, m] = c.ctx.offered[0];
    createAppt({ pid:'p1', type:'retorno', svc:'botox', prof:'grazi', room:'s1', date:d, start:m, dur:30, status:'confirmado', by:'Camila (recepção)' });
    c.msgs.push({ from:'sistema', text:`(Teste) A recepção acabou de ocupar ${slotTxt(d, m)}`, at:nowIso() }); say('1');
    S.sim.changes = [['A assistente revalidou o horário antes de reservar, percebeu o conflito e ofereceu novas opções', 'agenda']]; }
  if (k === 'reagendar') { const a = mkAppt(); c.ctx.greeted = true; say('Preciso reagendar meu horário, pode ser à tarde?'); if (c.ctx.offered) say('1'); S.sim.changes = [['Horário antigo liberado e novo horário ocupado, com registro no histórico', 'agenda']]; }
  if (k === 'cancelar') { mkAppt(); say('Oi, vou precisar cancelar meu horário'); say('Sim, cancelar'); S.sim.changes = [['Agendamento cancelado com confirmação da paciente; horário liberado', 'agenda']]; }
  if (k === 'falta') { say('oi'); say('hmm'); S.sim.changes = [['Sem informação suficiente, a assistente oferece caminhos claros', null]]; }
  if (k === 'complexa') { say(N().sim.complexa); S.sim.changes = [['Pergunta clínica: a assistente não responde e orienta para avaliação com ' + drw('a') + '', null]]; }
  if (k === 'humano') { say('Quero falar com uma pessoa, por favor'); S.sim.changes = [['Conversa transferida; a recepção recebe notificação', 'atendimento', c.id]]; }
  if (k === 'saude') { say(N().sim.saude); S.sim.changes = [['Assunto de saúde: transferência imediata com prioridade e orientação de urgência', 'atendimento', c.id]]; }
  if (k === 'semvaga') { say('Tem horário para avaliação no domingo?'); S.sim.changes = [['Sem vagas no período: oferece outra data ou a recepção', null]]; }
  commit();
}
Object.assign(A, {
  simStart: () => { simReset(); simStep(); },
  simNext: () => simStep(),
  simReset: () => { simReset(); commit('Simulação reiniciada'); },
  simGo: t => { goTo(t.dataset.r, t.dataset.id || undefined); },
  simTest: t => simTest(t.dataset.k),
  aiToggle: t => { const k = t.dataset.k; S.ai[k] = !S.ai[k]; commit(k === 'on' ? (S.ai.on ? 'Assistente ligada' : 'Assistente desligada: mensagens vão para a equipe') : 'Configuração salva'); },
  aiAddMsg: () => { S.ai.approved.push('Nova mensagem aprovada'); commit(); },
  aiDelMsg: t => { S.ai.approved.splice(Number(t.dataset.i), 1); commit(); },
});
Object.assign(C, {
  aiField: t => { S.ai[t.dataset.k] = t.value; saveState(); toast('Salvo'); if (t.dataset.k === 'name') render(); },
  setField: t => { S.settings[t.dataset.k] = t.value; saveState(); toast('Salvo'); },
  aiApproved: t => { S.ai.approved[Number(t.dataset.i)] = t.value; saveState(); toast('Mensagem atualizada'); },
});
F.simSay = () => { const i = $('#sim-in'); const v = i.value.trim(); if (!v) return; const c = S.sim.view === 'test' ? convById(S.sim.testConv) : convById(S.sim.conv); if (c) patientSays(c, v); };
