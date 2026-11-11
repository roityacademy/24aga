/* 24AGÁ — conexão com o Supabase (REST). Sem configuração, o site funciona só como demonstração. */
const CFG = window.CFG || {};
const sbOn = () => !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
async function sbInsert(table, row) {
  const r = await fetch(CFG.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + table, {
    method:'POST',
    headers:{ apikey:CFG.SUPABASE_ANON_KEY, Authorization:'Bearer ' + CFG.SUPABASE_ANON_KEY, 'Content-Type':'application/json', Prefer:'return=minimal' },
    body:JSON.stringify(row),
  });
  return { ok:r.ok, status:r.status };
}
async function saveLead(lead) {
  if (sbOn()) { try { return await sbInsert('leads', lead); } catch (e) { return { ok:false }; } }
  if (CFG.WHATSAPP) return { ok:true, viaWhats:true };
  return { ok:false, notConfigured:true };
}
