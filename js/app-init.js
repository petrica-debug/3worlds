/* ═══════════════════════════════════════════════════════════════════════
   APP INITIALIZATION — View switching, H2 module, alerts, settings
   ═══════════════════════════════════════════════════════════════════════ */

const VIEW_TITLES={dashboard:'Dashboard',reach:'REACH Engine',h2:'H₂ Intelligence',alerts:'Regulatory Alerts',settings:'Settings'};

function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.sb-item').forEach(b=>b.classList.remove('active'));
  const btn=document.querySelector(`.sb-item[data-view="${id}"]`);if(btn)btn.classList.add('active');
  const bc=document.getElementById('tbBreadcrumb');
  bc.innerHTML=`<span>Platform</span><span class="sep">›</span><span class="current">${VIEW_TITLES[id]||id}</span>`;
  if(window.innerWidth<768)document.getElementById('sidebar').classList.remove('open');
}

function switchReachTab(id){
  document.querySelectorAll('#view-reach .tab').forEach(t=>t.classList.remove('active'));
  const tab=document.querySelector(`[data-reach-tab="${id}"]`);if(tab)tab.classList.add('active');
  document.querySelectorAll('#view-reach .tab-content').forEach(c=>c.classList.remove('active'));
  const content=document.getElementById('reach-'+id);if(content)content.classList.add('active');
}

function switchH2Tab(id){
  document.querySelectorAll('#view-h2 .tab').forEach(t=>t.classList.remove('active'));
  const tab=document.querySelector(`[data-h2-tab="${id}"]`);if(tab)tab.classList.add('active');
  document.querySelectorAll('#view-h2 .tab-content').forEach(c=>c.classList.remove('active'));
  const content=document.getElementById('h2-'+id);if(content)content.classList.add('active');
}

function showUpgrade(msg){
  document.getElementById('upgradeMsg').textContent=msg||'This feature is available on the Professional plan.';
  document.getElementById('upgradeModal').classList.add('open');
}
function closeModal(){document.getElementById('upgradeModal').classList.remove('open')}

// ─── COUNTER ANIMATION ──────────────────────────────────────────────────
function animateCounters(){
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count),dur=1500,start=performance.now();
    function ease(t){return t===1?1:1-Math.pow(2,-10*t)}
    function upd(now){const p=Math.min((now-start)/dur,1);el.textContent=Math.round(ease(p)*target);if(p<1)requestAnimationFrame(upd)}
    requestAnimationFrame(upd);
  });
}

// ─── ALERTS ──────────────────────────────────────────────────────────────
const ALERTS_DATA=[
  {title:"Bisphenol A — Restriction Proposal",type:"Restriction",date:"2026-03-05",substance:"Bisphenol A (80-05-7)",body:"ECHA has published a restriction proposal for Bisphenol A under REACH Annex XVII. The proposal targets thermal paper and other consumer applications. Public consultation open until June 2026. Impact: manufacturers using BPA in thermal paper must prepare substitution plans."},
  {title:"PFAS Universal Restriction — RAC/SEAC Update",type:"SVHC Candidate",date:"2026-02-28",substance:"PFAS group (various CAS)",body:"The five-country PFAS restriction proposal continues through SEAC and RAC evaluation. Scope covers ~10,000 substances. Transitional periods of 5-12 years proposed for critical uses. Companies should begin mapping PFAS in their supply chains and identifying alternatives."},
  {title:"Chromium Trioxide — Authorization Review",type:"Authorization",date:"2026-02-15",substance:"Chromium Trioxide (1333-82-0)",body:"Review reports due for existing Annex XIV authorizations for functional chrome plating. Companies must demonstrate continued need and progress on substitution. ECHA reviewing whether shorter review periods are warranted."},
  {title:"Formaldehyde — OEL Revision (Directive 2019/983)",type:"OEL Update",date:"2026-01-20",substance:"Formaldehyde (50-00-0)",body:"Revised OEL: 0.3 ppm (8h TWA) and 0.6 ppm (STEL). Member states must transpose by 2027. Impact on SDS Section 8 — update exposure controls and PPE recommendations. Workplace monitoring programs may need revision."},
  {title:"Lead — REACH Restriction Extension (Ammunition)",type:"Restriction",date:"2026-01-10",substance:"Lead (7439-92-1)",body:"Extension of lead restrictions to cover ammunition and fishing tackle. Transitional period: 3 years for hunting ammunition, 5 years for fishing weights. Affects downstream users in sporting goods sector."},
  {title:"ECHA — Updated IUCLID Validation Rules v4.2",type:"Technical",date:"2025-12-18",substance:"All substances",body:"ECHA has released updated IUCLID validation rules (v4.2). Key changes: stricter checks on endpoint study record completeness, new validation for nano-form reporting, updated business rules for joint submissions. All registrants should re-validate dossiers before next update submission."}
];

