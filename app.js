/* 24AGÁ — núcleo: navegação, perfis, notificações, apresentação comercial */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const $ = (sel, root=document) => root.querySelector(sel);

const IC = {
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  cal:'<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.4.2 4 1.9 4.5 4.9"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  doc:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  home:'<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  bell:'<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  shield:'<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/>',
  wallet:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  tag:'<path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z"/><circle cx="8" cy="8.5" r="1.4"/>',
  share:'<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',
  print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  user:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c.8-4 3.8-6.3 7.5-6.3s6.7 2.3 7.5 6.3"/>',
  send:'<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  redo:'<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z"/>',
  building:'<path d="M4 21V5l8-2v18M12 8h8v13M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01M2 21h20"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
};
const ic = (n, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;

const PROFILES = {
  admin:{ get label(){ return DR() + ' · Administração'; }, staff:'grazi', desc:'Acesso gerencial completo da clínica', routes:['visao','agenda','atendimento','assistente','pacientes','propostas','servicos','automacoes','relatorios','configuracoes'] },
  recepcao:{ label:'Camila · Recepção', staff:'camila', desc:'Agenda, atendimento, cadastros e agendamentos. Sem informações clínicas.', routes:['visao','agenda','atendimento','pacientes','servicos','automacoes'] },
  profissional:{ get label(){ return PRO() + ' · Profissional'; }, staff:'paula', desc:'Agenda própria, pacientes autorizadas e propostas pertinentes', routes:['visao','agenda','pacientes','propostas','servicos'] },
  plataforma:{ label:'Dono da plataforma 24AGÁ', staff:null, desc:'Clientes, planos, pagamentos e consumo. Nunca dados de pacientes.', routes:['licencas'] },
};
const ROUTES = {
  visao:{ t:'Visão geral', i:'home', g:'Clínica' }, agenda:{ t:'Agenda', i:'cal', g:'Clínica' }, atendimento:{ t:'Atendimento', i:'chat', g:'Clínica' },
  assistente:{ t:'Assistente de IA', i:'spark', g:'Clínica' }, pacientes:{ t:'Pacientes e funil', i:'users', g:'Clínica' }, propostas:{ t:'Propostas', i:'doc', g:'Clínica' },
  servicos:{ t:'Tratamentos', i:'heart', g:'Gestão' }, automacoes:{ t:'Lembretes e retornos', i:'bolt', g:'Gestão' }, relatorios:{ t:'Relatórios', i:'chart', g:'Gestão' },
  configuracoes:{ t:'Configurações', i:'gear', g:'Gestão' }, licencas:{ t:'Clientes 24AGÁ', i:'building', g:'Plataforma 24AGÁ' },
};

const UI = {
  mode:'pitch', route:'visao', profile:'admin', more:false, drawer:null, drawerTab:'notif', modal:null,
  sel:{ conv:null, patient:null, proposal:null }, pTab:'resumo',
  agenda:{ view: innerWidth < 760 ? 'dia' : 'semana', anchor: ymd(new Date()), prof:'all', status:'all', room:'all', svc:'all' },
  dash:{ period:'semana', prof:'all', svc:'all' }, rep:{ period:'mes', prof:'all', svc:'all' },
  pac:{ view:'funil', q:'', tag:'all' }, prop:{ status:'all' }, inbox:{ filter:'all', as:'paciente' }, tour:null, tenantView:null, detail:false,
};
const prof = () => PROFILES[UI.profile];
const meStaff = () => staffById(prof().staff);
const meName = () => UI.profile === 'admin' ? DR() : UI.profile === 'recepcao' ? 'Camila (recepção)' : UI.profile === 'profissional' ? PRO() : 'Admin. plataforma';
const canClinical = () => UI.profile === 'admin' || UI.profile === 'profissional';
const canMoney = () => UI.profile === 'admin';

/* ---------- Eventos de domínio (mantêm tudo consistente) ---------- */
function notify(type, text, go, opts={}) {
  const n = { id:uid('n'), type, text, at:nowIso(), read:false, go };
  S.notifications.unshift(n);
  if (opts.push !== false) pushToast(text, go, opts.title);
}
function audit(what) { S.audit.unshift({ at:nowIso(), by:meName(), what }); }
function addHistory(pid, text) { const p = patById(pid); if (p) { p.history.unshift({ at:nowIso(), text }); p.last = nowIso(); } }
function setStage(pid, stage, why) {
  const p = patById(pid); if (!p || p.stage === stage) return;
  const from = p.stage; p.stage = stage; addHistory(pid, `Etapa: ${from} → ${stage}${why ? ' (' + why + ')' : ''}`);
}
function addTag(pid, t) { const p = patById(pid); if (p && !p.tags.includes(t)) p.tags.push(t); }
function delTag(pid, t) { const p = patById(pid); if (p) p.tags = p.tags.filter(x => x !== t); }

function createAppt(o) {
  const a = Object.assign({ id:uid('a'), status:'confirmado', origin:'manual', notes:'', log:[] }, o);
  a.log.unshift({ at:nowIso(), by:o.by || meName(), what:'Agendamento criado' + (a.origin === 'ia' ? ' pela assistente virtual' : '') });
  delete a.by;
  S.appts.push(a);
  if (a.pid) {
    addHistory(a.pid, `Agendamento: ${apptLabel(a)} em ${fmtDate(a.date)} às ${hm(a.start)}`);
    const p = patById(a.pid);
    if (p && STAGES.indexOf(p.stage) < STAGES.indexOf('Agendada')) setStage(a.pid, 'Agendada');
    addTag(a.pid, a.status === 'confirmado' ? 'agendamento confirmado' : 'agendamento solicitado');
  }
  return a;
}
function setApptStatus(a, status, reason, by) {
  const from = a.status; a.status = status;
  a.log.unshift({ at:nowIso(), by:by || meName(), what:`Status: ${STATUS_LABEL[from]} → ${STATUS_LABEL[status]}${reason ? ' — ' + reason : ''}` });
  if (status === 'cancelado') a.cancelReason = reason || 'Não informado';
  const p = a.pid && patById(a.pid);
  if (p) {
    addHistory(p.id, `${apptLabel(a)} (${fmtDate(a.date)} ${hm(a.start)}): ${STATUS_LABEL[status]}`);
    if (status === 'confirmado') { delTag(p.id, 'agendamento solicitado'); addTag(p.id, 'agendamento confirmado'); }
    if (status === 'compareceu' && STAGES.indexOf(p.stage) < STAGES.indexOf('Compareceu')) setStage(p.id, 'Compareceu');
  }
  if (status === 'cancelado') notify('cancelado', `Consulta cancelada: ${p ? p.name : apptLabel(a)} · ${fmtDate(a.date)} ${hm(a.start)}`, ['agenda'], { push:false });
}
function moveAppt(a, date, start, reason) {
  const old = `${fmtDate(a.date)} ${hm(a.start)}`;
  a.date = date; a.start = start;
  a.log.unshift({ at:nowIso(), by:meName(), what:`Reagendado de ${old} para ${fmtDate(date)} ${hm(start)}${reason ? ' — ' + reason : ''}` });
  if (a.pid) addHistory(a.pid, `Reagendado para ${fmtDate(date)} às ${hm(start)}`);
  notify('alterado', `Agendamento alterado: ${a.pid ? patById(a.pid).name : 'bloqueio'} → ${fmtDate(date)} ${hm(start)}`, ['agenda'], { push:false });
}
function approveAppt(a) {
  setApptStatus(a, 'confirmado', 'aprovado ' + drw('pela'));
  const c = S.conversations.find(c => c.pid === a.pid);
  if (c) c.msgs.push({ from:'ia', text:`Boa notícia! ${drw('A')} confirmou seu horário: ${fmtDateLong(a.date)} às ${hm(a.start)}. Até lá! (mensagem simulada — envio real depende da integração)`, at:nowIso() });
  toast('Horário aprovado e paciente avisada na simulação');
}
function createPatient(o) {
  const p = Object.assign({ id:uid('p'), email:'', origin:'WhatsApp direto', stage:'Novo contato', interests:[], tags:['primeira consulta'], pref:'qualquer', comm:'WhatsApp', created:nowIso(), last:nowIso(), notes:'', payments:[], history:[] }, o);
  p.history.unshift({ at:nowIso(), text:'Cadastro criado (' + p.origin + ')' });
  S.patients.unshift(p);
  return p;
}
function createProposal(pid, base={}) {
  S.propSeq = (S.propSeq || 110) + 1;
  const pr = Object.assign({ id:uid('pr'), num:'PR-' + new Date().getFullYear() + '-' + String(S.propSeq).padStart(4,'0'), pid, date:ymd(new Date()), validDays:15, layout:'elegance', status:'rascunho', lumini:false,
    msg:'Foi um prazer receber você. Preparei este plano com carinho, a partir da nossa conversa e da sua avaliação.',
    objective:'', items:[], discount:0, payment:S.settings.payments || 'Formas de pagamento a definir pela clínica.', notes:'Cuidados e orientações serão repassados pela profissional antes de cada etapa.', terms:true, prof: prof().staff === 'paula' ? 'paula' : 'grazi', fict:true, history:[] }, base);
  pr.history.unshift({ at:nowIso(), text:'Proposta criada por ' + meName() });
  S.proposals.unshift(pr);
  addHistory(pid, 'Proposta ' + pr.num + ' criada');
  notify('proposta', `Proposta ${pr.num} criada para ${patById(pid).name}`, ['propostas', pr.id], { push:false });
  return pr;
}
function setPropStatus(pr, st) {
  const from = pr.status; if (from === st) return; pr.status = st;
  pr.history.unshift({ at:nowIso(), text:`Status: ${from} → ${st}` });
  addHistory(pr.pid, `Proposta ${pr.num}: ${st}`);
  if (st === 'entregue' || st === 'aguardando retorno') { const p = patById(pr.pid); if (p && STAGES.indexOf(p.stage) < STAGES.indexOf('Proposta enviada')) setStage(pr.pid, 'Proposta enviada'); addTag(pr.pid, 'proposta pendente'); }
  if (st === 'aceita') { setStage(pr.pid, 'Tratamento contratado', 'proposta aceita'); delTag(pr.pid, 'proposta pendente'); notify('aprovada', `Proposta ${pr.num} aceita por ${patById(pr.pid).name}`, ['propostas', pr.id]); }
  if (st === 'não aceita') { delTag(pr.pid, 'proposta pendente'); notify('proposta', `Proposta ${pr.num} não aceita`, ['propostas', pr.id], { push:false }); }
  if (st === 'aguardando retorno') notify('proposta', `Proposta ${pr.num} aguardando retorno`, ['propostas', pr.id], { push:false });
}

/* ---------- Toasts / notificação no telefone ---------- */
function pushToast(text, go, title) {
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<img src="mono.svg" alt=""><div class="grow"><div class="tt"><span>${esc(title || S.settings.product)}</span><span>agora</span></div><p>${esc(text)}</p></div>`;
  el.onclick = () => { el.remove(); if (go) goTo(go[0], go[1]); };
  box.prepend(el); setTimeout(() => el.remove(), 6500);
}
function toast(text) {
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast plain'; el.textContent = text;
  box.prepend(el); setTimeout(() => el.remove(), 3200);
}

/* ---------- Navegação ---------- */
const HASH_TO = { site:['pitch'], proposta:['pitch'], planos:['pitch','planos'], investimento:['pitch','planos'], contato:['pitch','contato'], demonstracao:['demo','visao'], licencas:['demo','licencas'] };
Object.keys(ROUTES).forEach(r => { if (!HASH_TO[r]) HASH_TO[r] = ['demo', r]; });
function setHash(h) { try { history.replaceState(null, '', '#' + h); } catch (e) {} }
function goTo(route, sel) {
  if (route === 'pitch') { UI.mode = 'pitch'; render(); window.scrollTo(0,0); setHash('site'); return; }
  if (UI.mode !== 'demo') UI.mode = 'demo';
  if (route === 'licencas' && UI.profile !== 'plataforma') { UI.profile = 'plataforma'; toast('Perfil alterado para Administrador da plataforma'); }
  if (route !== 'licencas' && UI.profile === 'plataforma') { UI.profile = 'admin'; }
  if (!prof().routes.includes(route)) { toast('Este perfil não tem acesso a ' + ROUTES[route].t); route = prof().routes[0]; }
  UI.route = route; UI.more = false; UI.drawer = null;
  if (sel) { if (route === 'atendimento') UI.sel.conv = sel; if (route === 'pacientes') { UI.sel.patient = sel; UI.pTab = 'resumo'; } if (route === 'propostas') UI.sel.proposal = sel; }
  setHash(route);
  render(); window.scrollTo(0,0);
}
function commit(msg) { saveState(); render(); if (msg) toast(msg); }

/* ---------- Modal genérico ---------- */
function openModal(html, wide) { UI.modal = { html, wide }; renderModal(); }
function closeModal() { UI.modal = null; renderModal(); }
function renderModal() {
  const root = $('#modal-root');
  if (!UI.modal) { root.innerHTML = ''; return; }
  const html = typeof UI.modal.html === 'function' ? UI.modal.html() : UI.modal.html;
  root.innerHTML = `<div class="overlay" data-a="overlay"><div class="modal ${UI.modal.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
}
const mHead = (t, sub) => `<div class="mh"><div><h3>${t}</h3>${sub ? `<p class="muted small">${sub}</p>` : ''}</div><button class="x-btn" data-a="closeModal" aria-label="Fechar">${ic('x')}</button></div>`;

/* ================= SITE DE VENDA DA 24AGÁ ================= */
const PLANS24 = [
  { k:'essencial', name:'Essencial', price:397, impl:1500, who:'Profissional sozinha ou consultório pequeno', feats:['IA no WhatsApp 24h · até 300 conversas/mês','Agenda e funil de pacientes','Aprovação de horários pelo celular','Lembretes de consulta','2 usuários'] },
  { k:'profissional', name:'Profissional', price:697, impl:2500, top:true, who:'Clínica com 2 a 4 profissionais', feats:['Tudo do Essencial','Até 800 conversas/mês','Propostas em PDF com a sua marca','Relatório mensal de resultados','5 usuários'] },
  { k:'premium', name:'Premium', price:1197, impl:3800, who:'Clínica maior ou com mais de uma unidade', feats:['Tudo do Profissional','Até 2.000 conversas/mês','Campanhas de reativação de pacientes','Várias salas, profissionais e unidades','Usuários ilimitados · suporte prioritário'] },
];
const IMPL24 = {
  essencial:['Conexão do WhatsApp oficial','Cadastro de até 10 serviços e valores','Treinamento da IA: tom de voz, dúvidas frequentes e regras','1 hora de treinamento da equipe'],
  profissional:['Tudo do Essencial','Até 30 serviços e importação da lista de pacientes','Modelos de proposta com a sua marca','2 horas de treinamento · 30 dias de ajuste fino da IA'],
  premium:['Tudo do Profissional','Várias profissionais, salas e unidades','Roteiros de pós-atendimento e campanha de reativação','Acompanhamento semanal no 1º mês'],
};
const money0 = v => 'R$ ' + Number(v).toLocaleString('pt-BR');
const logo24 = (cls='', tag) => `<span class="lg24 ${cls}" role="img" aria-label="24AGÁ"><img src="mono.svg" alt=""><span class="lw"><span class="wm">24<b>AGÁ</b></span>${tag ? '<span class="tg">Atendimento inteligente</span>' : ''}</span></span>`;

function pitchView() {
  const nk = S.niche; const n = NICHES[nk];
  const svcs = S.services.slice(0, 4).map(s => s.name);
  const sol = [
    ['spark','Atendente virtual com IA','Responde na hora, de dia, de noite e no fim de semana, com os textos que a clínica aprovou.','assistente'],
    ['cal','Agenda sem conflito','Uma agenda para a equipe e para a IA. A IA só oferece horários que estão livres de verdade.','agenda'],
    ['users','Funil de pacientes','Cada contato tem etapa, histórico e próximo passo. Ninguém fica sem resposta.','pacientes'],
    ['bell','Aprovação no celular','A IA reserva; a dona da clínica aprova, sugere outro horário ou recusa com um toque.','visao'],
    ['chat','Passa para a equipe','Assunto de saúde, reclamação ou dúvida difícil vai direto para uma pessoa, com prioridade.','atendimento'],
    ['doc','Propostas com a sua marca','Depois da avaliação, a profissional monta a proposta e imprime em A4 ou PDF.','propostas'],
    ['bolt','Lembretes automáticos','Confirmação, lembrete de véspera e retorno de proposta, sem ninguém precisar lembrar.','automacoes'],
    ['chart','Relatório do mês','Quantos contatos chegaram, quantos agendaram e quanto entrou de proposta.','relatorios'],
  ];
  return `
  <div class="pitch p24">
    <header class="p-top"><div class="wrap">
      <button class="lg-btn" data-a="scrollTo" data-t="topo" aria-label="Início">${logo24('', true)}</button>
      <nav><a href="#como" data-a="scrollTo" data-t="como">Como funciona</a><a href="#nichos" data-a="scrollTo" data-t="nichos">Para quem</a><a href="#planos" data-a="scrollTo" data-t="planos">Planos</a><a href="#duvidas" data-a="scrollTo" data-t="duvidas">Dúvidas</a></nav>
      <button class="btn primary sm" data-a="go" data-r="visao">Ver demonstração ${ic('arrow')}</button>
    </div></header>

    <section class="hero" id="topo"><div class="wrap hero-grid">
      <div>
        <span class="eyebrow" style="color:var(--gold-l)">Atendimento inteligente · Seu negócio nunca para</span>
        <h1 style="margin-top:12px">Sua clínica atende <span class="hl">24 horas</span>. <em>Você só aprova.</em></h1>
        <p class="sub">A 24AGÁ responde o WhatsApp na hora, tira dúvidas, oferece horários livres, organiza cada paciente no funil e avisa você no celular. A decisão continua sendo sua.</p>
        <div class="ctas">
          <button class="btn primary caps" data-a="go" data-r="assistente">${ic('play')} Testar a IA agora</button>
          <button class="btn caps" data-a="scrollTo" data-t="planos">Ver planos e valores</button>
        </div>
        <div class="seal">${ic('shield')} WhatsApp oficial da Meta · dados no Brasil · você aprova cada agendamento</div>
      </div>
      <div class="hero-phone" aria-hidden="true">
        <div class="phone"><div class="ph-h">${esc(n.clinic.toUpperCase())} · ASSISTENTE 24AGÁ</div><div class="ph-b">
          <div class="bb in">${esc(n.sim.q)}</div>
          <div class="bb out">Olá! Posso explicar de maneira geral e ver horários livres para você.</div>
          <div class="bb out">Tenho estes horários:</div>
          <div class="slot"><span>ter 09:00</span><span>qui 10:30</span></div>
          <div class="bb in">Terça às 9h, por favor.</div>
          <div class="bb out">Reservado! ${esc(n.dr.short)} confirma e eu te aviso por aqui.</div>
        </div></div>
        <div class="push float"><img src="mono.svg" alt=""><div><b>24AGÁ · agora</b><p>Novo pedido: Mariana Oliveira · terça 09:00. Origem: anúncio.</p><div class="acts"><span class="y">Aprovar</span><span>Outro horário</span></div></div></div>
      </div>
    </div></section>

    <section class="stats24"><div class="wrap">
      ${[['24h','por dia, 7 dias por semana'],['segundos','para responder cada contato'],['1 toque','para aprovar um horário'],['até 80%','mais barato que uma recepcionista']].map(([v,l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}
    </div></section>

    <section class="band light" id="desafio"><div class="wrap">
      <span class="eyebrow">O problema</span>
      <h2>O paciente chama às 22h. Quem responde primeiro, agenda.</h2>
      <p class="lead">O tráfego chega, mas a mensagem fica sem resposta até o dia seguinte. Nesse tempo, o paciente já marcou em outro lugar.</p>
      <div class="hyp">
        ${['Mensagens chegando à noite e no fim de semana','As mesmas perguntas de preço e horário o dia todo','Recepção sobrecarregada e paciente esperando','Quem pediu informação e não agendou fica esquecido','Faltas por falta de lembrete','Nenhum número claro de quantos contatos viraram consulta']
          .map(t => `<div>${ic('clock')}<span>${t}</span></div>`).join('')}
      </div>
    </div></section>

    <section class="band" id="como"><div class="wrap">
      <span class="eyebrow">Como funciona</span>
      <h2>O tráfego chega, a 24AGÁ cuida. Você só aprova.</h2>
      <div class="flow">
        <div><div class="n">1</div><h4>Paciente chama</h4><p>Pelo anúncio, Instagram, Google ou indicação, a qualquer hora.</p><span class="who">24AGÁ</span></div>
        <div><div class="n">2</div><h4>IA atende</h4><p>Acolhe, explica em linhas gerais com textos aprovados pela clínica e entende o que a pessoa procura.</p><span class="who">24AGÁ</span></div>
        <div><div class="n">3</div><h4>Oferece horários</h4><p>Lê a agenda real e oferece 2 ou 3 horários livres. Reserva o escolhido sem conflito.</p><span class="who">24AGÁ</span></div>
        <div><div class="n">4</div><h4>Você aprova</h4><p>Chega uma notificação no celular. Aprova, sugere outro horário ou recusa com um toque.</p><span class="who you">Você decide</span></div>
        <div><div class="n">5</div><h4>Tudo organizado</h4><p>Confirma para o paciente, move no funil, agenda os lembretes e atualiza o painel.</p><span class="who">24AGÁ</span></div>
      </div>
      <div class="note dark-note">Assuntos de saúde, reações, fotos, doses e diagnósticos <b>nunca</b> são respondidos pela IA: ela passa na hora para a equipe, com prioridade. A 24AGÁ organiza e encaminha; a conduta é sempre do profissional.</div>
      <div class="row" style="margin-top:18px"><button class="btn primary" data-a="go" data-r="assistente">${ic('play')} Ver a simulação completa</button><button class="btn ghost-l" data-a="startTour">Tour de 6 minutos</button></div>
    </div></section>

    <section class="band ivory" id="nichos"><div class="wrap">
      <span class="eyebrow">Para quem é</span>
      <h2>Feita para clínicas e consultórios.</h2>
      <p class="lead">Escolha o seu ramo: a demonstração inteira muda para uma clínica de exemplo do seu segmento.</p>
      <div class="niches">${NICHE_KEYS.map(k => { const x = NICHES[k]; return `<button class="ncard ${k === nk ? 'on' : ''}" data-a="pickNiche" data-k="${k}" aria-pressed="${k === nk}">
          <span class="ni">${ic(x.icon)}</span><b>${esc(x.label)}</b><small>${esc(x.services.slice(0,4).map(s => s[0].replace(' (Botox)','')).join(' · '))}</small>
          <span class="go">${k === nk ? 'Selecionado' : 'Ver este nicho'}</span></button>`; }).join('')}</div>
      <div class="nshow">
        <div><span class="eyebrow">Exemplo: ${esc(n.clinic)}</span><h3>${esc(n.slogan)}</h3>
          <p class="muted">A IA conhece os serviços da clínica (${esc(svcs.join(', '))} e outros), responde dentro das regras e agenda com ${esc(n.dr.short)}.</p>
          <div class="row" style="margin-top:14px"><button class="btn primary" data-a="go" data-r="visao">Abrir a demonstração de ${esc(n.short)}</button><button class="btn" data-a="go" data-r="assistente">Conversar com a IA</button></div></div>
        <div class="mini-chat">${n.incoming.slice(0,3).map(([q]) => `<div class="bb in">${esc(q)}</div>`).join('')}<div class="bb out">Respondo na hora, ofereço horários e chamo a equipe quando é assunto de saúde.</div></div>
      </div>
    </div></section>

    <section class="band light" id="solucao"><div class="wrap">
      <span class="eyebrow">Tudo em um lugar</span>
      <h2>Atendimento, agenda, funil e propostas na mesma plataforma.</h2>
      <p class="lead">Toque em um cartão para ver a tela na demonstração.</p>
      <div class="sol">${sol.map(([i,t,d,r]) => `<button data-a="go" data-r="${r}">${ic(i)}<h4>${t}</h4><p>${d}</p><span class="go">Ver na demonstração ${ic('arrow')}</span></button>`).join('')}</div>
    </div></section>

    <section class="band light" id="planos"><div class="wrap">
      <span class="eyebrow">Planos e valores</span>
      <h2>Implantação uma vez. Mensalidade fixa.</h2>
      <p class="lead">A implantação cobre configurar o WhatsApp, cadastrar os serviços e treinar a IA com o jeito da sua clínica. A mensalidade cobre a plataforma rodando, a IA, os lembretes e o suporte.</p>
      <div class="pricing">${PLANS24.map(p => `<div class="price ${p.top ? 'top' : ''}">${p.top ? '<span class="ribbon">Mais escolhido</span>' : ''}
        <h4>${p.name}</h4><p class="who">${p.who}</p>
        <div class="pv"><b>${money0(p.price)}</b><span>/mês</span></div>
        <div class="impl">+ implantação de <b>${money0(p.impl)}</b> (uma vez)</div>
        <ul>${p.feats.map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}</ul>
        <details><summary>O que a implantação inclui</summary><ul>${IMPL24[p.k].map(f => `<li>${ic('check')}<span>${f}</span></li>`).join('')}</ul></details>
        <button class="btn ${p.top ? 'primary' : ''} wide" data-a="choosePlan" data-k="${p.k}">Quero o ${p.name}</button></div>`).join('')}</div>
      <div class="pnotes">
        <div>${ic('check')}<span><b>Incluído na mensalidade:</b> IA, servidor, banco de dados no Brasil, lembretes de consulta, notificações, suporte e atualizações.</span></div>
        <div>${ic('wallet')}<span><b>Pago direto à Meta, só se usar:</b> mensagens de campanha em massa (cerca de R$ 0,35 cada). Responder quem chamou primeiro não tem custo na Meta.</span></div>
        <div>${ic('cal')}<span>Conversa extra além do limite: R$ 0,50. Pagamento anual: 2 meses grátis. Contrato mínimo de 6 meses.</span></div>
      </div>
      <div class="row" style="margin-top:18px"><a class="btn" href="proposta-24aga.pdf" target="_blank" rel="noopener">${ic('doc')} Baixar a proposta em PDF</a></div>
    </div></section>

    <section class="band" id="comparar"><div class="wrap">
      <span class="eyebrow">Faça a conta</span>
      <h2>Recepcionista ou 24AGÁ?</h2>
      <div class="cmp-wrap"><table class="cmp"><thead><tr><th></th><th>Recepcionista</th><th class="us">24AGÁ Profissional</th></tr></thead><tbody>
        ${[['Custo mensal','R$ 3.000 a R$ 4.000 com encargos','R$ 697'],['Horário','Horário comercial','24 horas, 7 dias'],['Tempo de resposta','Quando consegue','Segundos'],['Férias, faltas, atestado','Sim','Não'],['Atende várias conversas ao mesmo tempo','Uma por vez','Todas'],['Esquece de retornar','Acontece','Funil e lembretes automáticos'],['Relatório do mês','Manual','Automático']]
          .map(([a,b,c]) => `<tr><td>${a}</td><td>${b}</td><td class="us">${c}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted-b">A 24AGÁ não substitui a sua equipe: faz o atendimento inicial e a organização, para que as pessoas cuidem do que precisa de gente.</p>
    </div></section>

    <section class="band light" id="seguranca"><div class="wrap">
      <span class="eyebrow">Segurança e LGPD</span>
      <h2>Dados de saúde tratados com o cuidado que exigem.</h2>
      <div class="hyp">${['Cada clínica com os dados separados e acesso só com login','Servidores com dados no Brasil e cópia de segurança diária','WhatsApp oficial da Meta: sem risco de bloqueio por ferramenta pirata','A IA não recebe informações clínicas e não dá diagnóstico','Contrato com cláusula de proteção de dados (LGPD)','Textos da IA sem promessa de resultado, dentro das regras dos conselhos'].map(t => `<div>${ic('shield')}<span>${t}</span></div>`).join('')}</div>
    </div></section>

    <section class="band" id="duvidas"><div class="wrap narrow">
      <span class="eyebrow">Dúvidas frequentes</span>
      <h2>Perguntas que toda clínica faz.</h2>
      <div class="faq">${[
        ['A IA pode falar algo errado para o paciente?','Ela só usa os textos que a clínica aprovou e segue regras fixas: não dá diagnóstico, não indica tratamento e não promete resultado. Todo agendamento passa pela sua aprovação, e qualquer assunto de saúde vai direto para a equipe.'],
        ['Preciso trocar meu número de WhatsApp?','Não. Conectamos o número da clínica à API oficial da Meta na implantação. Seus pacientes continuam falando com o mesmo número.'],
        ['E se o paciente quiser falar com uma pessoa?','A conversa passa para a equipe na hora, com todo o histórico. Fora do horário, a IA avisa quando a equipe retorna.'],
        ['Quanto tempo leva para começar?','Depois da assinatura, a implantação leva de 7 a 15 dias: conexão do WhatsApp, cadastro dos serviços, treinamento da IA e da equipe.'],
        ['Funciona no celular?','Sim. Agenda, aprovações e conversas funcionam no celular e no computador, sem precisar baixar nada na loja.'],
        ['Tem fidelidade?','O contrato mínimo é de 6 meses. Depois disso, você pode cancelar quando quiser.'],
      ].map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
    </div></section>

    <section class="band close" id="contato"><div class="wrap">
      ${logo24('big', true)}
      <h2>Seu negócio nunca para.</h2>
      <p class="lead" style="margin:0 auto">Deixe seus dados: a equipe ROITY Academy chama você no WhatsApp para mostrar a 24AGÁ com os serviços da sua clínica.</p>
      <form class="lead-form" data-f="lead">
        <div class="grid2"><div class="field"><label for="ld-n">Seu nome</label><input class="input" id="ld-n" required autocomplete="name"></div>
        <div class="field"><label for="ld-c">Nome da clínica ou consultório</label><input class="input" id="ld-c" required></div></div>
        <div class="grid2"><div class="field"><label for="ld-w">WhatsApp</label><input class="input" id="ld-w" required inputmode="tel" autocomplete="tel" placeholder="(65) 99999-9999"></div>
        <div class="field"><label for="ld-ci">Cidade</label><input class="input" id="ld-ci" autocomplete="address-level2"></div></div>
        <div class="grid2"><div class="field"><label for="ld-s">Segmento</label><select class="input" id="ld-s">${NICHE_KEYS.map(k => `<option value="${k}" ${k===nk?'selected':''}>${esc(NICHES[k].label)}</option>`).join('')}</select></div>
        <div class="field"><label for="ld-p">Plano de interesse</label><select class="input" id="ld-p">${PLANS24.map(p => `<option value="${p.k}" ${UI.plan===p.k?'selected':''}>${p.name} · ${money0(p.price)}/mês</option>`).join('')}<option value="indefinido">Ainda não sei</option></select></div></div>
        <label class="consent"><input type="checkbox" id="ld-ok" required> Autorizo a ROITY Academy a me chamar no WhatsApp sobre a 24AGÁ.</label>
        <button class="btn primary caps wide">Quero a 24AGÁ na minha clínica</button>
        <p class="muted-b xs" id="ld-msg" aria-live="polite"></p>
      </form>
    </div></section>
    <footer class="p-foot"><div class="wrap ft">
      <div>${logo24('sm', true)}<p>24AGÁ · Seu negócio nunca para. Uma plataforma da ROITY Academy. As clínicas, pessoas e conversas da demonstração são fictícias.</p></div>
      <img class="ra" src="roity-academy.png" alt="ROITY Academy">
    </div></footer>
  </div>`;
}

function nextStepsModal() {
  openModal(`${mHead('Como contratar','Nenhum pagamento é feito por aqui.')}
  <div class="mb"><div class="timeline-v">
    ${[['Conversa de 20 minutos','Entendemos a rotina da clínica e mostramos a 24AGÁ com os seus serviços.'],['Escolha do plano','Essencial, Profissional ou Premium, com contrato e política de privacidade (LGPD).'],['Implantação (7 a 15 dias)','Conexão do WhatsApp oficial, cadastro de serviços, treinamento da IA e da equipe.'],['A 24AGÁ começa a atender','Você acompanha tudo pelo painel e aprova os horários no celular.']]
      .map(([t,d])=>`<div><b>${t}</b><small>${d}</small></div>`).join('')}
  </div></div>
  <div class="mf"><button class="btn" data-a="closeModal">Fechar</button><button class="btn primary" data-a="scrollTo" data-t="contato">Falar com a equipe</button></div>`);
}

/* ================= SHELL DA DEMONSTRAÇÃO ================= */
function loginView() {
  return `<div class="login">
    <div class="l">${logo24('big', true)}<span class="demo-badge">Modo demonstração</span>
      <p style="color:var(--band-muted);max-width:36ch">Seu negócio nunca para. Escolha o segmento e um perfil para entrar.</p>
      <div class="nchips">${NICHE_KEYS.map(k => `<button class="${k===S.niche?'on':''}" data-a="pickNiche" data-k="${k}" data-stay="1">${esc(NICHES[k].short)}</button>`).join('')}</div>
      <button class="btn sm" style="background:transparent;color:var(--band-fg);border-color:var(--band-line)" data-a="go" data-r="pitch">${ic('back')} Voltar ao site</button></div>
    <div class="r">
      <div><span class="eyebrow">${esc(S.settings.clinic)} · clínica de exemplo</span><h2 style="font-size:32px;margin-top:6px">Escolha um perfil</h2><p class="muted small" style="margin-top:6px">Sem senha: perfis de exemplo. Na versão real, login e permissões são verificados no servidor.</p></div>
      ${Object.entries(PROFILES).map(([k,p]) => `<button class="pcard" data-a="login" data-p="${k}"><div class="avatar">${k==='plataforma'?ic('building'):esc(p.label.replace(/^(Dra?\.)\s*/,'').slice(0,2))}</div><div class="grow"><b>${esc(p.label)}</b><span>${esc(p.desc)}</span></div>${ic('arrow')}</button>`).join('')}
    </div></div>`;
}

function shell(content) {
  const routes = prof().routes;
  const unread = S.notifications.filter(n => !n.read).length;
  const pend = pendingApprovals().length;
  const waiting = S.conversations.filter(c => c.state === 'aguardando').length;
  const badge = r => r === 'visao' && pend && UI.profile !== 'profissional' ? `<span class="badge">${pend}</span>` : r === 'atendimento' && waiting ? `<span class="badge">${waiting}</span>` : '';
  let lastG = '';
  const sideItems = routes.map(r => { const R = ROUTES[r]; const g = R.g !== lastG ? `<div class="grp">${R.g}</div>` : ''; lastG = R.g;
    return g + `<button class="${UI.route === r ? 'on' : ''}" data-a="go" data-r="${r}">${ic(R.i)}<span>${R.t}</span>${badge(r)}</button>`; }).join('');
  const mainB = routes.slice(0, 4);
  return `<div class="app">
    <header class="topbar">
      <button class="brand" data-a="go" data-r="${routes[0]}"><img src="mono.svg" alt="24AGÁ"><div><b>${esc(UI.profile === 'plataforma' ? 'Plataforma' : S.settings.product)}</b><small>${UI.profile === 'plataforma' ? '24AGÁ · ROITY Academy' : esc(S.settings.clinic)}</small></div></button>
      <span class="demo-badge hide-m">Modo demonstração</span>
      <span class="sp"></span>
      <select class="prof-sel hide-m" data-c="niche" aria-label="Trocar segmento">${NICHE_KEYS.map(k => `<option value="${k}" ${S.niche===k?'selected':''}>${esc(NICHES[k].short)}</option>`).join('')}</select>
      <select class="prof-sel" id="prof-sel" data-c="profile" aria-label="Trocar perfil">${Object.entries(PROFILES).map(([k,p]) => `<option value="${k}" ${UI.profile===k?'selected':''}>${esc(p.label)}</option>`).join('')}</select>
      ${UI.profile !== 'plataforma' ? `<button class="tb-btn bell" data-a="drawer" aria-label="Notificações">${ic('bell')}${unread ? `<span class="cnt">${unread}</span>` : ''}</button>` : ''}
      <button class="tb-btn hide-m" data-a="startTour">${ic('play')} Tour</button>
      <button class="tb-btn" data-a="go" data-r="pitch">${ic('back')}<span class="hide-m">Voltar ao site</span></button>
    </header>
    <aside class="side">${sideItems}
      <div class="foot">Dados fictícios · salvos só neste aparelho<br><button class="btn sm" style="margin-top:8px" data-a="resetDemo">${ic('redo')} Reiniciar demonstração</button></div></aside>
    <main class="main" id="main">${content}</main>
    <nav class="bnav">${mainB.map(r => `<button class="${UI.route===r?'on':''}" data-a="go" data-r="${r}">${ic(ROUTES[r].i)}<span>${ROUTES[r].t.split(' ')[0]}</span>${badge(r)}</button>`).join('')}
      ${routes.length > 4 ? `<button class="${!mainB.includes(UI.route)?'on':''}" data-a="more">${ic('menu')}<span>Mais</span></button>` : ''}</nav>
  </div>`;
}
function moreSheet() {
  const rest = prof().routes.slice(4);
  openModal(`${mHead('Mais seções')}<div class="mb more-sheet"><div class="side-list">${rest.map(r => `<button data-a="go" data-r="${r}">${ic(ROUTES[r].i)}${ROUTES[r].t}</button>`).join('')}
    <button data-a="startTour">${ic('play')}Tour guiado</button><button data-a="resetDemo">${ic('redo')}Reiniciar demonstração</button></div></div>`);
}

function drawerView() {
  if (!UI.drawer) return '';
  const tab = UI.drawerTab;
  const ns = S.notifications;
  const tasks = S.tasks;
  return `<div class="overlay" data-a="closeDrawer" style="background:rgba(5,8,16,.3)"></div><aside class="drawer" role="dialog" aria-label="Notificações">
    <div class="dh"><div class="seg"><button class="${tab==='notif'?'on':''}" data-a="dtab" data-t="notif">Notificações</button><button class="${tab==='tasks'?'on':''}" data-a="dtab" data-t="tasks">Tarefas</button></div><button class="x-btn" data-a="closeDrawer">${ic('x')}</button></div>
    <div class="db">${tab === 'notif' ? `
      <div class="row between" style="padding:10px 0"><span class="muted small">${ns.filter(n=>!n.read).length} não lidas</span><button class="btn sm" data-a="readAll">Marcar todas como lidas</button></div>
      ${ns.length ? ns.map(n => `<div class="ntf ${n.read?'':'unread'}"><span class="dotn"></span><button class="l" data-a="openNotif" data-id="${n.id}"><div>${esc(n.text)}</div><div class="muted xs">${fmtWhen(n.at)}</div></button></div>`).join('') : '<div class="empty">Nenhuma notificação.</div>'}
      <div class="note" style="margin-top:14px">No app instalado, avisos como estes podem chegar ao celular. Notificação push real depende de permissão, navegador, aparelho e configuração técnica.</div>`
    : `<form class="row" style="padding:12px 0" data-f="addTask"><input class="input grow" id="task-text" placeholder="Nova tarefa administrativa" required><select class="input" id="task-who" style="width:auto">${S.staff.map(s=>`<option value="${s.id}">${esc(s.short)}</option>`).join('')}</select><input class="input" type="date" id="task-due" style="width:auto" value="${ymd(addDays(new Date(),1))}"><button class="btn primary sm">Adicionar</button></form>
      ${tasks.map(t => `<div class="ntf"><button class="switch ${t.done?'on':''}" data-a="toggleTask" data-id="${t.id}" aria-label="Concluir"></button><div class="grow" style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(t.text)}<div class="muted xs">${esc((staffById(t.who)||{}).short||'')} · até ${fmtDate(t.due)}</div></div></div>`).join('')}`}
    </div></aside>`;
}

/* ================= TOUR GUIADO ================= */
const TOUR = [
  { r:'atendimento', t:'1. Uma pergunta chega', d:'Mensagens de pacientes caem nesta central. A assistente responde na hora e você vê tudo. Toque em “Simular mensagem recebida” para testar.', spot:'[data-a="simIncoming"]' },
  { r:'assistente', t:'2. A IA consulta horários e agenda', d:'Toque em “Iniciar simulação” e avance: a Mariana faz a primeira pergunta, a assistente lê a agenda e reserva um horário livre.', spot:'#sim-start' },
  { r:'agenda', t:'3. O compromisso aparece na agenda', d:'Pedidos da assistente e agendamentos da recepção ficam na mesma agenda, com a etiqueta IA. Sem horário duplicado.', spot:'.cal-wrap, .month, .daylist' },
  { r:'pacientes', t:'4. O histórico fica no funil', d:'Cada paciente muda de etapa sozinha conforme a jornada avança. Arraste os cartões ou use “mover para”.', spot:'.kanban' },
  { r:'propostas', t:'5. Proposta após a avaliação', d:'Você monta a proposta, escolhe o estilo e gera a folha A4 com a sua marca. A IA não decide tratamentos.', spot:'.preview-wrap, .tbl-wrap' },
  { r:'visao', t:'6. Tudo no painel do dia', d:'Os números mudam de verdade a cada ação. E na seção Licenças você vê o painel do dono da plataforma 24h.', spot:'.kpis' },
];
function tourView() {
  if (UI.tour == null) return '';
  const s = TOUR[UI.tour];
  return `<div class="tour" role="dialog" aria-label="Tour guiado"><div class="prog">${TOUR.map((_,i)=>`<i class="${i<=UI.tour?'on':''}"></i>`).join('')}</div>
    <span class="eyebrow" style="color:var(--accent)">Conheça a 24AGÁ em 6 minutos</span><h4 style="margin-top:6px">${s.t}</h4><p>${s.d}</p>
    <div class="row between"><button class="btn sm" data-a="tourEnd">Sair</button><div class="row"><button class="btn sm" data-a="tourPrev" ${UI.tour===0?'disabled':''}>Anterior</button>${UI.tour < TOUR.length-1 ? `<button class="btn sm" data-a="tourSkip">Pular</button><button class="btn primary sm" data-a="tourNext">Próximo</button>` : `<button class="btn primary sm" data-a="tourEnd">Concluir</button>`}</div></div></div>`;
}
function tourGo(i) {
  UI.tour = i;
  if (TOUR[i].r === 'propostas') UI.sel.proposal = null;
  if (TOUR[i].r === 'pacientes') { UI.sel.patient = null; UI.pac.view = 'funil'; }
  if (UI.profile === 'plataforma') UI.profile = 'admin';
  UI.mode = 'demo'; UI.route = TOUR[i].r; render(); window.scrollTo(0,0);
  setTimeout(() => { document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot')); const el = document.querySelector(TOUR[i].spot); if (el) { el.classList.add('spot'); el.scrollIntoView({ block:'center', behavior:'smooth' }); } }, 60);
}

/* ================= RENDER ================= */
function render() {
  const root = $('#app');
  if (S.settings.accent) document.documentElement.style.setProperty('--accent', S.settings.accent);
  if (S.settings.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', S.settings.theme);
  if (UI.mode === 'pitch') root.innerHTML = pitchView();
  else if (UI.mode === 'login') root.innerHTML = loginView();
  else root.innerHTML = shell(VIEWS[UI.route] ? VIEWS[UI.route]() : '') + drawerView() + tourView();
  renderModal();
  if (UI.mode === 'demo' && AFTER[UI.route]) AFTER[UI.route]();
}

/* ---------- Ações globais ---------- */
const A = {
  go: t => { const r = t.dataset.r; if (r === 'pitch') return goTo('pitch'); if (UI.mode === 'pitch' && !UI.loggedOnce && r !== 'licencas') { UI.pendingRoute = r; UI.mode = 'login'; render(); window.scrollTo(0,0); return; } closeModal(); goTo(r); },
  login: t => { UI.profile = t.dataset.p; UI.loggedOnce = true; const r = UI.pendingRoute && PROFILES[UI.profile].routes.includes(UI.pendingRoute) ? UI.pendingRoute : PROFILES[UI.profile].routes[0]; UI.pendingRoute = null; goTo(r); },
  scrollTo: t => { const id = t.dataset.t; if (UI.mode !== 'pitch') { UI.mode = 'pitch'; render(); } const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth' }); },
  toggleDetail: () => { UI.detail = !UI.detail; const y = scrollY; render(); scrollTo(0, y); },
  nextSteps: () => nextStepsModal(),
  pickNiche: t => { const k = t.dataset.k; if (k === S.niche) return; setNiche(k); UI.sel = { conv:null, patient:null, proposal:null }; const y = scrollY; render(); if (UI.mode === 'pitch') scrollTo(0, y); toast('Segmento: ' + NICHES[k].label); },
  choosePlan: t => { UI.plan = t.dataset.k; const sel = $('#ld-p'); if (sel) sel.value = t.dataset.k; const el = document.getElementById('contato'); if (el) el.scrollIntoView({ behavior:'smooth' }); },
  openSampleProposal: () => { UI.loggedOnce = true; UI.profile = 'admin'; const pr = S.proposals.find(p => p.pid === 'p3') || S.proposals[0]; goTo('propostas', pr.id); },
  overlay: (t, e) => { if (e.target === t) closeModal(); },
  closeModal: () => closeModal(),
  more: () => moreSheet(),
  drawer: () => { UI.drawer = true; render(); },
  closeDrawer: () => { UI.drawer = null; render(); },
  dtab: t => { UI.drawerTab = t.dataset.t; render(); },
  readAll: () => { S.notifications.forEach(n => n.read = true); commit(); },
  openNotif: t => { const n = S.notifications.find(x => x.id === t.dataset.id); if (!n) return; n.read = true; saveState(); UI.drawer = null; if (n.go) goTo(n.go[0], n.go[1]); else render(); },
  toggleTask: t => { const k = S.tasks.find(x => x.id === t.dataset.id); k.done = !k.done; commit(k.done ? 'Tarefa concluída' : ''); },
  resetDemo: () => openModal(`${mHead('Reiniciar demonstração?')}<div class="mb"><p>Todos os dados de exemplo voltam ao estado inicial neste aparelho. Agendamentos, propostas e conversas criados durante a demonstração serão apagados.</p></div><div class="mf"><button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="confirmReset">Reiniciar</button></div>`),
  confirmReset: () => { resetState(); UI.sel = { conv:null, patient:null, proposal:null }; closeModal(); render(); toast('Demonstração reiniciada'); },
  startTour: () => { closeModal(); if (!UI.loggedOnce) { UI.loggedOnce = true; UI.profile = 'admin'; } tourGo(0); },
  tourNext: () => tourGo(Math.min(TOUR.length-1, UI.tour+1)),
  tourPrev: () => tourGo(Math.max(0, UI.tour-1)),
  tourSkip: () => tourGo(TOUR.length-1),
  tourEnd: () => { UI.tour = null; document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot')); render(); },
};
const C = {
  niche: t => { setNiche(t.value); UI.sel = { conv:null, patient:null, proposal:null }; toast('Segmento: ' + NICHES[t.value].label); goTo(prof().routes.includes(UI.route) ? UI.route : prof().routes[0]); },
  profile: t => { UI.profile = t.value; UI.sel = { conv:null, patient:null, proposal:null }; const r = prof().routes.includes(UI.route) ? UI.route : prof().routes[0]; toast('Perfil: ' + prof().label); goTo(r); },
};
const F = {
  lead: async f => {
    const msg = $('#ld-msg'); const btn = f.querySelector('button'); const v = id => ($(id) || {}).value || '';
    const lead = { name:v('#ld-n').trim(), clinic:v('#ld-c').trim(), whatsapp:v('#ld-w').trim(), city:v('#ld-ci').trim(), niche:v('#ld-s'), plan:v('#ld-p'), consent:!!($('#ld-ok')||{}).checked, source:'site-24h' };
    if (!lead.name || !lead.clinic || lead.whatsapp.replace(/\D/g,'').length < 10) { msg.textContent = 'Preencha nome, clínica e um WhatsApp com DDD.'; return; }
    btn.disabled = true; msg.textContent = 'Enviando…';
    const r = await saveLead(lead);
    btn.disabled = false;
    if (r.ok && r.viaWhats) { window.open(`https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(`Olá! Sou ${lead.name}, da ${lead.clinic} (${lead.city || 'cidade não informada'}). Quero conhecer a 24AGÁ, plano ${lead.plan}.`)}`, '_blank', 'noopener'); msg.textContent = 'Abrindo o WhatsApp da equipe ROITY Academy…'; }
    else if (r.ok) { f.reset(); msg.innerHTML = 'Recebido! A equipe ROITY Academy vai chamar você no WhatsApp.' + (CFG.WHATSAPP ? ` <a href="https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent('Olá! Quero conhecer a 24AGÁ para a ' + lead.clinic + '.')}" target="_blank" rel="noopener">Ou fale agora pelo WhatsApp.</a>` : ''); }
    else if (r.notConfigured) msg.textContent = 'Demonstração: o envio de verdade é ligado quando o banco de dados da 24AGÁ estiver configurado.';
    else msg.textContent = 'Não foi possível enviar agora. Tente de novo em instantes.';
  },
  addTask: () => { const text = $('#task-text').value.trim(); if (!text) return; S.tasks.unshift({ id:uid('t'), text, who:$('#task-who').value, due:$('#task-due').value || ymd(new Date()), done:false }); commit('Tarefa criada'); },
};
const VIEWS = {}; const AFTER = {};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  const fn = A[t.dataset.a]; if (!fn) return;
  if (t.tagName === 'A') e.preventDefault();
  fn(t, e);
});
document.addEventListener('change', e => { const t = e.target.closest('[data-c]'); if (t && C[t.dataset.c]) C[t.dataset.c](t, e); });
document.addEventListener('input', e => { const t = e.target.closest('[data-i]'); if (t && I[t.dataset.i]) I[t.dataset.i](t, e); });
document.addEventListener('submit', e => { const f = e.target.closest('[data-f]'); if (f) { e.preventDefault(); if (F[f.dataset.f]) F[f.dataset.f](f, e); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (UI.modal) closeModal(); else if (UI.drawer) { UI.drawer = null; render(); } } });
const I = {};

function boot() {
  const h = (location.hash || '').replace('#', '');
  const m = HASH_TO[h];
  if (m) {
    if (m[0] === 'demo') { UI.loggedOnce = true; if (m[1] === 'licencas') UI.profile = 'plataforma'; UI.mode = 'demo'; UI.route = m[1]; }
    render();
    if (m[0] === 'pitch' && m[1]) setTimeout(() => { const el = document.getElementById(m[1]); if (el) el.scrollIntoView(); }, 50);
  } else render();
}
