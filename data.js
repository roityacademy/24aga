/* 24AGÁ — modelo de dados compartilhado (tudo fictício) */
const pad2 = n => String(n).padStart(2, '0');
const sod = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const ymd = d => { const x = new Date(d); return x.getFullYear() + '-' + pad2(x.getMonth()+1) + '-' + pad2(x.getDate()); };
const parseYmd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const mondayOf = d => { const x = sod(d); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
const hm = m => pad2(Math.floor(m/60)) + ':' + pad2(m%60);
const DOW = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const DOW3 = ['dom','seg','ter','qua','qui','sex','sáb'];
const MON = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const fmtDate = s => { const d = parseYmd(s); return pad2(d.getDate()) + '/' + pad2(d.getMonth()+1); };
const fmtDateLong = s => { const d = parseYmd(s); return DOW[d.getDay()] + ', ' + d.getDate() + ' de ' + MON[d.getMonth()]; };
const brl = v => (Number(v)||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const uid = (p='id') => p + Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();
const fmtTime = iso => { const d = new Date(iso); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const fmtWhen = iso => { const d = new Date(iso); const t = sod(new Date()); const diff = Math.round((sod(d) - t)/864e5); const h = fmtTime(iso); if (diff === 0) return 'hoje ' + h; if (diff === -1) return 'ontem ' + h; return pad2(d.getDate()) + '/' + pad2(d.getMonth()+1) + ' ' + h; };

const STAGES = ['Novo contato','IA em atendimento','Aguardando humano','Interessada em avaliação','Agendada','Compareceu','Proposta enviada','Em decisão','Tratamento contratado','Acompanhamento','Perdida/sem interesse'];
const TAGS = ['primeira consulta','retorno','proposta pendente','agendamento solicitado','agendamento confirmado','prioridade de retorno','cliente recorrente'];
const APPT_STATUS = ['solicitado','reservado','confirmado','compareceu','concluido','cancelado','falta'];
const STATUS_LABEL = { solicitado:'Solicitado', reservado:'Reservado', confirmado:'Confirmado', compareceu:'Compareceu', concluido:'Concluído', cancelado:'Cancelado', falta:'Falta', bloqueio:'Bloqueio' };
const TYPES = { avaliacao:'Consulta de avaliação', sessao:'Sessão de procedimento', retorno:'Retorno', bloqueio:'Bloqueio pessoal', encaixe:'Encaixe' };
const PROP_STATUS = ['rascunho','pronta para revisão','entregue','aguardando retorno','aceita','não aceita','expirada'];
const ORIGINS = ['Instagram','Anúncio Meta (tráfego pago)','Google','Indicação','WhatsApp direto','Site'];

function seed(nk) {
  nk = nk || currentNiche();
  const today = sod(new Date());
  const mon = mondayOf(today);
  const D = o => ymd(addDays(mon, o));
  const iso = (o, h=10) => { const x = addDays(mon, o); x.setHours(h, 0, 0, 0); return x.toISOString(); };

  const NK = NICHES[nk] ? nk : 'estetica'; const Nn = NICHES[NK];
  const services = Nn.services.map(([name, cat, dur, kw, ref, ai], i) => ({ id:SLOT_IDS[i], name, cat, dur, gap:10, price:'', ref, kw,
    prof: i === 4 ? ['grazi'] : ['grazi','paula'], active:true,
    desc: ai || Nn.sig.concept, ai: ai || (Nn.sig.name + ': ' + Nn.sig.concept + ' Começa sempre por uma avaliação individual.'),
    guide:'Orientações gerais serão entregues pela profissional após a avaliação.' }));

  const staff = [
    { id:'grazi', name:Nn.dr.name, role:Nn.dr.role, short:Nn.dr.short, title:Nn.dr.title, reg:'' },
    { id:'camila', name:'Camila Rocha', role:'Recepcionista (fictícia)', short:'Camila' },
    { id:'paula', name:Nn.pro.name, role:Nn.pro.role, short:Nn.pro.short, title:Nn.pro.title, reg:'' },
  ];

  const names = [
    ['Ana Beatriz Lima','Instagram'],['Juliana Costa','Indicação'],['Fernanda Souza','Anúncio Meta (tráfego pago)'],['Patrícia Almeida','Google'],
    ['Larissa Mendes','Instagram'],['Camila Ferreira','Anúncio Meta (tráfego pago)'],['Renata Barros','Indicação'],['Bruna Carvalho','WhatsApp direto'],
    ['Gabriela Nunes','Instagram'],['Vanessa Rocha','Site'],['Aline Teixeira','Anúncio Meta (tráfego pago)'],['Tatiane Martins','Indicação'],
    ['Daniela Pires','Instagram'],['Priscila Araújo','Google'],['Carolina Duarte','Anúncio Meta (tráfego pago)'],['Letícia Ramos','Instagram'],
    ['Natália Freitas','Indicação'],['Isabela Moraes','Anúncio Meta (tráfego pago)'],['Marcela Vieira','Site'],['Amanda Ribeiro','Instagram'],
    ['Simone Cardoso','WhatsApp direto'],['Débora Castro','Anúncio Meta (tráfego pago)'],['Raquel Monteiro','Google'],['Luana Azevedo','Instagram'],
  ];
  const stageOf = ['Compareceu','Tratamento contratado','Proposta enviada','Acompanhamento','Em decisão','Agendada','Tratamento contratado','Agendada',
    'Agendada','Compareceu','Proposta enviada','Agendada','Agendada','Agendada','Agendada','Agendada',
    'Agendada','Agendada','Agendada','Interessada em avaliação','Agendada','Agendada','Novo contato','IA em atendimento'];
  const interests = [['botox'],['bioest','profhilo'],['lumini'],['botox'],['labial'],['preench'],['lumini','bioest'],['micro'],['rino'],['lavieen'],['botox','preench'],['labial'],
    ['botox'],['profhilo'],['preench'],['micro'],['botox'],['labial'],['lumini'],['botox'],['bioest'],['botox'],['rino'],['labial']];
  const prefs = ['manhã','tarde','tarde','manhã','qualquer','manhã','tarde','noite (após 17h)','manhã','tarde','qualquer','manhã'];
  const patients = names.map(([name, origin], i) => {
    const created = iso(-(i % 9) - 2 - Math.floor(i/3), 9 + (i%8));
    const tags = [];
    if (['Novo contato','IA em atendimento','Interessada em avaliação','Agendada'].includes(stageOf[i])) tags.push('primeira consulta');
    if (['Proposta enviada','Em decisão'].includes(stageOf[i])) tags.push('proposta pendente');
    if (['Tratamento contratado','Acompanhamento'].includes(stageOf[i])) tags.push('cliente recorrente');
    return {
      id:'p'+(i+1), name, phone:'(65) 9' + (8100 + i*37) + '-' + String(1000 + i*211).slice(-4), email: i%3===0 ? name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') + '@exemplo.com' : '',
      origin, stage: stageOf[i], interests: interests[i], tags, pref: prefs[i%prefs.length], comm: i%4===0 ? 'Ligação' : 'WhatsApp',
      created, last: created, notes:'', payments:[],
      history:[{ at:created, text:'Primeiro contato via ' + origin }],
    };
  });
  patients[1].payments.push({ at: iso(-6, 15), value: 0, desc:'Registro manual (exemplo sem valor)', method:'—' });

  // Agendamentos: [dia relativo à segunda desta semana, início, paciente, tipo, serviço, profissional, sala, origem]
  const A = [
    [0,540,'p1','avaliacao','botox','grazi','s1','ia'],[0,600,'p2','sessao','bioest','grazi','s1','manual'],[0,840,'p3','avaliacao','lumini','paula','s2','manual'],[0,960,'p4','retorno','botox','grazi','s1','manual'],
    [1,570,'p5','sessao','labial','grazi','s1','manual'],[1,660,'p6','avaliacao','preench','grazi','s1','ia'],[1,900,'p7','sessao','lumini','grazi','s1','manual'],
    [2,540,'p8','sessao','micro','paula','s2','manual'],[2,630,'p9','avaliacao','rino','grazi','s1','ia'],[2,840,'p10','sessao','lavieen','paula','s2','manual'],[2,1020,null,'bloqueio',null,'grazi','s1','manual'],
    [3,540,'p11','avaliacao','botox','grazi','s1','manual'],[3,660,'p24','avaliacao','labial','grazi','s1','ia'],[3,810,'p12','sessao','labial','paula','s2','manual'],[3,960,'p13','avaliacao','botox','grazi','s1','ia'],
    [4,600,'p14','avaliacao','profhilo','grazi','s1','manual'],[4,660,'p15','avaliacao','preench','grazi','s1','ia'],[4,900,'p16','sessao','micro','paula','s2','manual'],
    [5,540,'p17','avaliacao','botox','grazi','s1','ia'],[5,600,'p18','avaliacao','labial','grazi','s1','manual'],
    [7,540,'p19','avaliacao','lumini','grazi','s1','manual'],[7,840,'p4','retorno','botox','grazi','s1','manual'],
    [8,600,'p21','sessao','bioest','grazi','s1','manual'],[8,900,'p22','avaliacao','botox','grazi','s1','ia'],
    [9,960,'p13','avaliacao','botox','paula','s2','ia'],[10,630,'p20','avaliacao','botox','grazi','s1','ia'],
  ];
  const svcDur = id => (services.find(s => s.id === id) || {}).dur || 60;
  const appts = A.map(([o, start, pid, type, svc, prof, room, origin], i) => {
    const date = D(o);
    const past = parseYmd(date) < today;
    let status;
    if (type === 'bloqueio') status = 'bloqueio';
    else if (past) status = (i % 7 === 3) ? 'falta' : (type === 'avaliacao' ? 'compareceu' : 'concluido');
    else if (origin === 'ia' && o >= 7) status = (i % 2 ? 'reservado' : 'solicitado');
    else status = (i % 4 === 1) ? 'reservado' : 'confirmado';
    const dur = type === 'avaliacao' ? 40 : type === 'bloqueio' ? 60 : type === 'retorno' ? 30 : svcDur(svc);
    return { id:'a'+(i+1), pid, type, svc, prof, room, date, start, dur, status, origin,
      notes: type === 'bloqueio' ? 'Compromisso pessoal' : '',
      log:[{ at: iso(o-3, 11), by: origin === 'ia' ? 'Assistente virtual' : 'Camila (recepção)', what:'Agendamento criado' }] };
  });
  // um cancelamento de exemplo
  appts.push({ id:'a99', pid:'p23', type:'avaliacao', svc:'rino', prof:'grazi', room:'s1', date:D(4), start:960, dur:40, status:'cancelado', origin:'manual', notes:'', cancelReason:'Imprevisto de trabalho (informado pela paciente)',
    log:[{ at: iso(1, 10), by:'Camila (recepção)', what:'Agendamento criado' },{ at: iso(2, 16), by:'Camila (recepção)', what:'Cancelado — imprevisto de trabalho' }] });

  const item = (svc, qty, price, desc) => { const s = services.find(x => x.id === svc); return { svc, name: s.name, desc: desc || '', qty, price: s.ref || price }; };
  const P = (n, pid, o, status, items, discount=0, lumini=false) => ({
    id:'pr'+n, num:'PR-' + new Date().getFullYear() + '-' + String(100+n).padStart(4,'0'), pid, date:D(o), validDays:15, layout:'elegance', status, lumini,
    msg:'Foi um prazer receber você. Preparei este plano com carinho, a partir da nossa conversa e da sua avaliação.',
    objective:'Objetivo descrito pela paciente na avaliação: ' + Nn.sim.goal.toLowerCase() + '.',
    items, discount, payment:'Formas de pagamento a definir pela clínica.', notes:'Cuidados e orientações serão repassados pela profissional antes de cada etapa.',
    terms:true, prof:'grazi', fict:true, history:[{ at: iso(o, 17), text:'Proposta criada' }],
  });
  const proposals = [
    P(1,'p2',-12,'aceita',[item('bioest',2,1500),item('profhilo',1,1400)],200),
    P(2,'p3',-6,'aguardando retorno',[item('lumini',1,2900,'Planejamento em etapas')],0,true),
    P(3,'p4',-20,'aceita',[item('botox',1,1200)]),
    P(4,'p5',-5,'entregue',[item('labial',1,1500)]),
    P(5,'p7',-14,'aceita',[item('lumini',1,2900),item('bioest',1,1500)],300,true),
    P(6,'p10',-2,'pronta para revisão',[item('lavieen',3,600)]),
    P(7,'p11',-1,'aguardando retorno',[item('botox',1,1200),item('preench',1,1600)]),
    P(8,'p1',-3,'rascunho',[item('botox',1,1200)]),
    P(9,'p9',-30,'expirada',[item('rino',1,1800)]),
    P(10,'p6',-25,'não aceita',[item('preench',2,1600)]),
  ];

  const M = (from, text, o, h, mm=0) => { const x = addDays(mon, o); x.setHours(h, mm, 0, 0); return { from, text, at: x.toISOString() }; };
  const todayOff = Math.round((today - mon)/864e5);
  const conversations = [
    { id:'c1', pid:'p23', state:'aguardando', unread:1, ctx:{}, msgs:[
      M('paciente',Nn.chats.c1, todayOff, 8, 12),
      M('ia','Olá! Aqui é a assistente virtual ' + (Nn.ca || 'da') + ' ' + Nn.clinic + '. Como sua mensagem envolve sua saúde, vou passar agora para a equipe, que vai te orientar com segurança. Se houver piora, falta de ar ou dor intensa, procure um pronto atendimento imediatamente.', todayOff, 8, 12),
      M('sistema','Conversa transferida para atendimento humano · prioridade', todayOff, 8, 12) ] },
    { id:'c2', pid:'p22', state:'ia', unread:0, ctx:{}, msgs:[
      M('paciente',Nn.chats.c2, todayOff, 7, 40),
      M('ia','Olá, seja bem-vinda ao atendimento ' + (Nn.ca || 'da') + ' ' + Nn.clinic + '! Sou a assistente virtual. O valor depende do que for definido na avaliação individual, e a equipe passa os detalhes. Posso ver um horário para sua avaliação?', todayOff, 7, 40),
      M('paciente','Pode sim, de tarde', todayOff, 7, 43),
      M('ia','Perfeito! Reservei a avaliação para você. ' + Nn.dr.short + ' confirma em seguida e eu te aviso por aqui.', todayOff, 7, 44) ] },
    { id:'c3', pid:'p20', state:'ia', unread:0, ctx:{}, msgs:[
      M('paciente',Nn.chats.c3, todayOff-1, 19, 5),
      M('ia','Olá! Sim, temos ' + services[3].name.toLowerCase() + '. ' + services[3].ai + ' Quer que eu veja horários?', todayOff-1, 19, 5) ] },
    { id:'c4', pid:'p5', state:'humano', unread:0, ctx:{}, msgs:[
      M('paciente','Recebi a proposta, obrigada! Vou ver com calma e retorno.', todayOff-2, 15, 20),
      M('humano','Imagina, Larissa! Qualquer dúvida estou por aqui. — Camila', todayOff-2, 15, 31) ] },
    { id:'c5', pid:'p17', state:'resolvida', unread:0, ctx:{}, msgs:[
      M('paciente','Confirmado para sábado, obrigada!', todayOff-1, 10, 2),
      M('ia','Combinado! Até sábado. Se precisar reagendar, é só me chamar aqui.', todayOff-1, 10, 2) ] },
  ];

  const notifications = [
    { id:'n1', type:'humano', text:'Simone… não: Raquel Monteiro aguarda atendimento humano (assunto de saúde)', at: conversations[0].msgs[0].at, read:false, go:['atendimento','c1'] },
    { id:'n2', type:'pedido', text:'Novo pedido de horário pela assistente: Débora Castro', at: conversations[1].msgs[3].at, read:false, go:['visao'] },
    { id:'n3', type:'proposta', text:'Proposta ' + proposals[6].num + ' aguardando retorno da paciente', at: iso(todayOff-1, 9), read:false, go:['propostas','pr7'] },
    { id:'n4', type:'cancelado', text:'Consulta cancelada: Raquel Monteiro (imprevisto de trabalho)', at: iso(2, 16), read:true, go:['agenda'] },
    { id:'n5', type:'aprovada', text:'Proposta ' + proposals[4].num + ' aceita por Renata Barros', at: iso(-10, 18), read:true, go:['propostas','pr5'] },
  ];
  notifications[0].text = 'Raquel Monteiro aguarda atendimento humano (assunto de saúde)';

  const tasks = [
    { id:'t1', text:'Retornar Larissa Mendes sobre a proposta', who:'camila', due:D(todayOff+1), done:false },
    { id:'t2', text:'Revisar textos dos serviços usados pela assistente', who:'grazi', due:D(todayOff+3), done:false },
    { id:'t3', text:'Confirmar agenda de sábado', who:'camila', due:D(todayOff), done:true },
  ];

  const tenants = [
    { id:'gm', name:Nn.clinic, pro:Nn.dr.name, initials:Nn.clinic.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color:'#2F6BFF', bg:'#05070D', plan:'Premium', status:'ativa', users:3, mods:['Agenda','CRM','IA','Propostas','Relatórios'], integ:{ whatsapp:'pendente', ia:'pendente', agenda:'não usa' }, since:D(-40), tickets:0 },
    { id:'aurora', name:'Studio Aurora Estética', pro:'Dra. Lívia Campos (fictícia)', initials:'SA', color:'#7C8B6F', bg:'#F3F1EA', plan:'Profissional', status:'em teste', users:2, mods:['Agenda','CRM','Propostas'], integ:{ whatsapp:'não iniciada', ia:'não iniciada', agenda:'em análise' }, since:D(-6), tickets:1 },
    { id:'essenza', name:'Clínica Essenza', pro:'Dra. Renata Moura (fictícia)', initials:'CE', color:'#9C5B6B', bg:'#FBF3F4', plan:'Essencial', status:'ativa', users:1, mods:['Agenda','CRM'], integ:{ whatsapp:'não usa', ia:'não usa', agenda:'conectada (simulado)' }, since:D(-22), tickets:0 },
    { id:'belle', name:'Instituto Belle Face', pro:'Dra. Mônica Prado (fictícia)', initials:'BF', color:'#4F6D8A', bg:'#F1F4F8', plan:'Premium', status:'suspensa', users:4, mods:['Agenda','CRM','IA','Propostas'], integ:{ whatsapp:'pendente', ia:'pendente', agenda:'não usa' }, since:D(-70), tickets:2 },
  ];

  return {
    v:4, niche:NK, seededAt: ymd(today),
    settings:{
      clinic:Nn.clinic, slogan:Nn.slogan, product:'24AGÁ', phone:'', whatsapp:'', address:'', city:'Cuiabá — MT', tz:'America/Cuiaba',
      accent:'', theme:'auto',
      hours:{ 1:[540,1140], 2:[540,1140], 3:[540,1140], 4:[540,1140], 5:[540,1140], 6:[540,780], 0:null },
      lunch:[720,780], step:30, rooms:[{id:'s1',name:'Sala 1'},{id:'s2',name:'Sala 2'}], holidays:[],
      evalPrice:'', evalPolicy:'A política de consulta de avaliação é definida pela clínica.',
      payments:'', cancelPolicy:'Pedimos aviso com antecedência para reagendar ou cancelar.',
    },
    ai:{ name:'Assistente 24AGÁ · ' + Nn.clinic, on:true, approval:true, logs:true, humanStart:'08:00', humanEnd:'19:00', tone:'acolhedor',
      intro:'Olá! Seja bem-vinda ao atendimento ' + (Nn.ca || 'da') + ' ' + Nn.clinic + '. Sou a assistente virtual e posso explicar de maneira geral os nossos serviços ou ajudar a encontrar um horário.',
      approved:[
        'Olá! Seja bem-vinda ao atendimento ' + (Nn.ca || 'da') + ' ' + Nn.clinic + '.',
        'Posso explicar de maneira geral o procedimento ou ajudar a encontrar um horário para avaliação.',
        'Vou verificar os horários disponíveis para você.',
        'Para indicar o tratamento mais adequado, ' + Nn.dr.short + ' precisa fazer sua avaliação individual.',
      ], usage:{ conversations:38, tokens:'—', cost:'A definir após contratação do serviço de IA' } },
    automations:[
      { id:'au1', name:'Confirmação de novo agendamento', on:true, when:'Logo após o agendamento', text:'Olá, {nome}! Seu horário ' + (Nn.ca === 'do' ? 'no' : 'na') + ' ' + Nn.clinic + ' está registrado para {data} às {hora}. Qualquer ajuste, é só responder aqui.' },
      { id:'au2', name:'Lembrete antes da consulta', on:true, when:'24 horas antes', text:'Oi, {nome}! Passando para lembrar do seu horário amanhã, {data} às {hora}.' },
      { id:'au3', name:'Pedido de confirmação', on:true, when:'48 horas antes', text:'{nome}, você confirma seu horário de {data} às {hora}? Responda SIM para confirmar ou REAGENDAR.' },
      { id:'au4', name:'Reagendamento', on:true, when:'Quando o horário é alterado', text:'{nome}, seu horário foi alterado para {data} às {hora}.' },
      { id:'au5', name:'Acompanhamento administrativo pós-visita', on:false, when:'2 dias após a visita', text:'Oi, {nome}! Obrigada pela visita. Se tiver qualquer dúvida administrativa, estamos por aqui.' },
      { id:'au6', name:'Retorno de proposta pendente', on:true, when:'5 dias após a entrega', text:'Oi, {nome}! Ficou alguma dúvida sobre a proposta que preparamos para você?' },
      { id:'au7', name:'Convite de reavaliação', on:false, when:'Quando definido pela profissional', text:'{nome}, ' + Nn.dr.short + ' indicou uma reavaliação. Quer que eu veja um horário?' },
    ],
    lumini:{ name:Nn.sig.name, concept:Nn.sig.concept, criteria:'Agendar como consulta de avaliação com ' + Nn.dr.short + '.', show:true },
    plans:[ { name:'Essencial', price:'R$ 397/mês', feats:['IA no WhatsApp 24h (até 300 conversas)','Agenda e funil','2 usuários'] }, { name:'Profissional', price:'R$ 697/mês', feats:['Tudo do Essencial','Até 800 conversas','Propostas e lembretes','5 usuários'] }, { name:'Premium', price:'R$ 1.197/mês', feats:['Tudo do Profissional','Até 2.000 conversas','Campanhas e várias unidades','Usuários ilimitados'] } ],
    tickets:[ { id:'tk1', tenant:'aurora', text:'Dúvida sobre configuração de horários', status:'aberto' }, { id:'tk2', tenant:'belle', text:'Reativação de licença', status:'aberto' }, { id:'tk3', tenant:'belle', text:'Alteração de logo', status:'resolvido' } ],
    staff, services, patients, appts, proposals, conversations, notifications, tasks, tenants,
    audit:[], sim:{ step:0 }, propSeq: 110,
  };
}

/* Persistência local (apenas neste navegador) */
const STORE_KEY = '24h.demo.v1';
let S;
function loadState() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 4 && s.niche === currentNiche() && s.seededAt === ymd(new Date())) return s; } } catch (e) {}
  return seed();
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }
function resetState() { S = seed(); saveState(); }
function setNiche(k) { if (!NICHES[k]) return; try { localStorage.setItem(NICHE_STORE, k); } catch (e) {} S = seed(k); saveState(); }
S = loadState();