function renderAlerts(containerId){
  const typeColors={Restriction:'red','SVHC Candidate':'gold',Authorization:'purple','OEL Update':'blue',Technical:'green'};
  document.getElementById(containerId).innerHTML=ALERTS_DATA.map(a=>`<div class="alert-item" onclick="this.classList.toggle('open')">
    <div class="alert-header"><div><div class="alert-title">${a.title}</div><div style="margin-top:.25rem"><span class="pill pill-${typeColors[a.type]||'gold'}">${a.type}</span><span style="font-size:.68rem;color:var(--t3);margin-left:.4rem">${a.substance}</span></div></div>
    <span class="alert-date">${a.date}</span></div>
    <div class="alert-body">${a.body}</div></div>`).join('');
}

// ─── H2: CATALYST SELECTOR ──────────────────────────────────────────────
function findCatalysts(){
  const reaction=document.getElementById('catReaction').value;
  const maxBudget=parseInt(document.getElementById('catBudget').value);
  const matches=H2_CATALYSTS.filter(c=>c.reaction===reaction&&c.costPerKg<=maxBudget);
  const container=document.getElementById('catalystResults');
  if(!matches.length){container.innerHTML='<div style="padding:2rem;text-align:center;color:var(--t3)">No catalysts match. Try adjusting parameters.</div>';return}
  container.innerHTML=matches.map(c=>{
    const conf=Math.round((c.conversion*0.4+c.selectivity*0.3+(1-c.costPerKg/3500)*0.3)*100);
    return `<div class="cat-card"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.5rem"><div><div style="font-weight:700;font-size:.95rem">${c.name}</div><div style="font-size:.68rem;color:var(--t3)">${c.type} on ${c.support} · ${c.loading} wt% · Promoters: ${c.promoters.length?c.promoters.join(', '):'None'}</div></div><span class="pill pill-green">${conf}% match</span></div>
      <div class="cat-card-stats"><div class="cat-stat"><div class="cat-stat-val" style="color:var(--gold)">${(c.conversion*100).toFixed(0)}%</div><div class="cat-stat-label">Conversion</div></div><div class="cat-stat"><div class="cat-stat-val" style="color:var(--blue)">${(c.selectivity*100).toFixed(0)}%</div><div class="cat-stat-label">Selectivity</div></div><div class="cat-stat"><div class="cat-stat-val" style="color:var(--green)">${(c.lifetime/1000).toFixed(0)}K h</div><div class="cat-stat-label">Lifetime</div></div><div class="cat-stat"><div class="cat-stat-val">€${c.costPerKg}</div><div class="cat-stat-label">Cost/kg</div></div></div>
      <div style="font-size:.78rem;color:var(--t2)">${c.notes}</div>
      <div style="font-size:.7rem;color:var(--t3);margin-top:.3rem">Operating: ${c.tempRange} · ${c.pressure}</div></div>`}).join('');
}

// ─── H2: TEA CALCULATOR ─────────────────────────────────────────────────
const ELEC_PRICES={DE:65,NL:58,BE:62,FR:45,ES:52,IT:68};

function calcTEA(){
  const method=document.getElementById('teaMethod').value;
  const cap=parseFloat(document.getElementById('teaCapacity').value)||10;
  const elec=parseFloat(document.getElementById('teaElec').value)||60;
  const dr=0.08,life=25;
  const params={pem:{capexPerMw:1200000,eff:0.65,maint:0.035},alkaline:{capexPerMw:900000,eff:0.60,maint:0.03},cracking:{capexPerMw:800000,eff:0.72,maint:0.025}};
  const p=params[method];const capex=p.capexPerMw*cap;const hours=8000;
  const elecCost=elec*cap*hours*p.eff/1000;const maintenance=capex*p.maint;const opex=elecCost+maintenance;
  const annuity=dr*(1+dr)**life/((1+dr)**life-1);const capexAnn=capex*annuity;
  const h2t=cap*hours*p.eff*0.033;const lcoh=(capexAnn+opex)/(h2t*1000);
  const totalRev=h2t*1000*4.5;const irr=((totalRev-opex)/capex)*100;const payback=capex/(totalRev-opex);

  document.getElementById('teaResults').innerHTML=`<div class="tea-results">
    <div class="tea-card"><div class="tea-val" style="color:var(--gold)">€${lcoh.toFixed(2)}</div><div class="tea-label">LCOH (€/kg H₂)</div></div>
    <div class="tea-card"><div class="tea-val" style="color:var(--blue)">€${(capex/1e6).toFixed(1)}M</div><div class="tea-label">Total CAPEX</div></div>
    <div class="tea-card"><div class="tea-val">€${(opex/1e6).toFixed(2)}M</div><div class="tea-label">Annual OPEX</div></div>
    <div class="tea-card"><div class="tea-val" style="color:var(--green)">${irr.toFixed(1)}%</div><div class="tea-label">Estimated IRR</div></div>
    <div class="tea-card"><div class="tea-val">${payback.toFixed(1)} yr</div><div class="tea-label">Payback Period</div></div>
    <div class="tea-card"><div class="tea-val">${h2t.toFixed(0)} t</div><div class="tea-label">Annual H₂</div></div>
  </div>
  <div class="lcoh-chart"><div style="font-size:.82rem;font-weight:700;margin-bottom:.8rem">LCOH Comparison (€/kg H₂)</div>
    <div class="lcoh-bar-row"><span class="lcoh-bar-label">Grey H₂</span><div class="lcoh-bar-track"><div class="lcoh-bar-fill" style="width:${1.5/6*100}%;background:#666">€1.50</div></div></div>
    <div class="lcoh-bar-row"><span class="lcoh-bar-label">Blue H₂</span><div class="lcoh-bar-track"><div class="lcoh-bar-fill" style="width:${2.0/6*100}%;background:var(--blue)">€2.00</div></div></div>
    <div class="lcoh-bar-row"><span class="lcoh-bar-label">Green H₂ avg</span><div class="lcoh-bar-track"><div class="lcoh-bar-fill" style="width:${4.5/6*100}%;background:var(--green)">€4.50</div></div></div>
    <div class="lcoh-bar-row"><span class="lcoh-bar-label" style="font-weight:700;color:var(--gold)">Your Project</span><div class="lcoh-bar-track"><div class="lcoh-bar-fill" style="width:${Math.min(lcoh/6*100,100)}%;background:var(--gold)">€${lcoh.toFixed(2)}</div></div></div>
  </div>`;
}

