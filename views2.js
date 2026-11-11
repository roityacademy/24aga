/* 24AGÁ — propostas A4, tratamentos, lembretes, relatórios, configurações, licenças */
const validUntil = p => ymd(addDays(parseYmd(p.date), Number(p.validDays)||0));
const isExpired = p => parseYmd(validUntil(p)) < sod(new Date()) && !['aceita','não aceita'].includes(p.status);
const visibleProps = () => UI.profile === 'profissional' ? S.proposals.filter(p => p.prof === 'paula') : S.proposals;
const longDate = s => { const d = parseYmd(s); return d.getDate() + ' de ' + MON[d.getMonth()] + ' de ' + d.getFullYear(); };

/* ================= PROPOSTAS ================= */
VIEWS.propostas = () => {
  if (UI.sel.proposal && propById(UI.sel.proposal)) return propEditor(propById(UI.sel.proposal));
  const f = UI.prop.status;
  S.proposals.forEach(p => { if (isExpired(p) && p.status !== 'expirada' && p.status !== 'rascunho') { p.status = 'expirada'; p.history.unshift({ at:nowIso(), text:'Expirada automaticamente' }); } });
  const list = visibleProps().filter(p => f === 'all' || p.status === f);
  return `
  <div class="page-h"><div><span class="eyebrow">Propostas personalizadas</span><h1>Propostas</h1><p>Aprovação comercial, contratação, execução e recebimento são eventos separados. Aceitar uma proposta não registra pagamento.</p></div>
    <button class="btn primary" data-a="newProposal">${ic('plus')} Nova proposta</button></div>
  <div class="filters"><select class="input" style="width:auto" data-c="propFilter" aria-label="Status"><option value="all">Todos os status (${visibleProps().length})</option>${PROP_STATUS.map(s => `<option value="${s}" ${f===s?'selected':''}>${s} (${visibleProps().filter(p=>p.status===s).length})</option>`).join('')}</select></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Número</th><th>Paciente</th><th>Data</th><th>Valor</th><th>Responsável</th><th>Validade</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(p => `<tr><td class="tabnum">${esc(p.num)}</td><td><b style="font-weight:500">${esc(patById(p.pid) ? patById(p.pid).name : '—')}</b></td><td class="tabnum">${fmtDate(p.date)}</td><td class="tabnum">${brl(propTotal(p))}${p.fict ? ' <span class="tag">fictício</span>' : ''}</td><td>${esc(staffById(p.prof).short)}</td><td class="tabnum ${isExpired(p)?'':'muted'}">${fmtDate(validUntil(p))}</td><td><span class="chip ${p.status==='aceita'?'st-confirmado':p.status==='não aceita'||p.status==='expirada'?'st-cancelado':p.status==='rascunho'?'':'st-reservado'}">${esc(p.status)}</span></td>
      <td><div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-a="openProposal" data-id="${p.id}">Abrir</button><button class="btn sm" data-a="dupProposal" data-id="${p.id}">Duplicar</button></div></td></tr>`).join('') || '<tr><td colspan="8" class="empty">Nenhuma proposta neste filtro.</td></tr>'}
  </tbody></table></div>`;
};
function a4Html(p) {
  const pat = patById(p.pid) || { name:'—' };
  const sub = p.items.reduce((t, i) => t + (Number(i.qty)||0) * (Number(i.price)||0), 0);
  const pro = staffById(p.prof);
  const contacts = [S.settings.address, S.settings.phone, S.settings.whatsapp && 'WhatsApp ' + S.settings.whatsapp].filter(Boolean).join(' · ') || 'Endereço e contatos a preencher pela clínica';
  return `<div class="a4 ${p.layout}">
    <div class="ah"><div class="cmark"><b>${esc(S.settings.clinic)}</b><span>${esc(S.settings.slogan)}</span></div>${p.layout === 'clinical' ? `<div style="text-align:right;font-size:9pt;color:#5B6678;line-height:1.6">Proposta nº <b style="color:#111">${esc(p.num)}</b><br>${esc(S.settings.city)}, ${longDate(p.date)}</div>` : ''}</div>
    <div class="gl"></div>
    <h2>Proposta Personalizada de Tratamento</h2>
    ${p.layout !== 'clinical' ? `<div class="meta"><span>Nº ${esc(p.num)}</span><span>${esc(S.settings.city)}, ${longDate(p.date)}</span></div>` : ''}
    <div class="for"><small>Preparada para</small><b>${esc(pat.name)}</b></div>
    ${p.msg ? `<p class="msg-p">${esc(p.msg)}</p>` : ''}
    ${p.lumini && S.lumini.show ? `<h5>${esc(S.lumini.name)}</h5><p class="t">${esc(S.lumini.concept)}</p>` : ''}
    ${p.objective ? `<h5>Objetivo estético</h5><p class="t">${esc(p.objective)}</p>` : ''}
    <h5>Plano proposto</h5>
    <table><thead><tr><th>Procedimento / etapa</th><th class="r">Qtd.</th><th class="r">Valor unit.</th><th class="r">Subtotal</th></tr></thead><tbody>
      ${p.items.length ? p.items.map(i => `<tr><td>${esc(i.name)}${i.desc ? `<small>${esc(i.desc)}</small>` : ''}</td><td class="r">${esc(i.qty)}</td><td class="r">${brl(i.price)}</td><td class="r">${brl((Number(i.qty)||0)*(Number(i.price)||0))}</td></tr>`).join('') : '<tr><td colspan="4" style="color:#8a8378">Adicione os itens definidos na avaliação.</td></tr>'}
      ${Number(p.discount) ? `<tr class="tot"><td colspan="3" class="r">Subtotal</td><td class="r">${brl(sub)}</td></tr><tr class="tot"><td colspan="3" class="r">Desconto autorizado</td><td class="r">− ${brl(p.discount)}</td></tr>` : ''}
      <tr class="tot"><td colspan="3" class="r" style="font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:#5B6678">Investimento total${p.fict ? '<span class="fic">valores fictícios</span>' : ''}</td><td class="r big">${brl(propTotal(p))}</td></tr>
    </tbody></table>
    <div class="two">
      <div><h5>Condições e pagamento</h5><p class="t">${esc(p.payment || 'A definir.')}</p><h5>Validade</h5><p class="t">Proposta válida até ${fmtDate(validUntil(p))}/${parseYmd(validUntil(p)).getFullYear()} (${esc(p.validDays)} dias).</p></div>
      <div>${p.notes ? `<h5>Observações e cuidados</h5><p class="t">${esc(p.notes)}</p>` : ''}${p.terms ? `<h5>Ciência</h5><p class="t">Estou ciente de que os resultados variam de pessoa para pessoa e de que o plano pode ser ajustado pela profissional ao longo do tratamento.</p>` : ''}</div>
    </div>
    <div class="sign"><div class="ln">${esc(pat.name)}<br><span style="color:#5B6678;font-size:8pt">Paciente</span></div><div class="ln">${esc(pro.name)}<br><span style="color:#5B6678;font-size:8pt">${pro.title ? esc(pro.title) : 'Profissional'} · Registro profissional: ${esc(pro.reg || '______________')}</span></div></div>
    <div class="foot">${esc(S.settings.clinic)} · ${esc(S.settings.slogan)}<br>${esc(contacts)}</div>
  </div>`;
}
function propEditor(p) {
  const ro = UI.profile === 'recepcao';
  return `
  <div class="page-h"><div><button class="btn sm" data-a="backProps" style="margin-bottom:10px">${ic('back')} Propostas</button><span class="eyebrow" style="display:block">Editor de proposta · ${esc(p.num)}</span><h1>${esc(patById(p.pid).name)}</h1></div>
    <div class="row"><button class="btn" data-a="printProp">${ic('doc')} Gerar PDF</button><button class="btn" data-a="printProp">${ic('print')} Imprimir</button><button class="btn" data-a="saveDraft">Salvar rascunho</button><button class="btn primary" data-a="sendProp">${ic('send')} Enviar proposta (simulado)</button></div></div>
  <div class="ped">
    <div class="form card">
      <div class="grid2"><div class="field"><label for="pe-status">Alterar status</label><select class="input" id="pe-status" data-c="propStatus">${PROP_STATUS.map(s => `<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Estilo do documento</label><div class="seg"><button class="${p.layout==='elegance'?'on':''}" data-a="propLayout" data-v="elegance">Elegance</button><button class="${p.layout==='clinical'?'on':''}" data-a="propLayout" data-v="clinical">Clinical</button></div></div></div>
      <div class="grid2"><div class="field"><label for="pe-pid">Paciente</label><select class="input" id="pe-pid" data-c="pe" data-k="pid">${visiblePatients().map(x => `<option value="${x.id}" ${p.pid===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="pe-prof">Profissional responsável</label><select class="input" id="pe-prof" data-c="pe" data-k="prof">${S.staff.filter(s=>s.id!=='camila').map(s => `<option value="${s.id}" ${p.prof===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="pe-date">Data</label><input class="input" type="date" id="pe-date" value="${p.date}" data-c="pe" data-k="date"></div>
        <div class="field"><label for="pe-valid">Validade (dias)</label><input class="input" type="number" min="1" id="pe-valid" value="${p.validDays}" data-i="pe" data-k="validDays"></div></div>
      <div class="field"><label for="pe-msg">Mensagem acolhedora</label><textarea class="input" id="pe-msg" data-i="pe" data-k="msg">${esc(p.msg)}</textarea></div>
      <div class="field"><label for="pe-obj">Objetivo estético (descrito pela profissional, sem promessas)</label><textarea class="input" id="pe-obj" data-i="pe" data-k="objective">${esc(p.objective)}</textarea></div>
      <div class="row between" style="border:1px solid var(--line);border-radius:var(--r-sm);padding:10px 12px"><div><div>Incluir ${esc(S.lumini.name)}</div><div class="muted xs">Aparece só quando a profissional escolher</div></div><button class="switch ${p.lumini?'on':''}" data-a="propLumini" aria-label="Incluir Método Lumini"></button></div>
      <div><div class="row between" style="margin-bottom:8px"><span class="lbl">Procedimentos / etapas · qtd · valor (R$)</span><button class="btn sm" data-a="addItem">${ic('plus')} Item</button></div>
        <div class="items-ed">${p.items.map((it, i) => `<div><div class="item-ed"><select class="input" data-c="pei" data-idx="${i}" data-k="svc" aria-label="Procedimento">${S.services.map(s => `<option value="${s.id}" ${it.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><input class="input" type="number" min="1" value="${it.qty}" data-i="pei" data-idx="${i}" data-k="qty" aria-label="Quantidade"><input class="input" type="number" min="0" step="10" value="${it.price}" data-i="pei" data-idx="${i}" data-k="price" aria-label="Valor"><button class="x" data-a="delItem" data-idx="${i}" aria-label="Remover item">×</button></div>
          <input class="input" style="margin-top:4px;font-size:12.5px;padding:6px 8px" placeholder="Descrição da etapa (opcional)" value="${esc(it.desc)}" data-i="pei" data-idx="${i}" data-k="desc"></div>`).join('') || '<div class="muted small">Nenhum item. Os procedimentos são escolhidos pela profissional.</div>'}</div></div>
      <div class="grid2"><div class="field"><label for="pe-disc">Desconto autorizado (R$)</label><input class="input" type="number" min="0" step="10" id="pe-disc" value="${p.discount}" data-i="pe" data-k="discount"></div>
        <div class="field"><label>Total</label><div style="font-family:var(--f-display);font-size:28px;font-weight:600" id="pe-total" class="tabnum">${brl(propTotal(p))}</div></div></div>
      <label class="row small"><input type="checkbox" ${p.fict?'checked':''} data-c="peChk" data-k="fict"> Marcar valores como fictícios (demonstração)</label>
      <div class="field"><label for="pe-pay">Condições e meios de pagamento</label><textarea class="input" id="pe-pay" data-i="pe" data-k="payment">${esc(p.payment)}</textarea></div>
      <div class="field"><label for="pe-notes">Observações e cuidados gerais</label><textarea class="input" id="pe-notes" data-i="pe" data-k="notes">${esc(p.notes)}</textarea></div>
      <label class="row small"><input type="checkbox" ${p.terms?'checked':''} data-c="peChk" data-k="terms"> Incluir termo de ciência de que resultados variam (aprovado pela profissional)</label>
      <div class="field"><label for="pe-reg">Registro profissional (preenchido pela profissional)</label><input class="input" id="pe-reg" placeholder="Não preenchido" value="${esc(staffById(p.prof).reg || '')}" data-c="peReg"></div>
      <details><summary class="small muted" style="cursor:pointer">Histórico da proposta</summary><div class="timeline-v" style="margin-top:10px">${p.history.map(h => `<div>${esc(h.text)}<small>${fmtWhen(h.at)}</small></div>`).join('')}</div></details>
      <div class="row"><button class="btn sm" data-a="dupProposal" data-id="${p.id}">Duplicar</button><button class="btn sm" data-a="propReminder">Programar lembrete</button><button class="btn sm" data-a="propDelivered">Registrar entrega manual</button></div>
      ${ro ? '<div class="note">Perfil de recepção: visualização apenas.</div>' : ''}
    </div>
    <div class="preview-wrap"><div class="row between" style="margin-bottom:10px"><span class="lbl">Prévia de impressão · A4</span><button class="btn sm" data-a="fullPreview">${ic('eye')} Tela cheia</button></div><div id="a4-host" class="a4-scale">${a4Html(p)}</div></div>
  </div>`;
}
function fitA4() { const host = $('#a4-host'); if (!host) return; const a4 = host.querySelector('.a4'); const wrap = host.parentElement; const avail = wrap.clientWidth - 24; const w = a4.offsetWidth; const s = Math.min(1, avail / w); a4.style.transform = `scale(${s})`; host.style.width = (w * s) + 'px'; host.style.height = (a4.offsetHeight * s) + 'px'; }
AFTER.propostas = () => { fitA4(); };
addEventListener('resize', () => { if (UI.route === 'propostas') fitA4(); });
let _saveT; const saveSoon = () => { clearTimeout(_saveT); _saveT = setTimeout(saveState, 400); };
function refreshPreview() { const p = propById(UI.sel.proposal); if (!p) return; $('#a4-host').innerHTML = a4Html(p); const t = $('#pe-total'); if (t) t.textContent = brl(propTotal(p)); fitA4(); saveSoon(); }
I.pe = t => { const p = propById(UI.sel.proposal); const k = t.dataset.k; p[k] = ['validDays','discount'].includes(k) ? Number(t.value) || 0 : t.value; refreshPreview(); };
I.pei = t => { const p = propById(UI.sel.proposal); const it = p.items[Number(t.dataset.idx)]; const k = t.dataset.k; it[k] = ['qty','price'].includes(k) ? Number(t.value) || 0 : t.value; refreshPreview(); };
Object.assign(C, {
  propFilter: t => { UI.prop.status = t.value; render(); },
  pe: t => { const p = propById(UI.sel.proposal); p[t.dataset.k] = t.value; refreshPreview(); },
  pei: t => { const p = propById(UI.sel.proposal); const it = p.items[Number(t.dataset.idx)]; it.svc = t.value; it.name = svcById(t.value).name; refreshPreview(); },
  peChk: t => { const p = propById(UI.sel.proposal); p[t.dataset.k] = t.checked; refreshPreview(); },
  peReg: t => { const p = propById(UI.sel.proposal); staffById(p.prof).reg = t.value; refreshPreview(); },
  propStatus: t => { const p = propById(UI.sel.proposal); setPropStatus(p, t.value); commit('Status: ' + t.value + (t.value === 'aceita' ? ' · nenhum pagamento foi registrado automaticamente' : '')); },
});
Object.assign(A, {
  openProposal: t => { closeModal(); if (UI.route !== 'propostas') return goTo('propostas', t.dataset.id); UI.sel.proposal = t.dataset.id; render(); scrollTo(0,0); },
  backProps: () => { UI.sel.proposal = null; render(); },
  newProposal: () => openModal(`${mHead('Nova proposta','Somente após a avaliação profissional.')}<div class="mb"><div class="field"><label for="np-pat">Paciente</label><select class="input" id="np-pat">${visiblePatients().map(p => `<option value="${p.id}">${esc(p.name)} · ${esc(p.stage)}</option>`).join('')}</select></div></div><div class="mf"><button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="createProp">Criar proposta</button></div>`),
  createProp: () => { const pid = $('#np-pat').value; const p = patById(pid); const pr = createProposal(pid, { items:(p.interests.length ? p.interests.slice(0,1) : ['botox']).map(i => ({ svc:i, name:svcById(i).name, desc:'', qty:1, price:0 })) }); closeModal(); UI.sel.proposal = pr.id; commit('Proposta criada no histórico da paciente e no funil'); },
  dupProposal: t => { const o = propById(t.dataset.id); const pr = createProposal(o.pid, JSON.parse(JSON.stringify({ items:o.items, msg:o.msg, objective:o.objective, discount:o.discount, payment:o.payment, notes:o.notes, terms:o.terms, layout:o.layout, lumini:o.lumini, prof:o.prof, validDays:o.validDays, fict:o.fict }))); UI.sel.proposal = pr.id; commit('Proposta duplicada como rascunho'); },
  propLayout: t => { const p = propById(UI.sel.proposal); p.layout = t.dataset.v; commit(); },
  propLumini: () => { const p = propById(UI.sel.proposal); p.lumini = !p.lumini; commit(); },
  addItem: () => { const p = propById(UI.sel.proposal); p.items.push({ svc:'botox', name:svcById('botox').name, desc:'', qty:1, price:0 }); commit(); },
  delItem: t => { const p = propById(UI.sel.proposal); p.items.splice(Number(t.dataset.idx), 1); commit(); },
  saveDraft: () => { const p = propById(UI.sel.proposal); p.history.unshift({ at:nowIso(), text:'Rascunho salvo' }); commit('Rascunho salvo'); },
  sendProp: () => { const p = propById(UI.sel.proposal); setPropStatus(p, 'aguardando retorno'); const c = S.conversations.find(c => c.pid === p.pid); if (c) c.msgs.push({ from:'humano', text:`Olá! Segue sua proposta personalizada ${p.num}. (Envio simulado — o envio real depende da integração.)`, at:nowIso() }); commit('Proposta marcada como enviada (simulado) · funil atualizado'); },
  propDelivered: () => { const p = propById(UI.sel.proposal); setPropStatus(p, 'entregue'); commit('Entrega manual registrada'); },
  propReminder: () => { const p = propById(UI.sel.proposal); S.tasks.unshift({ id:uid('t'), text:`Retornar ${patById(p.pid).name} sobre a proposta ${p.num}`, who:'camila', due:ymd(addDays(new Date(), 5)), done:false }); commit('Lembrete criado para daqui a 5 dias'); },
  fullPreview: () => { const p = propById(UI.sel.proposal); openModal(`${mHead('Versão para impressão', esc(p.num))}<div class="mb" style="background:var(--surface-2);overflow:auto"><div style="width:max-content;margin:0 auto">${a4Html(p)}</div></div>`, true); },
  printProp: () => {
    const p = propById(UI.sel.proposal);
    let pr = $('#print-root'); if (!pr) { pr = document.createElement('div'); pr.id = 'print-root'; document.body.appendChild(pr); }
    pr.innerHTML = a4Html(p);
    p.history.unshift({ at:nowIso(), text:'Versão de impressão gerada' }); saveState();
    try { window.print(); } catch (e) {}
    setTimeout(() => openModal(`${mHead('Imprimir ou salvar em PDF')}<div class="mb"><p>Se a janela de impressão abriu, escolha a impressora ou <b>Salvar como PDF</b>. A folha sai em A4, sem botões, com margens corretas.</p><div class="note">Se nada abriu, é porque este link de apresentação bloqueia a impressão por segurança. No sistema instalado, os botões <b>Gerar PDF</b> e <b>Imprimir</b> abrem o fluxo normal do navegador. Você pode ver a folha inteira em <b>Tela cheia</b>.</div></div><div class="mf"><button class="btn" data-a="closeModal">Fechar</button><button class="btn primary" data-a="fullPreview">Ver em tela cheia</button></div>`), 400);
  },
});

/* ================= TRATAMENTOS ================= */
VIEWS.servicos = () => {
  const edit = UI.profile === 'admin';
  return `
  <div class="page-h"><div><span class="eyebrow">Catálogo</span><h1>Tratamentos</h1><p>Durações e valores são editáveis e nenhum preço vem preenchido. Descrições informativas devem ser revisadas pela profissional.</p></div>
    ${edit ? `<button class="btn primary" data-a="editSvc" data-id="">${ic('plus')} Novo tratamento</button>` : ''}</div>
  <div class="grid2" style="margin-bottom:16px">
    <div class="card"><div class="card-h"><h3>Valor da avaliação</h3><span class="chip">separado do procedimento</span></div><div class="field"><label for="sv-eval">Valor ou política da consulta de avaliação</label><input class="input" id="sv-eval" placeholder="Em branco · definido pela clínica" value="${esc(S.settings.evalPrice)}" data-c="setField" data-k="evalPrice" ${edit?'':'disabled'}></div><p class="muted xs" style="margin-top:6px">A assistente só informa este valor se estiver preenchido.</p></div>
    <div class="card"><div class="card-h"><h3>${esc(S.lumini.name)}</h3><span class="chip">posicionamento de marca</span></div>
      ${edit ? `<div class="stack"><div class="field"><label for="lu-name">Nome</label><input class="input" id="lu-name" value="${esc(S.lumini.name)}" data-c="lumi" data-k="name"></div><div class="field"><label for="lu-c">Conceito e descrição</label><textarea class="input" id="lu-c" data-c="lumi" data-k="concept">${esc(S.lumini.concept)}</textarea></div><div class="field"><label for="lu-cr">Critérios de agendamento</label><input class="input" id="lu-cr" value="${esc(S.lumini.criteria)}" data-c="lumi" data-k="criteria"></div><label class="row small"><input type="checkbox" ${S.lumini.show?'checked':''} data-c="lumiShow"> Disponível para propostas e para a assistente</label></div>` : `<p class="small">${esc(S.lumini.concept)}</p>`}
      <p class="muted xs" style="margin-top:8px">Sugestão editorial para revisão. Não é apresentado como técnica clínica certificada.</p></div>
  </div>
  <div class="svc-grid">${S.services.map(s => `<div class="svc ${s.active?'':'off'}"><div class="row between"><span class="eyebrow">${esc(s.cat)}</span><span class="chip ${s.active?'st-confirmado':''}">${s.active?'Ativo':'Inativo'}</span></div><h4>${esc(s.name)}</h4><p>${esc(s.desc)}</p>
    <div class="meta"><span class="tag">${s.dur} min</span><span class="tag">intervalo ${s.gap} min</span><span class="tag">${s.price ? esc(s.price) : 'valor: a definir'}</span></div>
    <div class="muted xs">Habilitadas: ${s.prof.map(x => esc(staffById(x).short)).join(', ')}</div>
    ${edit ? `<div class="row" style="margin-top:auto"><button class="btn sm" data-a="editSvc" data-id="${s.id}">Editar</button><button class="btn sm" data-a="toggleSvc" data-id="${s.id}">${s.active?'Desativar':'Ativar'}</button></div>` : ''}</div>`).join('')}</div>
  <p class="note" style="margin-top:16px">A assistente lê apenas o texto “para a assistente” de cada tratamento, nunca campos restritos. Indicação, contraindicações, quantidades e condutas são sempre decisão da profissional após avaliação.</p>`;
};
Object.assign(A, {
  toggleSvc: t => { const s = svcById(t.dataset.id); s.active = !s.active; commit(s.active ? 'Tratamento ativado' : 'Tratamento desativado'); },
  editSvc: t => { const s = t.dataset.id ? svcById(t.dataset.id) : { id:'', name:'', cat:'', dur:60, gap:10, price:'', prof:['grazi'], active:true, desc:'', ai:'', guide:'' };
    openModal(`${mHead(s.id ? 'Editar tratamento' : 'Novo tratamento')}<form class="mb" data-f="saveSvc" data-id="${s.id}">
      <div class="grid2"><div class="field"><label for="sv-n">Nome *</label><input class="input" id="sv-n" required value="${esc(s.name)}"></div><div class="field"><label for="sv-c">Categoria</label><input class="input" id="sv-c" value="${esc(s.cat)}"></div>
      <div class="field"><label for="sv-d">Duração estimada (min)</label><input class="input" type="number" min="10" step="5" id="sv-d" value="${s.dur}"></div><div class="field"><label for="sv-g">Intervalo de agenda (min)</label><input class="input" type="number" min="0" step="5" id="sv-g" value="${s.gap}"></div>
      <div class="field"><label for="sv-p">Preço ou faixa</label><input class="input" id="sv-p" placeholder="Em branco" value="${esc(s.price)}"></div><div class="field"><label>Profissionais habilitadas</label><div class="row">${S.staff.filter(x=>x.id!=='camila').map(x => `<label class="row small"><input type="checkbox" name="sv-prof" value="${x.id}" ${s.prof.includes(x.id)?'checked':''}> ${esc(x.short)}</label>`).join('')}</div></div></div>
      <div class="field"><label for="sv-desc">Descrição informativa (revisável)</label><textarea class="input" id="sv-desc">${esc(s.desc)}</textarea></div>
      <div class="field"><label for="sv-ai">Texto para a assistente</label><textarea class="input" id="sv-ai">${esc(s.ai)}</textarea></div>
      <div class="field"><label for="sv-gd">Orientações revisadas pela profissional</label><textarea class="input" id="sv-gd">${esc(s.guide)}</textarea></div>
      <div class="field"><label>Imagem autorizada (opcional)</label><input class="input" type="file" accept="image/*" disabled><span class="muted xs">Disponível na versão real, apenas com autorização de uso.</span></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-a="closeModal">Cancelar</button><button class="btn primary">Salvar</button></div></form>`); },
});
F.saveSvc = f => { const id = f.dataset.id; const data = { name:$('#sv-n').value.trim(), cat:$('#sv-c').value.trim() || 'Outros', dur:Number($('#sv-d').value)||60, gap:Number($('#sv-g').value)||0, price:$('#sv-p').value.trim(), prof:[...f.querySelectorAll('[name="sv-prof"]:checked')].map(x => x.value), desc:$('#sv-desc').value, ai:$('#sv-ai').value, guide:$('#sv-gd').value };
  if (!data.prof.length) data.prof = ['grazi'];
  if (id) Object.assign(svcById(id), data); else S.services.push(Object.assign({ id:uid('s'), active:true }, data));
  closeModal(); commit('Tratamento salvo · agenda e assistente atualizadas'); };
Object.assign(C, { lumi: t => { S.lumini[t.dataset.k] = t.value; saveState(); toast('Salvo'); }, lumiShow: t => { S.lumini.show = t.checked; commit(); } });

/* ================= LEMBRETES E RETORNOS ================= */
VIEWS.automacoes = () => `
  <div class="page-h"><div><span class="eyebrow">Confirmações, lembretes e retornos</span><h1>Lembretes e retornos</h1><p>Variáveis disponíveis: {nome}, {data}, {hora}. Mensagens externas só são enviadas após integração, autorização e políticas aplicáveis.</p></div></div>
  <div class="stack">${S.automations.map(a => `<div class="card"><div class="row between"><div class="grow"><h3 style="font-size:21px">${esc(a.name)}</h3><div class="muted small">${esc(a.when)}</div></div><button class="switch ${a.on?'on':''}" data-a="autoToggle" data-id="${a.id}" aria-label="Ativar ${esc(a.name)}"></button></div>
    <div class="grid2" style="margin-top:12px;grid-template-columns:220px minmax(0,1fr)"><div class="field"><label for="au-w-${a.id}">Quando executar</label><select class="input" id="au-w-${a.id}" data-c="autoWhen" data-id="${a.id}">${['Logo após o agendamento','2 horas antes','24 horas antes','48 horas antes','Quando o horário é alterado','2 dias após a visita','5 dias após a entrega','Quando definido pela profissional'].map(o => `<option ${a.when===o?'selected':''}>${o}</option>`).join('')}</select></div>
    <div class="field"><label for="au-t-${a.id}">Texto</label><textarea class="input" id="au-t-${a.id}" data-c="autoText" data-id="${a.id}">${esc(a.text)}</textarea></div></div>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-a="autoSim" data-id="${a.id}">${ic('play')} Simular disparo</button><span class="muted xs">Adiciona a mensagem na conversa da próxima paciente, apenas nesta demonstração.</span></div></div>`).join('')}</div>
  <div class="warnbox">Publicidade e remarketing de saúde não são disparados automaticamente. Campanhas exigem consentimento, avaliação da base legal e das regras profissionais e das plataformas.</div>`;
Object.assign(A, {
  autoToggle: t => { const a = S.automations.find(x => x.id === t.dataset.id); a.on = !a.on; commit(a.on ? 'Ativado' : 'Desativado'); },
  autoSim: t => { const au = S.automations.find(x => x.id === t.dataset.id);
    const ap = S.appts.filter(a => a.pid && activeAppt(a) && parseYmd(a.date) >= sod(new Date())).sort((a,b) => (a.date+hm(a.start)).localeCompare(b.date+hm(b.start)))[0];
    if (!ap) return toast('Nenhum agendamento futuro para simular');
    const p = patById(ap.pid); const txt = au.text.replace(/\{nome\}/g, p.name.split(' ')[0]).replace(/\{data\}/g, fmtDate(ap.date)).replace(/\{hora\}/g, hm(ap.start));
    let c = S.conversations.find(c => c.pid === p.id); if (!c) { c = { id:uid('c'), pid:p.id, state:'ia', unread:0, ctx:{ nameOk:true }, msgs:[] }; S.conversations.unshift(c); }
    c.msgs.push({ from:'sistema', text:'Automação: ' + au.name + ' (simulada)', at:nowIso() }, { from:'ia', text:txt, at:nowIso() });
    addHistory(p.id, 'Automação simulada: ' + au.name);
    commit('Mensagem simulada adicionada à conversa de ' + p.name); },
});
Object.assign(C, { autoWhen: t => { S.automations.find(x => x.id === t.dataset.id).when = t.value; saveState(); toast('Salvo'); }, autoText: t => { S.automations.find(x => x.id === t.dataset.id).text = t.value; saveState(); toast('Texto salvo'); } });

/* ================= RELATÓRIOS ================= */
VIEWS.relatorios = () => {
  const f = UI.rep; const range = f.period === 'tri' ? [addDays(sod(new Date()), -90), addDays(sod(new Date()), 30)] : periodRange(f.period);
  let ap = S.appts.filter(a => a.type !== 'bloqueio' && inRange(a.date, range));
  if (f.prof !== 'all') ap = ap.filter(a => a.prof === f.prof); if (f.svc !== 'all') ap = ap.filter(a => a.svc === f.svc); if (f.status && f.status !== 'all') ap = ap.filter(a => a.status === f.status);
  const past = ap.filter(a => parseYmd(a.date) < sod(new Date()) || a.status === 'compareceu');
  const act = ap.filter(activeAppt);
  const confRate = act.length ? Math.round(act.filter(a => ['confirmado','compareceu','concluido'].includes(a.status)).length / act.length * 100) : 0;
  const pastDone = past.filter(a => ['compareceu','concluido','falta'].includes(a.status));
  const showRate = pastDone.length ? Math.round(pastDone.filter(a => a.status !== 'falta').length / pastDone.length * 100) : 0;
  const mon = mondayOf(new Date());
  const weeks = Array.from({ length:8 }, (_, i) => { const s = addDays(mon, (i-5)*7); return [pad2(s.getDate()) + '/' + pad2(s.getMonth()+1), S.appts.filter(a => a.type !== 'bloqueio' && activeAppt(a) && (f.prof==='all'||a.prof===f.prof) && (f.svc==='all'||a.svc===f.svc) && inRange(a.date, [s, addDays(s, 6)])).length]; });
  const hours = [9,10,11,13,14,15,16,17,18].map(h => [h + 'h', act.filter(a => Math.floor(a.start/60) === h).length]);
  const reasons = {}; ap.filter(a => a.status === 'cancelado').forEach(a => { const r = (a.cancelReason || 'Não informado').replace(/^Recusado:.*/, 'Recusado pela clínica'); reasons[r] = (reasons[r]||0) + 1; });
  const props = S.proposals.filter(p => inRange(p.date, range) && (f.prof==='all'||p.prof===f.prof));
  const accepted = S.proposals.filter(p => p.status === 'aceita');
  const revenue = S.patients.flatMap(p => p.payments).filter(x => isoInRange(x.at, range)).reduce((t, x) => t + (Number(x.value)||0), 0);
  const forecast = accepted.reduce((t, p) => t + propTotal(p), 0);
  let avail = 0, booked = 0; for (let d = new Date(range[0]); d <= range[1]; d = addDays(d, 1)) { const w = dayWindow(ymd(d)); if (w) { avail += (w[1]-w[0]) - (d.getDay() !== 6 ? S.settings.lunch[1]-S.settings.lunch[0] : 0); } }
  booked = act.reduce((t, a) => t + a.dur, 0) + S.appts.filter(a => a.type === 'bloqueio' && inRange(a.date, range)).reduce((t, a) => t + a.dur, 0);
  const profs = Math.max(1, f.prof === 'all' ? 2 : 1); const occ = avail ? Math.min(100, Math.round(booked / (avail * profs) * 100)) : 0;
  const frt = S.conversations.map(c => { const i = c.msgs.findIndex(m => m.from === 'paciente'); const r = c.msgs.slice(i+1).find(m => m.from === 'ia' || m.from === 'humano'); return i >= 0 && r ? (new Date(r.at) - new Date(c.msgs[i].at)) / 60000 : null; }).filter(x => x != null);
  const frtAvg = frt.length ? Math.max(0, Math.round(frt.reduce((a,b)=>a+b,0) / frt.length)) : null;
  return `
  <div class="page-h"><div><span class="eyebrow">Relatórios e gestão</span><h1>Relatórios</h1><p>Dados fictícios ou lançados durante a demonstração. Sem indicadores clínicos.</p></div></div>
  <div class="filters"><div class="seg">${[['semana','Semana'],['mes','Mês'],['tri','Trimestre'],['tudo','Tudo']].map(([k,l]) => `<button class="${f.period===k?'on':''}" data-a="repPeriod" data-v="${k}">${l}</button>`).join('')}</div>
    <select class="input" style="width:auto" data-c="repF" data-k="prof" aria-label="Profissional"><option value="all">Todas as profissionais</option>${S.staff.filter(s=>s.id!=='camila').map(s=>`<option value="${s.id}" ${f.prof===s.id?'selected':''}>${esc(s.short)}</option>`).join('')}</select>
    <select class="input" style="width:auto" data-c="repF" data-k="svc" aria-label="Serviço"><option value="all">Todos os serviços</option>${S.services.map(s=>`<option value="${s.id}" ${f.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
    <select class="input" style="width:auto" data-c="repF" data-k="status" aria-label="Status"><option value="all">Todos os status</option>${APPT_STATUS.map(s=>`<option value="${s}" ${f.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join('')}</select></div>
  <div class="kpis">
    <div class="kpi"><span class="l">Agendamentos no período</span><span class="v">${act.length}</span></div>
    <div class="kpi"><span class="l">Taxa de confirmação</span><span class="v">${confRate}%</span><span class="s">confirmados entre os ativos</span></div>
    <div class="kpi"><span class="l">Taxa de comparecimento</span><span class="v">${showRate}%</span><span class="s">${pastDone.filter(a=>a.status==='falta').length} falta(s)</span></div>
    <div class="kpi"><span class="l">Agenda ocupada</span><span class="v">${occ}%</span><span class="s">${100-occ}% disponível</span></div>
    <div class="kpi"><span class="l">Primeira resposta</span><span class="v">${frtAvg == null ? '—' : frtAvg < 1 ? '< 1 min' : frtAvg + ' min'}</span><span class="s">média das conversas</span></div>
    <div class="kpi"><span class="l">Receita registrada</span><span class="v" style="font-size:28px">${brl(revenue)}</span><span class="s">lançamentos manuais</span></div>
    <div class="kpi"><span class="l">Propostas aceitas (previsão)</span><span class="v" style="font-size:28px">${brl(forecast)}</span><span class="s">não é recebimento · valores fictícios</span></div>
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-h"><h3>Agendamentos por semana</h3><span class="muted xs">5 semanas anteriores, atual e 2 próximas</span></div>${vbars(weeks, i => i > 5)}</div>
    <div class="card"><div class="card-h"><h3>Horários mais procurados</h3></div>${vbars(hours)}</div>
    <div class="card"><div class="card-h"><h3>Procedimentos com mais pedidos de informação</h3></div>${bars(S.services.map(s => [s.name, S.patients.filter(p => p.interests.includes(s.id)).length]).sort((a,b)=>b[1]-a[1]))}</div>
    <div class="card"><div class="card-h"><h3>Contatos por origem</h3></div>${bars(ORIGINS.map(o => [o.replace(' (tráfego pago)',' (pago)'), S.patients.filter(p => p.origin === o).length]).sort((a,b)=>b[1]-a[1]))}</div>
    <div class="card"><div class="card-h"><h3>Propostas no período</h3></div>${bars([['Emitidas', props.length],['Aceitas', props.filter(p=>p.status==='aceita').length],['Pendentes', props.filter(p=>['entregue','aguardando retorno','pronta para revisão'].includes(p.status)).length],['Não aceitas', props.filter(p=>p.status==='não aceita').length],['Expiradas', props.filter(p=>p.status==='expirada').length]])}</div>
    <div class="card"><div class="card-h"><h3>Motivos de cancelamento</h3><span class="muted xs">quando informados</span></div>${Object.keys(reasons).length ? bars(Object.entries(reasons)) : '<div class="empty">Nenhum cancelamento no período.</div>'}</div>
  </div>
  <p class="note" style="margin-top:16px">Comparações entre clínicas (no módulo de licenças) nunca exibem resultados clínicos, indicadores de saúde ou dados de pacientes.</p>`;
};
A.repPeriod = t => { UI.rep.period = t.dataset.v; render(); };
C.repF = t => { UI.rep[t.dataset.k] = t.value; render(); };

/* ================= CONFIGURAÇÕES ================= */
VIEWS.configuracoes = () => {
  const s = S.settings; const days = [1,2,3,4,5,6,0];
  const perm = [['Painel','✓','✓','✓'],['Agenda','✓','✓','própria'],['Atendimento','✓','✓','—'],['Pacientes (administrativo)','✓','✓','autorizadas'],['Avaliação e dados clínicos','✓','—','✓'],['Propostas','✓','—','próprias'],['Receita e pagamentos','✓','registro','—'],['Configurações','✓','—','—']];
  return `
  <div class="page-h"><div><span class="eyebrow">Configurações da clínica</span><h1>Configurações</h1><p>As alterações aqui mudam a interface da demonstração na hora.</p></div></div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h3>Identidade</h3></div><div class="stack">
      <div class="row"><div class="cmark-tile">${esc(S.settings.clinic.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase())}</div><div class="muted small grow">Na versão real, a logo da clínica entra aqui e aparece nas propostas e no atendimento.</div></div>
      <div class="grid2"><div class="field"><label for="cf-cl">Nome</label><input class="input" id="cf-cl" value="${esc(s.clinic)}" data-c="cfg" data-k="clinic"></div><div class="field"><label for="cf-sl">Slogan</label><input class="input" id="cf-sl" value="${esc(s.slogan)}" data-c="cfg" data-k="slogan"></div>
      <div class="field"><label for="cf-pr">Nome do sistema</label><input class="input" id="cf-pr" value="${esc(s.product)}" data-c="cfg" data-k="product"></div><div class="field"><label for="cf-ac">Cor de destaque</label><input class="input" type="color" id="cf-ac" value="${esc(s.accent || '#1F5BFF')}" data-c="cfg" data-k="accent" style="height:40px;padding:4px"></div></div>
      <div class="field"><label>Aparência</label><div class="seg">${[['auto','Automática'],['light','Clara'],['dark','Escura']].map(([k,l]) => `<button class="${s.theme===k?'on':''}" data-a="cfgTheme" data-v="${k}">${l}</button>`).join('')}</div></div></div></div>
    <div class="card"><div class="card-h"><h3>Contato</h3></div><div class="stack">
      <div class="grid2"><div class="field"><label for="cf-ph">Telefone</label><input class="input" id="cf-ph" placeholder="A preencher" value="${esc(s.phone)}" data-c="cfg" data-k="phone"></div><div class="field"><label for="cf-wa">WhatsApp comercial</label><input class="input" id="cf-wa" placeholder="A preencher" value="${esc(s.whatsapp)}" data-c="cfg" data-k="whatsapp"></div></div>
      <div class="field"><label for="cf-ad">Endereço</label><input class="input" id="cf-ad" placeholder="A preencher" value="${esc(s.address)}" data-c="cfg" data-k="address"></div>
      <div class="grid2"><div class="field"><label for="cf-ci">Cidade</label><input class="input" id="cf-ci" value="${esc(s.city)}" data-c="cfg" data-k="city"></div><div class="field"><label for="cf-tz">Fuso horário</label><select class="input" id="cf-tz" data-c="cfg" data-k="tz">${['America/Cuiaba','America/Sao_Paulo','America/Manaus','America/Campo_Grande'].map(z => `<option ${s.tz===z?'selected':''}>${z}</option>`).join('')}</select></div></div></div></div>
    <div class="card"><div class="card-h"><h3>Horário de funcionamento</h3></div>
      ${days.map(d => { const h = s.hours[d]; return `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><label class="row" style="width:130px"><input type="checkbox" ${h?'checked':''} data-c="cfgDay" data-d="${d}"> ${DOW[d]}</label>${h ? `<input class="input" type="time" style="width:auto" value="${hm(h[0])}" data-c="cfgHour" data-d="${d}" data-i="0" aria-label="Abre"><span class="muted">às</span><input class="input" type="time" style="width:auto" value="${hm(h[1])}" data-c="cfgHour" data-d="${d}" data-i="1" aria-label="Fecha">` : '<span class="muted small">Fechado</span>'}</div>`; }).join('')}
      <div class="grid2" style="margin-top:12px"><div class="field"><label>Pausa (seg–sex)</label><div class="row"><input class="input" type="time" style="width:auto" value="${hm(s.lunch[0])}" data-c="cfgLunch" data-i="0" aria-label="Início da pausa"><span class="muted">às</span><input class="input" type="time" style="width:auto" value="${hm(s.lunch[1])}" data-c="cfgLunch" data-i="1" aria-label="Fim da pausa"></div></div>
      <div class="field"><label for="cf-st">Intervalo da grade</label><select class="input" id="cf-st" data-c="cfgStep">${[15,30,60].map(v => `<option value="${v}" ${s.step===v?'selected':''}>${v} min</option>`).join('')}</select></div></div>
      <div class="field" style="margin-top:12px"><label for="cf-hol">Feriado ou indisponibilidade</label><div class="row"><input class="input" type="date" id="cf-hol" style="width:auto"><button class="btn sm" data-a="addHoliday">Bloquear dia</button></div><div class="row" style="margin-top:6px;gap:6px">${s.holidays.map(h => `<span class="chip">${fmtDate(h)} <button style="border:none;background:none;padding:0" data-a="delHoliday" data-d="${h}" aria-label="Remover">×</button></span>`).join('') || '<span class="muted xs">Nenhum dia bloqueado.</span>'}</div></div></div>
    <div class="card"><div class="card-h"><h3>Salas</h3></div><div class="stack">${s.rooms.map((r, i) => `<div class="row"><input class="input grow" value="${esc(r.name)}" data-c="cfgRoom" data-i="${i}" aria-label="Nome da sala"></div>`).join('')}<button class="btn sm" data-a="addRoom">${ic('plus')} Adicionar sala</button></div>
      <div class="card-h" style="margin-top:18px"><h3>Profissionais</h3></div><div class="list">${S.staff.map(st => `<div class="li"><div class="avatar">${initials(st.name.replace('Dra. ',''))}</div><div class="grow"><b style="font-weight:500">${esc(st.name)}</b><div class="muted small">${esc(st.role)}</div></div></div>`).join('')}</div></div>
    <div class="card" style="grid-column:1/-1"><div class="card-h"><h3>Permissões por perfil</h3><span class="muted xs">na versão real, aplicadas no servidor</span></div>
      <div class="tbl-wrap" style="border:none"><table class="tbl" style="min-width:520px"><thead><tr><th>Área</th><th>Administradora</th><th>Recepção</th><th>Profissional</th></tr></thead><tbody>${perm.map(r => `<tr>${r.map((c,i) => `<td>${i ? `<span class="${c==='—'?'muted':''}">${c}</span>` : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-h"><h3>Integrações</h3></div><div class="list">${[['WhatsApp Business Platform','Integração pendente · requer provedor autorizado, aprovação da Meta e modelos de mensagem'],['Serviço de IA','Integração pendente · custo por uso a definir'],['Google Agenda','Opcional · não conectado'],['Notificações push','Depende de permissão, navegador e aparelho'],['Hospedagem e banco de dados','A contratar na implantação']].map(([n,d]) => `<div class="li"><div class="grow"><b style="font-weight:500">${n}</b><div class="muted small">${d}</div></div><span class="chip">pendente</span></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Notificações</h3></div>${[['Novo pedido de horário da assistente',true],['Paciente aguardando atendimento humano',true],['Proposta aceita',true],['Cancelamentos',false],['Resumo do dia às 07:30',true]].map(([l,on],i) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${l}</span><button class="switch ${(S.settings['nt'+i] ?? on)?'on':''}" data-a="cfgNotif" data-i="${i}" data-def="${on}" aria-label="${l}"></button></div>`).join('')}
      <div class="row" style="margin-top:14px"><button class="btn sm" data-a="testPush">${ic('bell')} Testar notificação no celular</button><button class="btn sm danger" data-a="resetDemo">${ic('redo')} Reiniciar demonstração</button></div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Privacidade e LGPD</h3>${ic('shield')}</div><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px;color:var(--muted)"><li>Coleta mínima, finalidade clara e acesso restrito por perfil.</li><li>Dados de saúde são sensíveis: não vão para a IA, analytics ou campanhas sem necessidade.</li><li>Consentimentos separados para uso de imagem e comunicações de marketing.</li><li>Criptografia em trânsito e em repouso, backup, logs de auditoria, exportação e eliminação quando aplicável.</li><li>Esta interface, sozinha, não comprova conformidade legal nem segurança de produção.</li></ul></div>`;
};
const toMin = v => { const [h, m] = v.split(':').map(Number); return h*60 + (m||0); };
Object.assign(C, {
  cfg: t => { S.settings[t.dataset.k] = t.value; saveState(); if (t.dataset.k === 'accent') document.documentElement.style.setProperty('--accent', t.value); else render(); toast('Configuração aplicada'); },
  cfgDay: t => { const d = t.dataset.d; S.settings.hours[d] = t.checked ? [540, d === '6' ? 780 : 1140] : null; commit('Horário atualizado na agenda e na assistente'); },
  cfgHour: t => { const h = S.settings.hours[t.dataset.d]; h[Number(t.dataset.i)] = toMin(t.value); commit('Horário atualizado'); },
  cfgLunch: t => { S.settings.lunch[Number(t.dataset.i)] = toMin(t.value); commit('Pausa atualizada'); },
  cfgStep: t => { S.settings.step = Number(t.value); commit('Intervalo atualizado'); },
  cfgRoom: t => { S.settings.rooms[Number(t.dataset.i)].name = t.value; commit('Sala renomeada'); },
});
Object.assign(A, {
  cfgTheme: t => { S.settings.theme = t.dataset.v; commit(); },
  addRoom: () => { S.settings.rooms.push({ id:uid('s'), name:'Sala ' + (S.settings.rooms.length + 1) }); commit('Sala adicionada'); },
  addHoliday: () => { const v = $('#cf-hol').value; if (!v) return toast('Escolha uma data'); if (!S.settings.holidays.includes(v)) S.settings.holidays.push(v); commit('Dia bloqueado na agenda e para a assistente'); },
  delHoliday: t => { S.settings.holidays = S.settings.holidays.filter(h => h !== t.dataset.d); commit(); },
  cfgNotif: t => { const k = 'nt' + t.dataset.i; const cur = S.settings[k] ?? (t.dataset.def === 'true'); S.settings[k] = !cur; commit(); },
  testPush: () => pushToast('Novo pedido de horário: paciente de exemplo · avaliação · amanhã 10:00. Toque para aprovar.', ['visao'], '24AGÁ · aprovação'),
});

/* ================= LICENÇAS (PLATAFORMA) ================= */
VIEWS.licencas = () => {
  const T = S.tenants; const tv = UI.tenantView && T.find(t => t.id === UI.tenantView);
  const priced = T.filter(t => t.status === 'ativa').map(t => (S.plans.find(p => p.name === t.plan) || {}).price).filter(Boolean).map(v => Number(String(v).replace(/[^\d,]/g,'').replace(',','.')) || 0);
  const sim = priced.length ? brl(priced.reduce((a,b)=>a+b,0)) : '—';
  return `
  <div class="page-h"><div><span class="eyebrow">Plataforma para profissionais · nome comercial a definir</span><h1>Licenças</h1><p>Simulação de expansão futura. Não incluída no investimento inicial. O administrador da plataforma vê apenas dados operacionais do contrato, nunca pacientes ou informações clínicas.</p></div>
    <button class="btn primary" data-a="newTenant">${ic('plus')} Criar nova clínica</button></div>
  <div class="kpis">
    <div class="kpi"><span class="l">Clínicas cadastradas</span><span class="v">${T.length}</span></div>
    <div class="kpi"><span class="l">Licenças ativas</span><span class="v">${T.filter(t=>t.status==='ativa').length}</span></div>
    <div class="kpi"><span class="l">Em teste</span><span class="v">${T.filter(t=>t.status==='em teste').length}</span></div>
    <div class="kpi"><span class="l">Suspensas</span><span class="v">${T.filter(t=>t.status==='suspensa').length}</span></div>
    <div class="kpi"><span class="l">Usuários</span><span class="v">${T.reduce((a,t)=>a+t.users,0)}</span></div>
    <div class="kpi"><span class="l">Suporte em aberto</span><span class="v">${S.tickets.filter(k=>k.status==='aberto').length}</span></div>
    <div class="kpi"><span class="l">Receita de licenças (simulação)</span><span class="v" style="font-size:26px">${sim}</span><span class="s">preencha valores dos planos · sem projeção garantida</span></div>
  </div>
  <div class="tbl-wrap" style="margin-top:16px"><table class="tbl"><thead><tr><th>Clínica</th><th>Plano</th><th>Status</th><th>Usuários</th><th>Módulos</th><th>Integrações</th><th></th></tr></thead><tbody>
    ${T.map(t => `<tr><td><div class="row" style="flex-wrap:nowrap"><span class="avatar" style="background:${t.bg};color:${t.color};border:1px solid ${t.color}">${esc(t.initials)}</span><div><b style="font-weight:500">${esc(t.name)}</b><div class="muted xs">${esc(t.pro)}</div></div></div></td><td>${esc(t.plan)}</td><td><span class="chip ${t.status==='ativa'?'st-confirmado':t.status==='em teste'?'st-reservado':'st-cancelado'}">${esc(t.status)}</span></td><td class="tabnum">${t.users}</td><td class="small">${t.mods.map(esc).join(', ')}</td><td class="small muted">WhatsApp: ${esc(t.integ.whatsapp)}<br>IA: ${esc(t.integ.ia)} · Agenda: ${esc(t.integ.agenda)}</td>
      <td><div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-a="viewTenant" data-id="${t.id}">Visualizar ambiente</button><button class="btn sm" data-a="editTenant" data-id="${t.id}">Editar licença</button></div></td></tr>`).join('')}
  </tbody></table></div>
  ${tv ? `<div class="card" style="margin-top:16px"><div class="card-h"><h3>Ambiente: ${esc(tv.name)}</h3><button class="btn sm" data-a="viewTenant" data-id="">Fechar</button></div>
    <div class="tenant-prev"><div class="th" style="background:${tv.bg};color:${tv.color}"><span class="tl" style="border:1px solid ${tv.color}">${esc(tv.initials)}</span><div><b style="font-family:var(--f-display);font-size:22px;color:${tv.color}">${esc(tv.name)}</b><div style="font-size:12px;opacity:.8">${esc(tv.pro)} · plano ${esc(tv.plan)}</div></div></div>
      <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;background:var(--surface)">${[['Logo e paleta','próprias'],['Agenda','independente'],['Equipe e permissões',tv.users + ' usuário(s)'],['Catálogo','próprio'],['Pacientes e propostas','isolados · sem acesso'],['IA e mensagens', tv.mods.includes('IA') ? 'configurável' : 'não contratado'],['Relatórios','próprios'],['Licença', tv.status]].map(([a,b]) => `<div class="kpi"><span class="l">${a}</span><span style="font-weight:500">${esc(b)}</span></div>`).join('')}</div>
      <div style="padding:0 16px 16px;background:var(--surface)"><div class="lock">${ic('lock')} Dados de pacientes desta clínica não são exibidos para o administrador da plataforma.</div></div></div></div>` : ''}
  <div class="grid2" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>Planos demonstrativos</h3><span class="muted xs">nomes e valores editáveis</span></div>
      ${S.plans.map((p, i) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><input class="input" style="width:150px" value="${esc(p.name)}" data-c="planF" data-i="${i}" data-k="name" aria-label="Nome do plano"><input class="input" style="width:150px" placeholder="Valor mensal" value="${esc(p.price)}" data-c="planF" data-i="${i}" data-k="price" aria-label="Valor"><span class="muted xs grow">${p.feats.map(esc).join(' · ')}</span></div>`).join('')}</div>
    <div class="card"><div class="card-h"><h3>Solicitações de suporte</h3></div><div class="list">${S.tickets.map(k => `<div class="li"><div class="grow">${esc(k.text)}<div class="muted xs">${esc((T.find(t=>t.id===k.tenant)||{}).name||'')}</div></div><span class="chip ${k.status==='aberto'?'st-reservado':''}">${k.status}</span>${k.status==='aberto' ? `<button class="btn sm" data-a="closeTicket" data-id="${k.id}">Resolver</button>` : ''}</div>`).join('')}</div></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h3>Isolamento entre clínicas</h3>${ic('shield')}</div>
    <div class="iso"><div><b style="font-weight:500">Separação no banco</b><p class="muted small">Cada registro carrega o identificador da clínica (tenant_id), com políticas de acesso por linha (Row Level Security) aplicadas no banco.</p></div><div><b style="font-weight:500">Permissões no servidor</b><p class="muted small">Autenticação, perfis e auditoria verificados no backend, não apenas escondidos na tela.</p></div><div><b style="font-weight:500">Administrador sem acesso clínico</b><p class="muted small">O painel da plataforma mostra contratos, módulos e suporte. Pacientes e prontuários ficam fora.</p></div></div>
    <p class="note" style="margin-top:12px">Billing recorrente, marketplace, cobrança, controle de inadimplência e provisionamento automático ficam para expansão futura, com análise de custo, propriedade intelectual, termos contratuais, segurança e orçamento próprio.</p></div>`;
};
Object.assign(A, {
  viewTenant: t => { UI.tenantView = t.dataset.id || null; render(); },
  closeTicket: t => { S.tickets.find(k => k.id === t.dataset.id).status = 'resolvido'; commit('Solicitação resolvida'); },
  newTenant: () => tenantModal(null),
  editTenant: t => tenantModal(S.tenants.find(x => x.id === t.dataset.id)),
});
function tenantModal(t) {
  const x = t || { name:'', pro:'', initials:'', color:'#7C6A9C', bg:'#F5F2F9', plan:'Básico', status:'em teste', users:1 };
  openModal(`${mHead(t ? 'Editar licença' : 'Criar nova clínica', t ? esc(t.name) : 'Ambiente isolado, com marca e dados próprios')}<form class="mb" data-f="saveTenant" data-id="${t ? t.id : ''}">
    <div class="grid2"><div class="field"><label for="tn-n">Nome da clínica *</label><input class="input" id="tn-n" required value="${esc(x.name)}"></div><div class="field"><label for="tn-p">Profissional responsável</label><input class="input" id="tn-p" value="${esc(x.pro)}"></div>
    <div class="field"><label for="tn-i">Sigla</label><input class="input" id="tn-i" maxlength="3" value="${esc(x.initials)}"></div><div class="field"><label for="tn-c">Cor da marca</label><input class="input" type="color" id="tn-c" value="${x.color}" style="height:40px;padding:4px"></div>
    <div class="field"><label for="tn-pl">Plano</label><select class="input" id="tn-pl">${S.plans.map(p => `<option ${x.plan===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label for="tn-s">Status da licença</label><select class="input" id="tn-s">${['ativa','em teste','suspensa'].map(s => `<option ${x.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label for="tn-u">Usuários</label><input class="input" type="number" min="1" id="tn-u" value="${x.users}"></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-a="closeModal">Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
}
F.saveTenant = f => { const id = f.dataset.id; const color = $('#tn-c').value; const data = { name:$('#tn-n').value.trim(), pro:$('#tn-p').value.trim() || 'A definir', initials:($('#tn-i').value.trim() || $('#tn-n').value.trim().split(' ').map(w=>w[0]).join('').slice(0,2)).toUpperCase(), color, bg: color + '18', plan:$('#tn-pl').value, status:$('#tn-s').value, users:Number($('#tn-u').value)||1 };
  if (id) Object.assign(S.tenants.find(t => t.id === id), data); else { const nt = Object.assign({ id:uid('tn'), mods:['Agenda','CRM'], integ:{ whatsapp:'não iniciada', ia:'não iniciada', agenda:'não usa' }, since:ymd(new Date()), tickets:0 }, data); S.tenants.push(nt); UI.tenantView = nt.id; }
  closeModal(); commit(id ? 'Licença atualizada' : 'Clínica criada com ambiente isolado'); };
C.planF = t => { S.plans[Number(t.dataset.i)][t.dataset.k] = t.value; commit(); };