/* Consultas ao estado */
const svcById = id => S.services.find(s => s.id === id);
const patById = id => S.patients.find(p => p.id === id);
const staffById = id => S.staff.find(s => s.id === id);
const propById = id => S.proposals.find(p => p.id === id);
const convById = id => S.conversations.find(c => c.id === id);
const apptById = id => S.appts.find(a => a.id === id);
const activeAppt = a => a.status !== 'cancelado';
const apptLabel = a => a.type === 'bloqueio' ? 'Bloqueio pessoal' : a.type === 'avaliacao' ? 'Avaliação' + (a.svc ? ' · ' + (svcById(a.svc)||{}).name : '') : (svcById(a.svc)||{name:TYPES[a.type]}).name;
const propTotal = p => Math.max(0, p.items.reduce((t, i) => t + (Number(i.qty)||0) * (Number(i.price)||0), 0) - (Number(p.discount)||0));

/* Disponibilidade da agenda */
function dayWindow(dateStr) {
  const d = parseYmd(dateStr);
  if (S.settings.holidays.includes(dateStr)) return null;
  return S.settings.hours[d.getDay()] || null;
}
function conflicts(dateStr, start, dur, prof, room, ignoreId) {
  return S.appts.filter(a => a.id !== ignoreId && a.date === dateStr && activeAppt(a) && (a.prof === prof || (room && a.room === room && a.type !== 'bloqueio')) && a.start < start + dur && start < a.start + a.dur);
}
function freeSlots(dateStr, dur, prof, room, ignoreId) {
  const w = dayWindow(dateStr); if (!w) return [];
  const out = []; const step = S.settings.step; const [ls, le] = S.settings.lunch;
  const now = new Date(); const isToday = dateStr === ymd(now); const nowMin = now.getHours()*60 + now.getMinutes();
  for (let m = w[0]; m + dur <= w[1]; m += step) {
    if (m < le && ls < m + dur && parseYmd(dateStr).getDay() !== 6) continue;
    if (isToday && m <= nowMin + 30) continue;
    if (parseYmd(dateStr) < sod(now)) continue;
    if (conflicts(dateStr, m, dur, prof, room, ignoreId).length) continue;
    out.push(m);
  }
  return out;
}