// ─── H2: EU FUNDING ─────────────────────────────────────────────────────
function renderFunding(){
  document.getElementById('fundingList').innerHTML=EU_FUNDING_PROGRAMS.map(f=>`<div class="fund-card">
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.4rem"><div><div style="font-weight:700;font-size:.9rem">${f.name}</div><div style="font-size:.7rem;color:var(--t3)">Deadline: ${f.deadline}</div></div>
    <div style="font-size:1rem;font-weight:800;color:var(--gold)">€${(f.maxGrant/1e6).toFixed(1)}M</div></div>
    <div style="margin:.4rem 0">${f.requirements.map(r=>`<span class="pill pill-blue">${r}</span>`).join('')}</div>
    <button class="btn btn-outline btn-sm" onclick="showUpgrade('Eligibility checking requires an Enterprise plan.')">Check Eligibility</button>
  </div>`).join('');
}

// ─── ALERT SUBSCRIPTION (Kit) ───────────────────────────────────────────
function subscribeAlerts(){
  const email=document.getElementById('alertEmail').value.trim();
  const msg=document.getElementById('alertSubMsg');
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.style.display='block';msg.style.color='var(--red)';msg.textContent='Please enter a valid email.';return}
  fetch('https://api.convertkit.com/v3/tags/17236643/subscribe',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({api_key:'N-LgaMpJAsmC6vhFy1AXUw',email})
  }).then(r=>{if(!r.ok)throw 0;msg.style.display='block';msg.style.color='var(--gold)';msg.textContent='Subscribed!';document.getElementById('alertEmail').value=''})
  .catch(()=>{msg.style.display='block';msg.style.color='var(--red)';msg.textContent='Error. Try again.'});
}

// ─── INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  // Sidebar nav
  document.querySelectorAll('.sb-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  document.getElementById('tbHamburger').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));

  // REACH tabs
  document.querySelectorAll('[data-reach-tab]').forEach(t=>t.addEventListener('click',()=>switchReachTab(t.dataset.reachTab)));
  document.querySelectorAll('[data-h2-tab]').forEach(t=>t.addEventListener('click',()=>switchH2Tab(t.dataset.h2Tab)));

  // Modal
  document.getElementById('upgradeModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});

  // Init modules
  animateCounters();
  initSubstanceSearch();
  initESDSGenerator();
  initCopilot();
  renderAlerts('alertsList');
  renderAlerts('fullAlertsList');
  renderFunding();

  // H2 listeners
  document.getElementById('findCatalysts').addEventListener('click',findCatalysts);
  document.getElementById('calcTea').addEventListener('click',calcTEA);
  document.getElementById('teaCountry').addEventListener('change',()=>{document.getElementById('teaElec').value=ELEC_PRICES[document.getElementById('teaCountry').value]||60});
  document.getElementById('generateSds').addEventListener('click',generateESDS);
  document.getElementById('alertSubscribe').addEventListener('click',subscribeAlerts);
  document.getElementById('copilotToggle').addEventListener('click',toggleCopilot);
  document.getElementById('copilotSend').addEventListener('click',sendCopilotMessage);

  // Copilot suggestions
  document.querySelectorAll('.cp-sug').forEach(s=>s.addEventListener('click',()=>askCopilot(s.textContent)));
});
