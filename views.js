/* 24AGÁ — telas da demonstração: painel, agenda, atendimento, pacientes */
const pendingApprovals = () => S.appts.filter(a => (a.status === 'reservado' || a.status === 'solicitado') && a.origin === 'ia' && parseYmd(a.date) >= sod(new Date())).sort((a,b) => (a.date+hm(a.start)).localeCompare(b.date+hm(b.start)));
const stChip = s => `<span class="chip st-${s}"><span class="dot"></span>${STATUS_LABEL[s] || s}</span>`;
const initials = n => n.split(' ').filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase();
const visibleAppts = () => UI.profile === 'profissional' ? S.appts.filter(a => a.prof === 'paula') : S.appts;
const visiblePatients = () => {
  if (UI.profile !== 'profissional') return S.patients;
  const ids = new Set(S.appts.filter(a => a.prof === 'paula').map(a => a.pid));
  S.proposals.filter(p => p.prof === 'paula').forEach(p => ids.add(p.pid));
  return S.patients.filter(p => ids.has(p.id));
};
function periodRange(period) {
  const t = sod(new Date());
  if (period === 'hoje') return [t, t];
  if (period === 'semana') { const m = mondayOf(t); return [m, addDays(m, 6)]; }
  if (period === 'mes') return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth()+1, 0)];
  return [addDays(t, -90), addDays(t, 60)];
}
const inRange = (dateStr, [a, b]) => { const d = parseYmd(dateStr); return d >= a && d <= b; };
const isoInRange = (iso, [a, b]) => { const d = sod(new Date(iso)); return d >= a && d <= b; };
function bars(rows, max) {
  const m = max || Math.max(1, ...rows.map(r => r[1]));
  return `<div class="bars">${rows.map(([l, v]) => `<div class="bar"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l)}</span><div class="tr"><div class="fl" style="width:${Math.round(v/m*100)}%"></div></div><span class="n">${v}</span></div>`).join('')}</div>`;
}
function vbars(rows, alt) {
  const m = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="vbars">${rows.map(([l, v], i) => `<div class="c"><span class="v">${v}</span><div class="b ${alt && alt(i) ? 'alt' : ''}" style="height:${Math.max(2, Math.round(v/m*120))}px"></div></div>`).join('')}</div><div class="vlabels">${rows.map(r => `<span>${esc(r[0])}</span>`).join('')}</div>`;
}

/* ================= VISÃO GERAL ================= */
function metrics(f) {
  const range = periodRange(f.period);
  let ap = visibleAppts().filter(a => a.type !== 'bloqueio');
  if (f.prof !== 'all') ap = ap.filter(a => a.prof === f.prof);
  if (f.svc !== 'all') ap = ap.filter(a => a.svc === f.svc);
  const inP = ap.filter(a => inRange(a.date, range));
  const act = inP.filter(activeAppt);
  const t = ymd(new Date());
  const props = S.proposals.filter(p => inRange(p.date, range) || f.period === 'tudo').filter(p => f.prof === 'all' || p.prof === f.prof).filter(p => f.svc === 'all' || p.items.some(i => i.svc === f.svc));
  const allProps = S.proposals.filter(p => f.prof === 'all' || p.prof === f.prof);
  const newContacts = S.patients.filter(p => isoInRange(p.created, range));
  const withAppt = new Set(S.appts.filter(a => a.pid && activeAppt(a)).map(a => a.pid));
  const delivered = allProps.filter(p => ['entregue','aguardando retorno','aceita','não aceita','expirada'].includes(p.status));
  const accepted = allProps.filter(p => p.status === 'aceita');
  const payments = S.patients.flatMap(p => p.payments).filter(x => isoInRange(x.at, range));
  return {
    range, inP, act,
    today: ap.filter(a => a.date === t && activeAppt(a)).length,
    week: ap.filter(a => inRange(a.date, periodRange('semana')) && activeAppt(a)).length,
    month: ap.filter(a => inRange(a.date, periodRange('mes')) && activeAppt(a)).length,
    total: act.length,
    confirmed: act.filter(a => a.status === 'confirmado').length,
    pending: act.filter(a => a.status === 'reservado' || a.status === 'solicitado').length,
    waiting: S.conversations.filter(c => c.state === 'aguardando').length,
    newContacts: newContacts.length,
    evals: inP.filter(a => a.type === 'avaliacao' && (a.status === 'compareceu' || a.status === 'concluido')).length,
    attended: inP.filter(a => a.status === 'compareceu' || a.status === 'concluido').length,
    noshow: inP.filter(a => a.status === 'falta').length,
    returns: ap.filter(a => a.type === 'retorno' && parseYmd(a.date) >= sod(new Date()) && activeAppt(a)).length,
    propsIssued: props.length,
    propsAccepted: props.filter(p => p.status === 'aceita').length,
    propsPending: props.filter(p => ['entregue','aguardando retorno','pronta para revisão'].includes(p.status)).length,
    revenue: payments.reduce((t, x) => t + (Number(x.value)||0), 0),
    convContact: S.patients.length ? Math.round(S.patients.filter(p => withAppt.has(p.id)).length / S.patients.length * 100) : 0,
    convProp: delivered.length ? Math.round(accepted.length / delivered.length * 100) : 0,
  };
}
VIEWS.visao = () => {
  const f = UI.dash; const m = metrics(f);
  const pend = pendingApprovals();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const who = UI.profile === 'admin' ? '' + DR() + '' : UI.profile === 'recepcao' ? 'Camila' : '' + PRO() + '';
  const todayList = visibleAppts().filter(a => a.date === ymd(new Date())).sort((a,b) => a.start - b.start);
  const days = Array.from({ length:7 }, (_, i) => addDays(sod(new Date()), i));
  const byDay = days.map(d => [DOW3[d.getDay()] + ' ' + d.getDate(), visibleAppts().filter(a => a.date === ymd(d) && activeAppt(a) && a.type !== 'bloqueio').length]);
  const origins = ORIGINS.map(o => [o.replace(' (tráfego pago)',''), S.patients.filter(p => p.origin === o).length]).sort((a,b) => b[1]-a[1]);
  const cats = S.services.map(s => [s.name.replace(' (Botox)','').replace(' — remodelador tecidual',''), S.patients.filter(p => p.interests.includes(s.id)).length]).sort((a,b) => b[1]-a[1]).slice(0, 6);
  const hours = [9,10,11,13,14,15,16,17,18].map(h => [h + 'h', m.act.filter(a => Math.floor(a.start/60) === h).length]);
  const K = (l, v, s, go, hl) => `<button class="kpi ${hl ? 'hl' : ''}" data-a="${go ? 'go' : ''}" data-r="${go || ''}"><span class="l">${l}</span><span class="v">${v}</span>${s ? `<span class="s">${s}</span>` : ''}</button>`;
  return `
  <div class="page-h"><div><span class="eyebrow">${fmtDateLong(ymd(new Date()))}</span><h1>${greet}, ${who}. Veja o que precisa da sua atenção hoje.</h1></div></div>
  <div class="filters">
    <div class="seg">${[['hoje','Hoje'],['semana','Semana'],['mes','Mês'],['tudo','Tudo']].map(([k,l]) => `<button class="${f.period===k?'on':''}" data-a="dashPeriod" data-v="${k}">${l}</button>`).join('')}</div>
    <select class="input" style="width:auto" data-c="dashProf" aria-label="Profissional"><option value="all">Todas as profissionais</option>${S.staff.filter(s=>s.id!=='camila').map(s=>`<option value="${s.id}" ${f.prof===s.id?'selected':''}>${esc(s.short)}</option>`).join('')}</select>
    <select class="input" style="width:auto" data-c="dashSvc" aria-label="Serviço"><option value="all">Todos os serviços</option>${S.services.map(s=>`<option value="${s.id}" ${f.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  </div>
  ${UI.profile !== 'profissional' ? `<div class="card" style="margin-bottom:16px;${pend.length ? 'border-color:var(--accent)' : ''}">
    <div class="card-h"><div><h3>Aguardando sua aprovação</h3><p class="muted small">Horários reservados pela assistente virtual. Aprove, sugira outro horário ou recuse.</p></div><span class="chip c-ia">${pend.length} pendente${pend.length===1?'':'s'}</span></div>
    ${pend.length ? `<div class="appr">${pend.map(a => { const p = patById(a.pid); return `<div class="appr-it ${a._new ? 'new' : ''}"><div class="avatar">${initials(p.name)}</div><div class="grow"><div class="who">${esc(p.name)} <span class="tag">${esc(p.origin.replace(' (tráfego pago)',''))}</span></div><div class="when">${esc(apptLabel(a))} · ${fmtDateLong(a.date)} às ${hm(a.start)} · ${esc(staffById(a.prof).short)}</div></div>
      <div class="row"><button class="btn primary sm" data-a="approve" data-id="${a.id}">${ic('check')} Aprovar</button><button class="btn sm" data-a="reschedule" data-id="${a.id}">Outro horário</button><button class="btn sm danger" data-a="rejectAppt" data-id="${a.id}">Recusar</button></div></div>`; }).join('')}</div>`
      : `<div class="empty">Nenhum pedido pendente. Quando a assistente reservar um horário, ele aparece aqui e no seu celular.</div>`}
  </div>` : ''}
  <div class="kpis">
    ${K('Agendamentos', f.period==='hoje'?m.today:m.total, `hoje ${m.today} · semana ${m.week} · mês ${m.month}`, 'agenda', true)}
    ${K('Confirmadas', m.confirmed, 'no período', 'agenda')}
    ${K('Pendentes de confirmação', m.pending, 'reservadas ou solicitadas', 'agenda')}
    ${UI.profile !== 'profissional' ? K('Aguardando resposta', m.waiting, 'conversas com a equipe', 'atendimento') : ''}
    ${K('Novos contatos', m.newContacts, 'no período', 'pacientes')}
    ${K('Avaliações realizadas', m.evals, 'compareceram', 'agenda')}
    ${UI.profile !== 'recepcao' ? K('Propostas emitidas', m.propsIssued, `${m.propsAccepted} aceitas · ${m.propsPending} pendentes`, 'propostas') : ''}
    ${K('Comparecimentos', m.attended, `${m.noshow} falta${m.noshow===1?'':'s'}`, 'agenda')}
    ${K('Retornos programados', m.returns, 'a partir de hoje', 'agenda')}
    ${canMoney() ? K('Receita registrada', brl(m.revenue), 'lançada manualmente', 'relatorios') : ''}
    ${K('Contato → agendamento', m.convContact + '%', 'pacientes com horário', 'pacientes')}
    ${UI.profile !== 'recepcao' ? K('Proposta → aceita', m.convProp + '%', 'das entregues', 'propostas') : ''}
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-h"><h3>Agenda de hoje</h3><button class="btn sm" data-a="go" data-r="agenda">Abrir agenda</button></div>
      ${todayList.length ? `<div class="list">${todayList.map(a => `<div class="li"><span class="t">${hm(a.start)}</span><div class="grow"><b style="font-weight:500">${a.pid ? esc(patById(a.pid).name) : 'Bloqueio'}</b><div class="muted small">${esc(apptLabel(a))} · ${esc(staffById(a.prof).short)} · ${esc((S.settings.rooms.find(r=>r.id===a.room)||{}).name||'')}</div></div>${stChip(a.status)}<button class="btn sm" data-a="openAppt" data-id="${a.id}">Abrir</button></div>`).join('')}</div>` : `<div class="empty">Sem atendimentos hoje${new Date().getDay()===0 ? ' (domingo, clínica fechada)' : ''}.</div>`}
    </div>
    <div class="card"><div class="card-h"><h3>Próximos 7 dias</h3><span class="muted xs">agendamentos ativos</span></div>${vbars(byDay)}</div>
    <div class="card"><div class="card-h"><h3>Origem dos contatos</h3></div>${bars(origins)}</div>
    <div class="card"><div class="card-h"><h3>Procura por procedimento</h3><span class="muted xs">interesse declarado</span></div>${bars(cats)}</div>
    <div class="card"><div class="card-h"><h3>Horários mais ocupados</h3><span class="muted xs">no período filtrado</span></div>${vbars(hours)}</div>
    <div class="card"><div class="card-h"><h3>Atividade recente</h3><button class="btn sm" data-a="drawer">Ver tudo</button></div>
      <div class="list">${S.notifications.slice(0,6).map(n => `<div class="li"><span class="dotn" style="width:8px;height:8px;border-radius:50%;background:${n.read?'var(--line-2)':'var(--accent)'};flex:none"></span><button class="grow" style="background:none;border:none;text-align:left;padding:0" data-a="openNotif" data-id="${n.id}">${esc(n.text)}<div class="muted xs">${fmtWhen(n.at)}</div></button></div>`).join('')}</div></div>
  </div>`;
};
Object.assign(A, {
  dashPeriod: t => { UI.dash.period = t.dataset.v; render(); },
  approve: t => { const a = apptById(t.dataset.id); if (conflicts(a.date, a.start, a.dur, a.prof, a.room, a.id).length) { toast('Conflito encontrado. Escolha outro horário.'); return apptModal(a, 'reagendar'); } approveAppt(a); commit(); },
  rejectAppt: t => { const a = apptById(t.dataset.id); openModal(`${mHead('Recusar pedido de horário', esc(patById(a.pid).name) + ' · ' + fmtDateLong(a.date) + ' ' + hm(a.start))}<div class="mb"><div class="field"><label for="rej-why">Motivo (registrado no histórico)</label><input class="input" id="rej-why" value="Horário indisponível para a profissional"></div><p class="muted small">O horário é liberado e a conversa passa para atendimento humano para combinar outra opção.</p></div><div class="mf"><button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="confirmReject" data-id="${a.id}">Recusar e liberar horário</button></div>`); },
  confirmReject: t => { const a = apptById(t.dataset.id); setApptStatus(a, 'cancelado', 'Recusado: ' + ($('#rej-why').value || 'sem motivo')); const c = S.conversations.find(c => c.pid === a.pid); if (c) { c.state = 'aguardando'; c.msgs.push({ from:'sistema', text:'Pedido de horário recusado pela clínica · aguardando contato da recepção', at:nowIso() }); } closeModal(); commit('Pedido recusado e horário liberado'); },
  reschedule: t => apptModal(apptById(t.dataset.id), 'reagendar'),
  openAppt: t => apptModal(apptById(t.dataset.id)),
});
Object.assign(C, { dashProf: t => { UI.dash.prof = t.value; render(); }, dashSvc: t => { UI.dash.svc = t.value; render(); } });

/* ================= AGENDA ================= */
const SLOT_PX = 22; const DAY_START = 480; const DAY_END = 1170;
function agendaFiltered() {
  const g = UI.agenda;
  return visibleAppts().filter(a => (g.prof === 'all' || a.prof === g.prof) && (g.status === 'all' || a.status === g.status) && (g.room === 'all' || a.room === g.room) && (g.svc === 'all' || a.svc === g.svc));
}
VIEWS.agenda = () => {
  const g = UI.agenda; const anchor = parseYmd(g.anchor);
  let title, body;
  const list = agendaFiltered();
  if (g.view === 'semana' || g.view === 'dia') {
    const days = g.view === 'semana' ? Array.from({ length:6 }, (_, i) => addDays(mondayOf(anchor), i)) : [anchor];
    title = g.view === 'semana' ? `${days[0].getDate()} – ${days[5].getDate()} de ${MON[days[5].getMonth()]}` : fmtDateLong(ymd(anchor));
    if (g.view === 'dia' && innerWidth < 760) {
      const ds = ymd(anchor); const items = list.filter(a => a.date === ds).sort((a,b) => a.start - b.start);
      const free = freeSlots(ds, 40, g.prof === 'all' ? (UI.profile === 'profissional' ? 'paula' : 'grazi') : g.prof);
      body = `<div class="card daylist">${items.length ? `<div class="list">${items.map(a => `<div class="li"><span class="t">${hm(a.start)}</span><div class="grow"><b style="font-weight:500">${a.pid ? esc(patById(a.pid).name) : 'Bloqueio pessoal'}</b> ${a.origin==='ia'?'<span class="tag">IA</span>':''}<div class="muted small">${esc(apptLabel(a))} · ${a.dur} min · ${esc(staffById(a.prof).short)}</div><div style="margin-top:4px">${stChip(a.status)}</div></div><button class="btn sm" data-a="openAppt" data-id="${a.id}">Abrir</button></div>`).join('')}</div>` : `<div class="empty">${dayWindow(ds) ? 'Nenhum compromisso neste dia.' : 'Clínica fechada neste dia.'}</div>`}
        ${free.length ? `<div style="margin-top:12px"><div class="lbl" style="margin-bottom:6px">Horários livres (avaliação de 40 min)</div><div class="row">${free.slice(0,8).map(m => `<button class="btn sm" data-a="newAt" data-d="${ds}" data-m="${m}">${hm(m)}</button>`).join('')}</div></div>` : ''}</div>`;
    } else {
      const rows = (DAY_END - DAY_START) / 30;
      const nowD = new Date(); const nowMin = nowD.getHours()*60 + nowD.getMinutes();
      body = `<div class="cal-wrap"><div class="cal" style="--slot:${SLOT_PX}px;grid-template-columns:54px repeat(${days.length}, minmax(${g.view==='dia'?260:110}px,1fr));min-width:${g.view==='dia'?320:760}px">
        <div class="hd"></div>${days.map(d => `<div class="hd ${ymd(d)===ymd(nowD)?'today':''}">${DOW3[d.getDay()]}<b>${d.getDate()}</b></div>`).join('')}
        <div class="tcol">${Array.from({ length:rows }, (_, i) => `<div>${i%2===0 ? hm(DAY_START + i*30) : ''}</div>`).join('')}</div>
        ${days.map(d => { const ds = ymd(d); const w = dayWindow(ds); const [ls, le] = S.settings.lunch;
          const y = m => (m - DAY_START) / 30 * SLOT_PX;
          const closed = !w ? `<div class="closed" style="top:0;bottom:0"></div>` : `<div class="closed" style="top:0;height:${y(w[0])}px"></div><div class="closed" style="top:${y(w[1])}px;bottom:0"></div>${d.getDay()!==6 ? `<div class="closed" style="top:${y(ls)}px;height:${y(le)-y(ls)}px"></div>` : ''}`;
          const evs = list.filter(a => a.date === ds).map(a => { const lane = a.prof === 'paula' && g.prof === 'all' && g.view === 'semana';
            return `<button class="ev st-${a.status}" style="top:${y(a.start)}px;height:${Math.max(18, a.dur/30*SLOT_PX - 2)}px;${lane ? 'left:52%;' : g.prof==='all' && g.view==='semana' && list.some(b => b.date === ds && b.prof === 'paula' && b.start < a.start + a.dur && a.start < b.start + b.dur) ? 'right:50%;' : ''}" data-a="openAppt" data-id="${a.id}" title="${esc(apptLabel(a))}">${a.origin==='ia'?'<span class="ia">IA</span>':''}<b>${hm(a.start)} ${a.pid ? esc(patById(a.pid).name.split(' ')[0]) : 'Bloqueio'}</b><span>${esc(a.type==='bloqueio'?'Pessoal':apptLabel(a))}</span></button>`; }).join('');
          const nl = ds === ymd(nowD) && nowMin > DAY_START && nowMin < DAY_END ? `<div class="nowline" style="top:${y(nowMin)}px"></div>` : '';
          return `<div class="dcol" data-a="calClick" data-d="${ds}" style="height:${rows*SLOT_PX}px">${closed}${evs}${nl}</div>`; }).join('')}
      </div></div>`;
    }
  } else {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1); const start = mondayOf(first);
    title = MON[anchor.getMonth()] + ' de ' + anchor.getFullYear();
    body = `<div class="month">${['seg','ter','qua','qui','sex','sáb','dom'].map(d => `<div class="mh">${d}</div>`).join('')}${Array.from({ length:42 }, (_, i) => { const d = addDays(start, i); const ds = ymd(d); const items = list.filter(a => a.date === ds && a.type !== 'bloqueio').sort((a,b)=>a.start-b.start);
      return `<button class="md ${d.getMonth()!==anchor.getMonth()?'out':''} ${ds===ymd(new Date())?'today':''}" data-a="monthDay" data-d="${ds}"><span class="dn">${d.getDate()}</span>${items.slice(0,3).map(a => `<span class="mi st-${a.status}">${hm(a.start)} ${a.pid ? esc(patById(a.pid).name.split(' ')[0]) : ''}</span>`).join('')}${items.length > 3 ? `<span class="muted xs">+${items.length-3}</span>` : ''}${items.length ? `<span class="cnt">${items.length} ag.</span>` : ''}</button>`; }).join('')}</div>`;
  }
  return `
  <div class="page-h"><div><span class="eyebrow">Agenda inteligente · fuso ${esc(S.settings.tz)}</span><h1>Agenda</h1><p>Agendamentos da recepção e pedidos da assistente convergem para esta mesma agenda.</p></div>
    <div class="row"><button class="btn" data-a="findFree">${ic('search')} Buscar horário livre</button>${UI.profile !== 'profissional' || true ? `<button class="btn primary" data-a="newAppt">${ic('plus')} Novo agendamento</button>` : ''}</div></div>
  <div class="cal-tools">
    <div class="seg">${['dia','semana','mes'].map(v => `<button class="${g.view===v?'on':''}" data-a="calView" data-v="${v}">${v==='mes'?'Mês':v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div>
    <button class="btn sm" data-a="calNav" data-v="-1" aria-label="Anterior">${ic('left')}</button><button class="btn sm" data-a="calToday">Hoje</button><button class="btn sm" data-a="calNav" data-v="1" aria-label="Próximo">${ic('right')}</button>
    <b style="font-family:var(--f-display);font-size:21px;font-weight:600">${title}</b>
    <span class="grow"></span>
    ${UI.profile !== 'profissional' ? `<select class="input" style="width:auto" data-c="agProf" aria-label="Profissional"><option value="all">Todas</option>${S.staff.filter(s=>s.id!=='camila').map(s=>`<option value="${s.id}" ${g.prof===s.id?'selected':''}>${esc(s.short)}</option>`).join('')}</select>` : ''}
    <select class="input" style="width:auto" data-c="agStatus" aria-label="Status"><option value="all">Todos os status</option>${APPT_STATUS.map(s=>`<option value="${s}" ${g.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join('')}</select>
    <select class="input" style="width:auto" data-c="agRoom" aria-label="Sala"><option value="all">Todas as salas</option>${S.settings.rooms.map(r=>`<option value="${r.id}" ${g.room===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select>
    <select class="input" style="width:auto" data-c="agSvc" aria-label="Procedimento"><option value="all">Todos os procedimentos</option>${S.services.map(s=>`<option value="${s.id}" ${g.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  </div>
  ${body}
  <div class="legend">${['solicitado','reservado','confirmado','compareceu','concluido','cancelado','falta','bloqueio'].map(stChip).join('')}<span class="tag">IA = pedido da assistente</span></div>
  <div class="grid2" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>Agenda externa</h3><span class="chip">Integração pendente</span></div><p class="muted small">Conexão opcional com Google Agenda. A agenda interna acima já funciona sozinha. A sincronização real exige credenciais, regras para conflitos e testes, e não está ativa nesta demonstração.</p><div class="row" style="margin-top:10px"><button class="btn sm" disabled>Conectar Google Agenda (visualização)</button></div></div>
    <div class="card"><div class="card-h"><h3>Regras da agenda</h3><button class="btn sm" data-a="go" data-r="configuracoes">Editar</button></div><p class="muted small">Segunda a sexta ${hm(S.settings.hours[1][0])}–${hm(S.settings.hours[1][1])}, pausa ${hm(S.settings.lunch[0])}–${hm(S.settings.lunch[1])} · Sábado ${S.settings.hours[6] ? hm(S.settings.hours[6][0]) + '–' + hm(S.settings.hours[6][1]) : 'fechado'} · Intervalo de ${S.settings.step} min · Duração por procedimento em Tratamentos. Dupla reserva da mesma profissional ou sala é bloqueada.</p></div>
  </div>`;
};
Object.assign(A, {
  calView: t => { UI.agenda.view = t.dataset.v; render(); },
  calNav: t => { const g = UI.agenda; const d = parseYmd(g.anchor); const n = Number(t.dataset.v); g.anchor = ymd(g.view === 'mes' ? new Date(d.getFullYear(), d.getMonth()+n, 1) : addDays(d, n * (g.view === 'semana' ? 7 : 1))); render(); },
  calToday: () => { UI.agenda.anchor = ymd(new Date()); render(); },
  monthDay: t => { UI.agenda.anchor = t.dataset.d; UI.agenda.view = 'dia'; render(); },
  calClick: (t, e) => { if (e.target !== t) return; const r = t.getBoundingClientRect(); const m = DAY_START + Math.floor((e.clientY - r.top) / SLOT_PX) * 30; apptModal(null, 'novo', { date:t.dataset.d, start:m }); },
  newAt: t => apptModal(null, 'novo', { date:t.dataset.d, start:Number(t.dataset.m) }),
  newAppt: () => apptModal(null, 'novo'),
  findFree: () => findFreeModal(),
});
Object.assign(C, { agProf: t => { UI.agenda.prof = t.value; render(); }, agStatus: t => { UI.agenda.status = t.value; render(); }, agRoom: t => { UI.agenda.room = t.value; render(); }, agSvc: t => { UI.agenda.svc = t.value; render(); } });

function apptModal(a, mode, preset={}) {
  if (!a && mode !== 'novo') return;
  if (a && !mode) {
    const p = a.pid && patById(a.pid);
    const shareTxt = `${p ? p.name : 'Bloqueio'} — ${apptLabel(a)}\n${fmtDateLong(a.date)} às ${hm(a.start)} (${a.dur} min)\n${staffById(a.prof).name} · ${(S.settings.rooms.find(r=>r.id===a.room)||{}).name}\n${S.settings.clinic}${S.settings.address ? ' · ' + S.settings.address : ''}`;
    return openModal(`${mHead(p ? esc(p.name) : 'Bloqueio pessoal', esc(apptLabel(a)))}
    <div class="mb">
      <div class="row">${stChip(a.status)}${a.origin==='ia'?'<span class="chip c-ia">Pedido da assistente</span>':''}<span class="chip">${esc(TYPES[a.type])}</span></div>
      <dl class="kv"><dt>Data e hora</dt><dd>${fmtDateLong(a.date)} · ${hm(a.start)}–${hm(a.start+a.dur)}</dd><dt>Profissional</dt><dd>${esc(staffById(a.prof).name)}</dd><dt>Sala</dt><dd>${esc((S.settings.rooms.find(r=>r.id===a.room)||{}).name||'—')}</dd>${p ? `<dt>Contato</dt><dd>${esc(p.phone)}</dd>` : ''}${a.cancelReason ? `<dt>Motivo do cancelamento</dt><dd>${esc(a.cancelReason)}</dd>` : ''}</dl>
      ${a.type !== 'bloqueio' && a.status !== 'cancelado' ? `<div><div class="lbl" style="margin-bottom:6px">Alterar status</div><div class="row">${(UI.profile==='admin' && (a.status==='reservado'||a.status==='solicitado')) ? `<button class="btn primary sm" data-a="approve" data-id="${a.id}">${ic('check')} Aprovar</button>` : ''}${['confirmado','compareceu','concluido','falta'].filter(s => s !== a.status).map(s => `<button class="btn sm" data-a="apSt" data-id="${a.id}" data-s="${s}">${STATUS_LABEL[s]}</button>`).join('')}</div></div>` : ''}
      <details><summary class="small muted" style="cursor:pointer">Histórico de alterações (${a.log.length})</summary><div class="timeline-v" style="margin-top:10px">${a.log.map(l => `<div>${esc(l.what)}<small>${fmtWhen(l.at)} · ${esc(l.by)}</small></div>`).join('')}</div></details>
      <textarea class="input hide" id="share-txt" readonly>${esc(shareTxt)}</textarea>
    </div>
    <div class="mf">${p ? `<button class="btn sm" data-a="shareAppt">${ic('share')} Compartilhar informações</button><button class="btn sm" data-a="openPatient" data-id="${p.id}">Abrir paciente</button>` : ''}${a.status !== 'cancelado' ? `<button class="btn sm" data-a="reschedule" data-id="${a.id}">Reagendar</button><button class="btn sm danger" data-a="cancelAppt" data-id="${a.id}">Cancelar</button>` : ''}</div>`);
  }
  const isNew = mode === 'novo';
  const st = { pid: a ? a.pid : '', type: a ? a.type : 'avaliacao', svc: a ? a.svc : 'botox', prof: a ? a.prof : (UI.profile === 'profissional' ? 'paula' : 'grazi'), room: a ? a.room : 's1', date: preset.date || (a ? a.date : ymd(addDays(new Date(), 1))), start: preset.start != null ? preset.start : (a ? a.start : null), dur: a ? a.dur : 40 };
  UI.apf = st;
  const draw = () => {
    const s = UI.apf;
    const free = freeSlots(s.date, s.dur, s.prof, s.room, a && a.id);
    const conf = s.start != null ? conflicts(s.date, s.start, s.dur, s.prof, s.room, a && a.id) : [];
    return `${mHead(isNew ? 'Novo agendamento' : 'Reagendar', isNew ? 'Somente horários livres são oferecidos. Conflitos pedem confirmação.' : esc(a.pid ? patById(a.pid).name : 'Bloqueio') + ' · atual: ' + fmtDate(a.date) + ' ' + hm(a.start))}
    <form class="mb" data-f="saveAppt" data-id="${a ? a.id : ''}">
      ${isNew ? `<div class="grid2">
        <div class="field"><label for="ap-type">Tipo</label><select class="input" id="ap-type" data-c="apf" data-k="type">${Object.entries(TYPES).map(([k,v]) => `<option value="${k}" ${s.type===k?'selected':''}>${v}</option>`).join('')}</select></div>
        ${s.type !== 'bloqueio' ? `<div class="field"><label for="ap-pid">Paciente</label><select class="input" id="ap-pid" data-c="apf" data-k="pid"><option value="">Selecione…</option><option value="__new">+ Nova paciente</option>${S.patients.map(p => `<option value="${p.id}" ${s.pid===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>` : '<div></div>'}
      </div>
      ${s.pid === '__new' ? `<div class="grid2"><div class="field"><label for="np-name">Nome da nova paciente *</label><input class="input" id="np-name" required value="${esc(s['_np-name']||'')}"></div><div class="field"><label for="np-phone">Telefone *</label><input class="input" id="np-phone" required placeholder="(65) 9…" value="${esc(s['_np-phone']||'')}"></div></div>` : ''}
      ${s.type !== 'bloqueio' ? `<div class="grid2"><div class="field"><label for="ap-svc">Procedimento</label><select class="input" id="ap-svc" data-c="apf" data-k="svc">${S.services.filter(x=>x.active).map(x => `<option value="${x.id}" ${s.svc===x.id?'selected':''}>${esc(x.name)} (${x.dur} min)</option>`).join('')}</select></div>
        <div class="field"><label for="ap-dur">Duração (min)</label><input class="input" type="number" min="15" step="5" id="ap-dur" value="${s.dur}" data-c="apf" data-k="dur"></div></div>` : `<div class="field"><label for="ap-dur">Duração (min)</label><input class="input" type="number" min="15" step="15" id="ap-dur" value="${s.dur}" data-c="apf" data-k="dur"></div>`}
      <div class="grid2"><div class="field"><label for="ap-prof">Profissional</label><select class="input" id="ap-prof" data-c="apf" data-k="prof">${S.staff.filter(x=>x.id!=='camila').map(x => `<option value="${x.id}" ${s.prof===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="ap-room">Sala</label><select class="input" id="ap-room" data-c="apf" data-k="room">${S.settings.rooms.map(r => `<option value="${r.id}" ${s.room===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></div></div>` : ''}
      <div class="grid2"><div class="field"><label for="ap-date">Data</label><input class="input" type="date" id="ap-date" value="${s.date}" data-c="apf" data-k="date"></div>
        <div class="field"><label for="ap-start">Horário</label><select class="input" id="ap-start" data-c="apf" data-k="start"><option value="">${free.length ? 'Escolha um horário livre' : 'Sem horários livres nesta data'}</option>${free.map(m => `<option value="${m}" ${s.start===m?'selected':''}>${hm(m)} — livre</option>`).join('')}${s.start != null && !free.includes(s.start) ? `<option value="${s.start}" selected>${hm(s.start)} — ${conf.length ? 'ocupado' : 'fora do padrão'}</option>` : ''}</select></div></div>
      ${!dayWindow(s.date) ? `<div class="note">Clínica fechada nesta data, conforme horário de funcionamento.</div>` : ''}
      ${conf.length ? `<div class="warnbox">Este horário conflita com: ${conf.map(c => `<b>${c.pid ? esc(patById(c.pid).name) : 'Bloqueio'}</b> (${hm(c.start)}–${hm(c.start+c.dur)})`).join(', ')}. <label class="row" style="margin-top:8px"><input type="checkbox" id="ap-force"> Confirmo que desejo substituir/sobrepor este horário</label></div>` : ''}
      ${!isNew ? `<div class="field"><label for="ap-why">Motivo da alteração</label><input class="input" id="ap-why" placeholder="Ex.: pedido da paciente" value="${esc(s['_ap-why']||'')}"></div>` : ''}
      <div id="ap-err" class="errtxt"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-a="closeModal">Cancelar</button><button class="btn primary">${isNew ? 'Agendar' : 'Salvar novo horário'}</button></div>
    </form>`;
  };
  UI.apDraw = draw;
  openModal(draw);
}
Object.assign(C, {
  apf: t => { ['np-name','np-phone','ap-why'].forEach(id => { const e = $('#' + id); if (e) UI.apf['_' + id] = e.value; }); const k = t.dataset.k; let v = t.value; if (k === 'start' || k === 'dur') v = v === '' ? null : Number(v); UI.apf[k] = v;
    if (k === 'svc') { const s = svcById(v); UI.apf.dur = UI.apf.type === 'avaliacao' ? 40 : s.dur; }
    if (k === 'type') UI.apf.dur = v === 'avaliacao' ? 40 : v === 'retorno' ? 30 : v === 'bloqueio' ? 60 : (svcById(UI.apf.svc)||{dur:60}).dur;
    if (['date','prof','room','dur','type','svc'].includes(k) && UI.apf.start != null && !freeSlots(UI.apf.date, UI.apf.dur, UI.apf.prof, UI.apf.room).includes(UI.apf.start) && k !== 'dur') UI.apf.start = null;
    renderModal(); },
});
F.saveAppt = f => {
  const s = UI.apf; const id = f.dataset.id; const a = id && apptById(id); const err = $('#ap-err');
  if (s.start == null) { err.textContent = 'Escolha um horário.'; return; }
  const conf = conflicts(s.date, s.start, s.dur, s.prof, s.room, id || undefined);
  if (conf.length && !($('#ap-force') && $('#ap-force').checked)) { err.textContent = 'Há conflito neste horário. Marque a confirmação ou escolha outro horário livre.'; return; }
  if (a) { moveAppt(a, s.date, s.start, $('#ap-why') && $('#ap-why').value); closeModal(); return commit('Reagendado. O horário anterior foi liberado.'); }
  let pid = s.pid;
  if (s.type !== 'bloqueio') {
    if (pid === '__new') { const n = $('#np-name').value.trim(), ph = $('#np-phone').value.trim(); if (n.length < 3 || ph.replace(/\D/g,'').length < 10) { err.textContent = 'Informe nome e telefone com DDD.'; return; } pid = createPatient({ name:n, phone:ph, origin:'WhatsApp direto' }).id; }
    if (!pid) { err.textContent = 'Selecione a paciente.'; return; }
  }
  const ap = createAppt({ pid: s.type === 'bloqueio' ? null : pid, type:s.type, svc: s.type === 'bloqueio' ? null : s.svc, prof:s.prof, room:s.room, date:s.date, start:s.start, dur:s.dur, status: s.type === 'bloqueio' ? 'bloqueio' : 'confirmado', notes: s.type === 'bloqueio' ? 'Bloqueio pessoal' : '' });
  if (ap.pid) notify('agendado', `Agendamento criado: ${patById(ap.pid).name} · ${fmtDate(ap.date)} ${hm(ap.start)}`, ['agenda'], { push:false });
  closeModal(); UI.agenda.anchor = s.date; commit('Agendado e horário bloqueado');
};
Object.assign(A, {
  apSt: t => { const a = apptById(t.dataset.id); setApptStatus(a, t.dataset.s); closeModal(); commit('Status atualizado: ' + STATUS_LABEL[t.dataset.s]); },
  cancelAppt: t => { const a = apptById(t.dataset.id); openModal(`${mHead('Cancelar agendamento', esc(a.pid ? patById(a.pid).name : 'Bloqueio') + ' · ' + fmtDateLong(a.date) + ' ' + hm(a.start))}<div class="mb"><div class="field"><label for="cx-why">Motivo administrativo (opcional)</label><select class="input" id="cx-why"><option>Pedido da paciente</option><option>Imprevisto de trabalho</option><option>Agenda da profissional</option><option>Sem retorno de confirmação</option><option>Outro</option></select></div><p class="muted small">O horário é liberado imediatamente para novos agendamentos.</p></div><div class="mf"><button class="btn" data-a="closeModal">Voltar</button><button class="btn danger" data-a="confirmCancel" data-id="${a.id}">Cancelar e liberar horário</button></div>`); },
  confirmCancel: t => { const a = apptById(t.dataset.id); setApptStatus(a, 'cancelado', $('#cx-why').value); closeModal(); commit('Cancelado e horário liberado'); },
  shareAppt: () => { const txt = $('#share-txt').value; const ok = () => toast('Informações copiadas para compartilhar'); try { navigator.clipboard.writeText(txt).then(ok).catch(() => { const e = $('#share-txt'); e.classList.remove('hide'); e.select(); toast('Selecione e copie o texto'); }); } catch (e) { const el = $('#share-txt'); el.classList.remove('hide'); el.select(); } },
});
function findFreeModal() {
  UI.ff = UI.ff || { svc:'botox', prof:'grazi', period:'qualquer', type:'avaliacao' };
  const draw = () => { const f = UI.ff; const dur = f.type === 'avaliacao' ? 40 : svcById(f.svc).dur; const out = [];
    for (let i = 0; i < 14 && out.length < 12; i++) { const ds = ymd(addDays(new Date(), i)); freeSlots(ds, dur, f.prof).filter(m => f.period === 'qualquer' || (f.period === 'manha' ? m < 720 : m >= 780)).slice(0, 3).forEach(m => out.push([ds, m])); }
    return `${mHead('Buscar horário livre','Considera duração, intervalo, pausas, bloqueios e agendamentos existentes.')}<div class="mb">
    <div class="grid2"><div class="field"><label for="ff-type">Tipo</label><select class="input" id="ff-type" data-c="ff" data-k="type"><option value="avaliacao" ${f.type==='avaliacao'?'selected':''}>Avaliação (40 min)</option><option value="sessao" ${f.type==='sessao'?'selected':''}>Sessão do procedimento</option></select></div>
    <div class="field"><label for="ff-svc">Procedimento</label><select class="input" id="ff-svc" data-c="ff" data-k="svc">${S.services.map(s=>`<option value="${s.id}" ${f.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="ff-prof">Profissional</label><select class="input" id="ff-prof" data-c="ff" data-k="prof">${S.staff.filter(s=>s.id!=='camila').map(s=>`<option value="${s.id}" ${f.prof===s.id?'selected':''}>${esc(s.short)}</option>`).join('')}</select></div>
    <div class="field"><label for="ff-per">Período</label><select class="input" id="ff-per" data-c="ff" data-k="period"><option value="qualquer">Qualquer</option><option value="manha" ${f.period==='manha'?'selected':''}>Manhã</option><option value="tarde" ${f.period==='tarde'?'selected':''}>Tarde</option></select></div></div>
    <div class="row">${out.length ? out.map(([d,m]) => `<button class="btn sm" data-a="ffPick" data-d="${d}" data-m="${m}">${DOW3[parseYmd(d).getDay()]} ${fmtDate(d)} · ${hm(m)}</button>`).join('') : '<span class="muted">Nenhum horário livre nas próximas duas semanas.</span>'}</div></div>`; };
  openModal(draw);
}
C.ff = t => { UI.ff[t.dataset.k] = t.value; renderModal(); };
A.ffPick = t => { const f = UI.ff; apptModal(null, 'novo', { date:t.dataset.d, start:Number(t.dataset.m) }); Object.assign(UI.apf, { svc:f.svc, prof:f.prof, type:f.type, dur: f.type === 'avaliacao' ? 40 : svcById(f.svc).dur }); renderModal(); };

/* ================= ATENDIMENTO ================= */
const CONV_LABEL = { ia:'Atendida pela IA', aguardando:'Aguardando pessoa', humano:'Em atendimento humano', resolvida:'Resolvida' };
const INCOMING_FN = () => N().incoming.concat([['Gostaria de falar com a recepção, por favor','Indicação'],['Queria saber sobre o ' + S.lumini.name,'Instagram']]);
const FIRSTN = ['Bianca','Helena','Sofia','Laura','Valentina','Cecília','Lívia','Manuela','Alice','Yasmin','Clara','Giovana'];
const LASTN = ['Moreira','Santana','Fonseca','Lopes','Batista','Correia','Siqueira','Prado','Dias','Rezende'];
VIEWS.atendimento = () => {
  const fl = UI.inbox.filter;
  let convs = S.conversations.slice().sort((a,b) => (b.msgs.at(-1)||{at:''}).at.localeCompare((a.msgs.at(-1)||{at:''}).at));
  if (fl !== 'all') convs = convs.filter(c => c.state === fl);
  const c = UI.sel.conv && convById(UI.sel.conv);
  const p = c && patById(c.pid);
  const next = p && S.appts.filter(a => a.pid === p.id && activeAppt(a) && parseYmd(a.date) >= sod(new Date())).sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start))[0];
  const qr = S.ai.approved;
  return `
  <div class="page-h"><div><span class="eyebrow">Central de atendimento</span><h1>Atendimento</h1><p>Conversas locais e fictícias. Nenhuma mensagem real é enviada; a integração oficial depende da WhatsApp Business Platform ou de provedor autorizado.</p></div>
    <div class="row"><button class="btn primary" data-a="simIncoming">${ic('chat')} Simular mensagem recebida</button></div></div>
  <div class="inbox ${c ? 'has-sel' : ''}">
    <div class="convs"><div class="ch"><select class="input" data-c="inboxFilter" aria-label="Filtrar conversas"><option value="all">Todas as conversas</option>${Object.entries(CONV_LABEL).map(([k,v]) => `<option value="${k}" ${fl===k?'selected':''}>${v} (${S.conversations.filter(x=>x.state===k).length})</option>`).join('')}</select></div>
      ${convs.length ? convs.map(cv => { const pp = patById(cv.pid); const last = cv.msgs.at(-1) || { text:'' };
        return `<button class="cv ${c && c.id===cv.id ? 'on' : ''}" data-a="openConv" data-id="${cv.id}"><div class="avatar">${initials(pp.name)}</div><div class="grow"><div class="nm"><span>${esc(pp.name)}</span>${cv.unread ? `<span class="un">${cv.unread}</span>` : `<span class="muted xs">${last.at ? fmtTime(last.at) : ''}</span>`}</div><div class="pv">${esc(last.text)}</div><span class="chip c-${cv.state}" style="margin-top:4px;font-size:11px">${CONV_LABEL[cv.state]}</span></div></button>`; }).join('') : '<div class="empty">Nenhuma conversa neste filtro.</div>'}
    </div>
    ${c ? `<div class="chat">
      <div class="chh"><button class="btn sm m-only" data-a="closeConv" aria-label="Voltar">${ic('back')}</button><div class="avatar">${initials(p.name)}</div><div class="grow"><b style="font-weight:500">${esc(p.name)}</b><div class="muted xs">${esc(p.phone)} · ${esc(p.origin)}</div></div><span class="chip c-${c.state}">${CONV_LABEL[c.state]}</span></div>
      <div class="msgs" id="msgs">${c.msgs.map(msgHtml).join('')}${c._typing ? '<div class="typing">assistente digitando…</div>' : ''}</div>
      <div class="compose">
        <div class="row" style="gap:6px"><span class="muted xs">Escrevendo como</span><div class="seg"><button class="${UI.inbox.as==='paciente'?'on':''}" data-a="inboxAs" data-v="paciente">Paciente (teste)</button><button class="${UI.inbox.as==='humano'?'on':''}" data-a="inboxAs" data-v="humano">Equipe</button></div></div>
        ${UI.inbox.as === 'humano' ? `<div class="qr">${qr.map((q,i) => `<button data-a="quick" data-i="${i}" title="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
        <form data-f="sendMsg"><input class="input" id="msg-in" autocomplete="off" placeholder="${UI.inbox.as==='paciente' ? 'Escreva como se fosse a paciente para testar a assistente…' : 'Responder como equipe (assume o atendimento)…'}"><button class="btn primary" aria-label="Enviar">${ic('send')}</button></form>
      </div></div>
    <div class="ctx">
      <div><h4>Paciente</h4><b style="font-weight:500">${esc(p.name)}</b><div class="muted small">${esc(p.phone)}</div><div style="margin-top:6px" class="row"><span class="chip">${esc(p.stage)}</span></div><div class="row" style="margin-top:6px;gap:4px">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      <div><h4>Próximo horário</h4>${next ? `<div>${esc(apptLabel(next))}</div><div class="muted small">${fmtDateLong(next.date)} · ${hm(next.start)}</div><div style="margin-top:4px">${stChip(next.status)}</div>` : '<div class="muted small">Nenhum agendamento futuro.</div>'}</div>
      <div><h4>Ações</h4><div class="acts-grid">
        ${c.state !== 'humano' ? `<button class="btn" data-a="convState" data-s="humano">Assumir atendimento</button>` : `<button class="btn" data-a="convState" data-s="ia">Devolver para IA</button>`}
        <button class="btn" data-a="convState" data-s="aguardando">Transferir para humano</button>
        <button class="btn" data-a="convAgenda">Consultar agenda</button>
        <button class="btn" data-a="convPropose">Propor horário</button>
        ${next ? `<button class="btn" data-a="convConfirm" data-id="${next.id}">Confirmar</button><button class="btn" data-a="reschedule" data-id="${next.id}">Reagendar</button><button class="btn danger" data-a="cancelAppt" data-id="${next.id}">Cancelar</button>` : ''}
        <button class="btn" data-a="openPatient" data-id="${p.id}">Abrir paciente</button>
        <button class="btn" data-a="convTask">Criar lembrete</button>
        <button class="btn" data-a="convState" data-s="resolvida">Marcar resolvida</button>
      </div></div>
      <div class="note">A assistente usa apenas textos aprovados. Assuntos de saúde são transferidos automaticamente.</div>
    </div>` : `<div class="chat" style="display:grid;place-items:center"><div class="empty">Selecione uma conversa ou toque em <b>Simular mensagem recebida</b>.</div></div><div class="ctx"></div>`}
  </div>`;
};
function msgHtml(m) {
  const who = m.from === 'ia' ? S.ai.name : m.from === 'humano' ? 'Equipe' : '';
  const opts = m.opts ? `<div class="opts">${m.opts.map(o => `<button data-a="pickOpt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : '';
  return `<div class="msg ${m.from}">${who ? `<div class="who">${esc(who)}</div>` : ''}${esc(m.text)}${opts}${m.from !== 'sistema' ? `<div class="meta">${fmtTime(m.at)}${m.from === 'ia' ? ' · simulado' : ''}</div>` : ''}</div>`;
}
AFTER.atendimento = () => { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; };
Object.assign(A, {
  openConv: t => { UI.sel.conv = t.dataset.id; const c = convById(UI.sel.conv); c.unread = 0; S.notifications.filter(n => n.go && n.go[1] === c.id).forEach(n => n.read = true); commit(); },
  closeConv: () => { UI.sel.conv = null; render(); },
  inboxAs: t => { UI.inbox.as = t.dataset.v; render(); },
  quick: t => { const i = $('#msg-in'); i.value = S.ai.approved[Number(t.dataset.i)]; i.focus(); },
  simIncoming: () => {
    const [text, origin] = INCOMING_FN()[Math.floor(Math.random() * INCOMING_FN().length)];
    const name = FIRSTN[Math.floor(Math.random()*FIRSTN.length)] + ' ' + LASTN[Math.floor(Math.random()*LASTN.length)];
    const p = createPatient({ name, phone:'(65) 9' + (8000 + Math.floor(Math.random()*1999)) + '-' + (1000 + Math.floor(Math.random()*8999)), origin, stage:'Novo contato' });
    const c = { id:uid('c'), pid:p.id, state:'ia', unread:1, ctx:{}, msgs:[] };
    S.conversations.unshift(c); UI.sel.conv = c.id;
    notify('conversa', `Nova conversa: ${name} (${origin.replace(' (tráfego pago)','')})`, ['atendimento', c.id]);
    patientSays(c, text);
  },
  convState: t => { const c = convById(UI.sel.conv); const s = t.dataset.s; c.state = s;
    c.msgs.push({ from:'sistema', text: s === 'humano' ? `${meName()} assumiu o atendimento` : s === 'ia' ? 'Atendimento devolvido para a assistente' : s === 'aguardando' ? 'Transferida para atendimento humano' : 'Conversa marcada como resolvida', at:nowIso() });
    if (s === 'aguardando') { setStage(c.pid, 'Aguardando humano'); notify('humano', `${patById(c.pid).name} aguarda atendimento humano`, ['atendimento', c.id]); }
    commit(); },
  convAgenda: () => { const c = convById(UI.sel.conv); const slots = nextSlots(40, 'grazi', null, 3); c.msgs.push({ from:'sistema', text:'Horários livres para avaliação: ' + slots.map(([d,m]) => `${DOW3[parseYmd(d).getDay()]} ${fmtDate(d)} ${hm(m)}`).join(' · '), at:nowIso() }); commit(); },
  convPropose: () => { const c = convById(UI.sel.conv); const p = patById(c.pid); const slots = nextSlots(40, 'grazi', p.pref.startsWith('manh') ? 'manha' : p.pref.startsWith('tarde') ? 'tarde' : null, 3);
    c.ctx = Object.assign(c.ctx || {}, { stage:'oferecendo', offered:slots, svc: c.ctx && c.ctx.svc || p.interests[0] || null });
    c.msgs.push({ from: c.state === 'ia' ? 'ia' : 'humano', text:'Tenho estes horários livres para sua avaliação:', opts: slots.map(([d,m]) => slotTxt(d,m)), at:nowIso() }); commit(); },
  convConfirm: t => { const a = apptById(t.dataset.id); setApptStatus(a, 'confirmado'); const c = convById(UI.sel.conv); c.msgs.push({ from:'humano', text:`Seu horário está confirmado: ${fmtDateLong(a.date)} às ${hm(a.start)}.`, at:nowIso() }); commit('Confirmado'); },
  convTask: () => { const c = convById(UI.sel.conv); S.tasks.unshift({ id:uid('t'), text:'Retornar ' + patById(c.pid).name, who: prof().staff || 'camila', due:ymd(addDays(new Date(),1)), done:false }); commit('Lembrete criado para amanhã'); },
  pickOpt: t => { const c = UI.route === 'assistente' ? convById(S.sim.view === 'test' ? S.sim.testConv : S.sim.conv) : convById(UI.sel.conv); if (!c) return; patientSays(c, t.dataset.v); },
});
C.inboxFilter = t => { UI.inbox.filter = t.value; render(); };
F.sendMsg = () => {
  const i = $('#msg-in'); const text = i.value.trim(); if (!text) return; const c = convById(UI.sel.conv);
  if (UI.inbox.as === 'paciente') patientSays(c, text);
  else { if (c.state !== 'humano') { c.state = 'humano'; c.msgs.push({ from:'sistema', text:`${meName()} assumiu o atendimento`, at:nowIso() }); } c.msgs.push({ from:'humano', text, at:nowIso() }); commit(); }
};

/* ================= PACIENTES / CRM ================= */
VIEWS.pacientes = () => {
  if (UI.sel.patient && patById(UI.sel.patient)) return patientPage(patById(UI.sel.patient));
  const v = UI.pac; const q = v.q.toLowerCase();
  let ps = visiblePatients().filter(p => (!q || p.name.toLowerCase().includes(q) || p.phone.includes(q)) && (v.tag === 'all' || p.tags.includes(v.tag)));
  return `
  <div class="page-h"><div><span class="eyebrow">CRM de pacientes</span><h1>Pacientes e funil</h1><p>${ps.length} de ${visiblePatients().length} pacientes${UI.profile === 'profissional' ? ' autorizadas para ' + prow('a') + '' : ''}. Histórico comercial separado do registro clínico.</p></div>
    <div class="row">${UI.profile !== 'profissional' ? `<button class="btn primary" data-a="newPatient">${ic('plus')} Nova paciente</button>` : ''}</div></div>
  <div class="filters"><div class="seg"><button class="${v.view==='funil'?'on':''}" data-a="pacView" data-v="funil">Funil</button><button class="${v.view==='lista'?'on':''}" data-a="pacView" data-v="lista">Lista</button></div>
    <input class="input" style="width:min(260px,100%)" id="pac-q" placeholder="Buscar nome ou telefone" value="${esc(v.q)}" data-i="pacQ">
    <select class="input" style="width:auto" data-c="pacTag" aria-label="Etiqueta"><option value="all">Todas as etiquetas</option>${TAGS.map(t => `<option ${v.tag===t?'selected':''}>${t}</option>`).join('')}</select></div>
  ${v.view === 'funil' ? `<div class="kanban">${STAGES.map(st => { const items = ps.filter(p => p.stage === st);
    return `<div class="kcol" data-stage="${esc(st)}"><div class="kh">${esc(st)}<span>${items.length}</span></div>${items.map(p => `<div class="kcard" draggable="true" data-pid="${p.id}"><button class="nm" data-a="openPatient" data-id="${p.id}">${esc(p.name)}</button><div class="muted xs">${esc(p.origin.replace(' (tráfego pago)',''))} · ${p.interests.map(i => esc((svcById(i)||{name:i}).name.split(' ')[0])).join(', ')}</div>${p.tags.length ? `<div class="row" style="gap:4px">${p.tags.slice(0,2).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}<select data-c="moveStage" data-pid="${p.id}" aria-label="Mover para etapa"><option value="">Mover para…</option>${STAGES.filter(x=>x!==st).map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>`).join('')}</div>`; }).join('')}</div>`
  : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>Telefone</th><th>Etapa</th><th>Origem</th><th>Interesse</th><th>Último contato</th></tr></thead><tbody>${ps.map(p => `<tr class="click" data-a="openPatient" data-id="${p.id}"><td><b style="font-weight:500">${esc(p.name)}</b></td><td class="tabnum">${esc(p.phone)}</td><td><span class="chip">${esc(p.stage)}</span></td><td>${esc(p.origin.replace(' (tráfego pago)',''))}</td><td>${p.interests.map(i => esc((svcById(i)||{name:i}).name)).join(', ')}</td><td class="muted">${fmtWhen(p.last)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Nenhuma paciente encontrada.</td></tr>'}</tbody></table></div>`}
  <p class="note" style="margin-top:14px">Evitamos dados clínicos sensíveis no CRM comercial e não os enviamos para automações de marketing.</p>`;
};
AFTER.pacientes = () => {
  document.querySelectorAll('.kcard').forEach(k => { k.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', k.dataset.pid); k.classList.add('dragging'); }); k.addEventListener('dragend', () => k.classList.remove('dragging')); });
  document.querySelectorAll('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); const pid = e.dataTransfer.getData('text/plain'); if (pid) { setStage(pid, col.dataset.stage, 'movido por ' + meName()); commit('Etapa atualizada'); } });
  });
  const q = $('#pac-q'); if (q && UI.pac._focus) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); UI.pac._focus = false; }
};
Object.assign(A, {
  pacView: t => { UI.pac.view = t.dataset.v; render(); },
  openPatient: t => { closeModal(); UI.sel.patient = t.dataset.id; UI.pTab = 'resumo'; if (UI.route !== 'pacientes') goTo('pacientes', t.dataset.id); else { render(); scrollTo(0,0); } },
  backPatients: () => { UI.sel.patient = null; render(); },
  pTab: t => { UI.pTab = t.dataset.t; render(); },
  newPatient: () => openModal(`${mHead('Nova paciente','Coleta mínima: apenas o necessário para o atendimento.')}<form class="mb" data-f="savePatient">
    <div class="grid2"><div class="field"><label for="np-n">Nome completo *</label><input class="input" id="np-n" required minlength="3"></div><div class="field"><label for="np-p">Telefone *</label><input class="input" id="np-p" required placeholder="(65) 9…"></div>
    <div class="field"><label for="np-e">E-mail (opcional)</label><input class="input" type="email" id="np-e"></div><div class="field"><label for="np-o">Origem autorizada</label><select class="input" id="np-o">${ORIGINS.map(o=>`<option>${o}</option>`).join('')}</select></div>
    <div class="field"><label for="np-i">Procedimento de interesse</label><select class="input" id="np-i">${S.services.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label for="np-pr">Preferência de horário</label><select class="input" id="np-pr"><option>manhã</option><option>tarde</option><option>noite (após 17h)</option><option>qualquer</option></select></div></div>
    <div class="field"><label for="np-obs">Observações administrativas</label><textarea class="input" id="np-obs" placeholder="Sem informações clínicas aqui"></textarea></div>
    <div id="np-err" class="errtxt"></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-a="closeModal">Cancelar</button><button class="btn primary">Salvar paciente</button></div></form>`),
});
F.savePatient = () => { const n = $('#np-n').value.trim(), ph = $('#np-p').value.trim(); if (n.length < 3) return $('#np-err').textContent = 'Informe o nome completo.'; if (ph.replace(/\D/g,'').length < 10) return $('#np-err').textContent = 'Informe o telefone com DDD.';
  const p = createPatient({ name:n, phone:ph, email:$('#np-e').value.trim(), origin:$('#np-o').value, interests:[$('#np-i').value], pref:$('#np-pr').value, notes:$('#np-obs').value.trim() });
  notify('conversa', 'Nova paciente cadastrada: ' + n, ['pacientes', p.id], { push:false }); closeModal(); UI.sel.patient = p.id; commit('Paciente cadastrada e incluída no funil'); };
Object.assign(C, { pacTag: t => { UI.pac.tag = t.value; render(); }, moveStage: t => { if (!t.value) return; setStage(t.dataset.pid, t.value, 'movido por ' + meName()); commit('Etapa atualizada: ' + t.value); } });
I.pacQ = t => { UI.pac.q = t.value; UI.pac._focus = true; render(); };

function patientPage(p) {
  const tab = UI.pTab;
  const ap = S.appts.filter(a => a.pid === p.id).sort((a,b) => (b.date+b.start).localeCompare(a.date+a.start));
  const pr = S.proposals.filter(x => x.pid === p.id);
  const tabs = [['resumo','Resumo'],['agenda','Agendamentos (' + ap.length + ')'],['propostas','Propostas (' + pr.length + ')'],['avaliacao','Avaliação profissional'],['pagamentos','Pagamentos'],['historico','Histórico'],['documentos','Documentos'],['fotos','Fotos e consentimentos']];
  let body = '';
  if (tab === 'resumo') body = `<div class="grid2"><div class="card"><div class="card-h"><h3>Contato</h3></div><dl class="kv"><dt>Telefone</dt><dd>${esc(p.phone)}</dd><dt>E-mail</dt><dd>${esc(p.email || '—')}</dd><dt>Comunicação</dt><dd>${esc(p.comm)}</dd><dt>Preferência</dt><dd>${esc(p.pref)}</dd><dt>Origem</dt><dd>${esc(p.origin)}</dd><dt>Primeiro contato</dt><dd>${fmtWhen(p.created)}</dd></dl></div>
    <div class="card"><div class="card-h"><h3>Funil e etiquetas</h3></div><div class="field"><label for="pp-stage">Etapa</label><select class="input" id="pp-stage" data-c="moveStage" data-pid="${p.id}"><option value="">${esc(p.stage)} (atual)</option>${STAGES.filter(s=>s!==p.stage).map(s=>`<option>${esc(s)}</option>`).join('')}</select></div>
      <div class="lbl" style="margin:12px 0 6px">Etiquetas</div><div class="row" style="gap:6px">${TAGS.map(t => `<button class="chip" style="border:1px solid ${p.tags.includes(t)?'var(--accent)':'transparent'};${p.tags.includes(t)?'background:var(--accent-soft);color:var(--accent-ink)':''}" data-a="toggleTag" data-t="${esc(t)}" data-id="${p.id}">${esc(t)}</button>`).join('')}</div>
      <div class="lbl" style="margin:12px 0 6px">Procedimentos de interesse</div><div class="row" style="gap:6px">${p.interests.map(i => `<span class="tag">${esc((svcById(i)||{name:i}).name)}</span>`).join('') || '<span class="muted small">—</span>'}</div></div>
    <div class="card" style="grid-column:1/-1"><div class="field"><label for="pp-notes">Observações administrativas</label><textarea class="input" id="pp-notes" data-c="pNotes" data-id="${p.id}" placeholder="Sem dados clínicos">${esc(p.notes)}</textarea></div></div></div>`;
  if (tab === 'agenda') body = `<div class="card">${ap.length ? `<div class="list">${ap.map(a => `<div class="li"><span class="t">${fmtDate(a.date)}</span><div class="grow">${esc(apptLabel(a))}<div class="muted small">${hm(a.start)} · ${esc(staffById(a.prof).short)}</div></div>${stChip(a.status)}<button class="btn sm" data-a="openAppt" data-id="${a.id}">Abrir</button></div>`).join('')}</div>` : '<div class="empty">Sem agendamentos.</div>'}<div class="row" style="margin-top:12px"><button class="btn primary sm" data-a="newApptFor" data-id="${p.id}">${ic('plus')} Agendar</button></div></div>`;
  if (tab === 'propostas') body = UI.profile === 'recepcao' ? restricted('Propostas são visíveis para a profissional e a administração.') : `<div class="card">${pr.length ? `<div class="list">${pr.map(x => `<div class="li"><span class="t" style="width:auto">${esc(x.num)}</span><div class="grow">${fmtDate(x.date)} · ${brl(propTotal(x))} <span class="muted xs">(valores fictícios)</span></div><span class="chip">${esc(x.status)}</span><button class="btn sm" data-a="openProposal" data-id="${x.id}">Abrir</button></div>`).join('')}</div>` : '<div class="empty">Nenhuma proposta.</div>'}${canClinical() ? `<div class="row" style="margin-top:12px"><button class="btn primary sm" data-a="newProposalFor" data-id="${p.id}">${ic('plus')} Nova proposta</button></div>` : ''}</div>`;
  if (tab === 'avaliacao') body = !canClinical() ? restricted('Área restrita à profissional habilitada. A recepção não acessa informações clínicas.') : evalForm(p);
  if (tab === 'pagamentos') body = !canMoney() && UI.profile !== 'recepcao' ? restricted('Visível para administração e recepção.') : `<div class="card"><p class="muted small" style="margin-bottom:10px">Registros manuais. Aprovação de proposta, contratação, execução e recebimento são eventos distintos.</p>${p.payments.length ? `<div class="list">${p.payments.map(x => `<div class="li"><span class="t" style="width:auto">${fmtWhen(x.at)}</span><div class="grow">${esc(x.desc)} · ${esc(x.method)}</div><b class="tabnum">${brl(x.value)}</b></div>`).join('')}</div>` : '<div class="empty">Nenhum pagamento registrado.</div>'}
    <form class="row" style="margin-top:12px" data-f="addPay" data-id="${p.id}"><input class="input" style="width:140px" type="number" min="0" step="0.01" id="pay-v" placeholder="Valor (R$)" required><input class="input grow" id="pay-d" placeholder="Descrição" required><select class="input" style="width:auto" id="pay-m"><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Outro</option></select><button class="btn primary sm">Registrar</button></form></div>`;
  if (tab === 'historico') body = `<div class="card"><div class="timeline-v">${p.history.map(h => `<div>${esc(h.text)}<small>${fmtWhen(h.at)}</small></div>`).join('')}</div></div>`;
  if (tab === 'documentos') body = `<div class="restricted">${ic('lock')}<h3 style="font-size:22px;margin-top:8px">Documentos clínicos · acesso restrito</h3><p class="muted small" style="max-width:52ch;margin:8px auto 0">Espaço reservado para documentos sob permissão específica da profissional. Prontuário completo, consentimentos e termos não fazem parte do escopo inicial e não são inventados nesta demonstração.</p></div>`;
  if (tab === 'fotos') body = `<div class="restricted">${ic('shield')}<h3 style="font-size:22px;margin-top:8px">Fotos e consentimentos · módulo futuro</h3><p class="muted small" style="max-width:52ch;margin:8px auto 0">Opcional, privado por padrão, com consentimento específico para uso de imagem. Esta demonstração não exibe imagens de antes e depois.</p></div>`;
  return `<div class="page-h"><div><button class="btn sm" data-a="backPatients" style="margin-bottom:10px">${ic('back')} Pacientes</button><span class="eyebrow" style="display:block">Ficha administrativa</span><h1>${esc(p.name)}</h1><p><span class="chip">${esc(p.stage)}</span> · ${esc(p.origin)}</p></div>
    <div class="row"><button class="btn" data-a="newApptFor" data-id="${p.id}">${ic('cal')} Agendar</button>${canClinical() ? `<button class="btn primary" data-a="newProposalFor" data-id="${p.id}">${ic('doc')} Nova proposta</button>` : ''}</div></div>
    <div class="tabs">${tabs.map(([k,l]) => `<button class="${tab===k?'on':''}" data-a="pTab" data-t="${k}">${l}</button>`).join('')}</div>${body}
    <p class="note" style="margin-top:14px">Separação explícita: o histórico comercial (acima) não substitui o registro clínico profissional.</p>`;
}
const restricted = t => `<div class="restricted">${ic('lock')}<p style="margin-top:8px">${t}</p></div>`;
function evalForm(p) {
  const e = p.eval || {};
  return `<form class="card" data-f="saveEval" data-id="${p.id}"><div class="card-h"><div><h3>Avaliação profissional e plano</h3><p class="muted small">Preenchido apenas pela profissional autorizada. Nenhum plano é gerado por IA.</p></div><span class="chip">${ic('lock')} Acesso restrito</span></div>
    <div class="grid2"><div class="field"><label for="ev-date">Data da avaliação</label><input class="input" type="date" id="ev-date" value="${e.date || ymd(new Date())}"></div><div class="field"><label for="ev-valid">Validade da proposta (dias)</label><input class="input" type="number" id="ev-valid" value="${e.valid || 15}"></div></div>
    <div class="field"><label for="ev-goal">Objetivo declarado pela paciente</label><textarea class="input" id="ev-goal">${esc(e.goal || '')}</textarea></div>
    <div class="field"><label for="ev-obs">Observações profissionais (restritas)</label><textarea class="input" id="ev-obs">${esc(e.obs || '')}</textarea></div>
    <div class="field"><label>Tratamentos considerados pela profissional</label><div class="row" style="gap:6px">${S.services.map(s => `<label class="chip" style="cursor:pointer"><input type="checkbox" name="ev-svc" value="${s.id}" ${(e.svcs||[]).includes(s.id)?'checked':''}> ${esc(s.name)}</label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label for="ev-sess">Sessões ou etapas (quando definidas)</label><input class="input" id="ev-sess" value="${esc(e.sess || '')}"></div><div class="field"><label for="ev-next">Próximos passos</label><input class="input" id="ev-next" value="${esc(e.next || '')}"></div></div>
    <div class="note">Isto não substitui prontuário, consentimento informado ou documentação obrigatória.</div>
    <div class="row" style="justify-content:flex-end"><button class="btn" name="only">Salvar avaliação</button><button class="btn primary" name="prop" value="1" data-a="evalToProp">Salvar e montar proposta</button></div></form>`;
}
Object.assign(A, {
  toggleTag: t => { const p = patById(t.dataset.id); const g = t.dataset.t; p.tags.includes(g) ? delTag(p.id, g) : addTag(p.id, g); commit(); },
  newApptFor: t => { apptModal(null, 'novo'); UI.apf.pid = t.dataset.id; const p = patById(t.dataset.id); if (p.interests[0]) UI.apf.svc = p.interests[0]; renderModal(); },
  newProposalFor: t => { const p = patById(t.dataset.id); const pr = createProposal(p.id, { items: p.interests.slice(0,1).map(i => ({ svc:i, name:svcById(i).name, desc:'', qty:1, price:0 })), objective: p.eval && p.eval.goal ? 'Objetivo descrito pela paciente: ' + p.eval.goal : '' }); saveState(); goTo('propostas', pr.id); },
  evalToProp: () => { UI._evalProp = true; },
});
F.saveEval = f => { const p = patById(f.dataset.id); const svcs = [...f.querySelectorAll('[name="ev-svc"]:checked')].map(x => x.value);
  p.eval = { date:$('#ev-date').value, valid:Number($('#ev-valid').value)||15, goal:$('#ev-goal').value, obs:$('#ev-obs').value, svcs, sess:$('#ev-sess').value, next:$('#ev-next').value };
  addHistory(p.id, 'Avaliação profissional registrada (conteúdo restrito)');
  const ap = S.appts.find(a => a.pid === p.id && a.type === 'avaliacao' && a.date === ymd(new Date()) && a.status === 'confirmado'); if (ap) setApptStatus(ap, 'compareceu');
  if (STAGES.indexOf(p.stage) < STAGES.indexOf('Compareceu')) setStage(p.id, 'Compareceu', 'avaliação realizada');
  if (UI._evalProp) { UI._evalProp = false; const pr = createProposal(p.id, { validDays:p.eval.valid, objective: p.eval.goal ? 'Objetivo descrito pela paciente: ' + p.eval.goal : '', items: svcs.map(i => ({ svc:i, name:svcById(i).name, desc:p.eval.sess || '', qty:1, price:0 })) }); saveState(); return goTo('propostas', pr.id); }
  commit('Avaliação salva'); };
F.addPay = f => { const p = patById(f.dataset.id); const v = Number($('#pay-v').value); p.payments.unshift({ at:nowIso(), value:v, desc:$('#pay-d').value, method:$('#pay-m').value }); addHistory(p.id, 'Pagamento registrado manualmente: ' + brl(v)); commit('Pagamento registrado'); };
C.pNotes = t => { const p = patById(t.dataset.id); p.notes = t.value; saveState(); toast('Observações salvas'); };
