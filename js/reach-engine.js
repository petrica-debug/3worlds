/* ═══════════════════════════════════════════════════════════════════════
   REACH ENGINE — Core logic for substance analysis, dossier completeness,
   exposure scenarios, read-across, restriction checking, IUCLID export,
   SDS generation, and submission readiness.
   ═══════════════════════════════════════════════════════════════════════ */

// ─── SUBSTANCE SEARCH & DETAIL ───────────────────────────────────────────
function initSubstanceSearch(){
  const inp=document.getElementById('substanceSearch');
  const res=document.getElementById('searchResults');
  const det=document.getElementById('substanceDetail');
  renderSubstanceList(CHEMICALS_DB,res);
  inp.addEventListener('input',()=>{
    det.style.display='none';res.style.display='';
    const q=inp.value.toLowerCase().trim();
    if(!q){renderSubstanceList(CHEMICALS_DB,res);return}
    renderSubstanceList(CHEMICALS_DB.filter(c=>c.name.toLowerCase().includes(q)||c.cas.includes(q)||c.formula.toLowerCase().includes(q)||(c.ecNumber||'').includes(q)),res);
  });
}

function renderSubstanceList(list,container){
  if(!list.length){container.innerHTML='<div class="empty" style="padding:2rem;text-align:center;color:var(--t3)"><div style="font-size:2rem;margin-bottom:.5rem;opacity:.4">🔍</div>No substances found.</div>';return}
  container.innerHTML=list.map(c=>{
    const band=TONNAGE_BANDS[c.tonnageBand];
    const dc=c.dossierCompleteness||{};
    const eps=band?band.endpoints:[];
    const done=eps.filter(e=>dc[e]==='complete'||dc[e]==='waived'||dc[e]==='not_required'||dc[e]==='read_across').length;
    const pct=eps.length?Math.round(done/eps.length*100):0;
    const pctColor=pct>=90?'var(--green)':pct>=60?'var(--orange)':'var(--red)';
    return `<div class="substance-row" onclick="showSubstanceDetail('${c.cas}')">
      <div><div class="sr-name">${c.name}${c.svhc?' <span class="pill pill-red">SVHC</span>':''}${c.harmonisedCLP?' <span class="pill pill-blue">Harmonised CLP</span>':''}</div>
      <div class="sr-meta">CAS ${c.cas} · EC ${c.ecNumber||'—'} · ${c.formula} · MW ${c.mw} · ${band?band.label:c.tonnageBand}</div></div>
      <div class="sr-right"><span style="font-size:.72rem;font-weight:700;color:${pctColor}">${pct}%</span>
      ${c.pictograms.slice(0,4).map(p=>`<span style="font-size:.9rem" title="${GHS_PICTOGRAMS[p]?.name||p}">${GHS_PICTOGRAMS[p]?.icon||''}</span>`).join('')}
      </div></div>`}).join('');
}

function showSubstanceDetail(cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  document.getElementById('searchResults').style.display='none';
  const det=document.getElementById('substanceDetail');det.style.display='block';
  const pc=c.physChem;
  const auth=AUTHORIZATION_ENTRIES[cas];
  const dnelData=DNEL_PNEC[cas];
  const transport=UN_TRANSPORT[cas];
  const restrictions=ANNEX_XVII_RESTRICTIONS.filter(r=>r.substances.includes(cas));

  det.innerHTML=`<div class="detail-panel">
    <div class="dp-header">
      <div><div class="dp-title">${c.name}</div>
      <div class="dp-subtitle">CAS ${c.cas} · EC ${c.ecNumber||'—'} · ${c.formula} · MW ${c.mw} g/mol · ${c.state}</div>
      <div style="margin-top:.4rem">${c.svhc?'<span class="pill pill-red">SVHC — Candidate List</span>':''}${c.harmonisedCLP?`<span class="pill pill-blue">Harmonised CLP: ${c.clpIndex}</span>`:'<span class="pill pill-orange">Self-classification</span>'}
      <span class="pill pill-gold">${TONNAGE_BANDS[c.tonnageBand]?.label||c.tonnageBand}</span>
      <span class="pill pill-${c.registrationStatus==='Active'?'green':'red'}">${c.registrationStatus}</span></div></div>
      <button class="dp-close" onclick="document.getElementById('substanceDetail').style.display='none';document.getElementById('searchResults').style.display=''">✕</button>
    </div>
    <div class="dp-body">

      <div class="dp-section"><div class="dp-section-title">Substance Identity (IUCLID Section 1)</div>
        <table class="dp-table">
          <tr><td>IUPAC Name</td><td>${c.iupac||c.name}</td></tr>
          <tr><td>CAS Number</td><td>${c.cas}</td></tr>
          <tr><td>EC Number</td><td>${c.ecNumber||'—'}</td></tr>
          <tr><td>Molecular Formula</td><td>${c.formula}</td></tr>
          <tr><td>SMILES</td><td>${c.smiles||'—'}</td></tr>
          <tr><td>InChI</td><td style="font-size:.65rem;word-break:break-all">${c.inchi||'—'}</td></tr>
          <tr><td>REACH Registration</td><td>${c.reach||'Pending'}</td></tr>
          <tr><td>Registration Type</td><td>${c.registrationType||'—'} ${c.jointSubmission?'(Joint Submission)':''}</td></tr>
          <tr><td>Lead Registrant</td><td>${c.leadRegistrant||'—'}</td></tr>
          <tr><td>Tonnage Band</td><td>${TONNAGE_BANDS[c.tonnageBand]?.label||c.tonnageBand} (Annex ${TONNAGE_BANDS[c.tonnageBand]?.annex||'—'})</td></tr>
          <tr><td>ECHA Link</td><td><a href="${c.echaUrl||'#'}" target="_blank" style="font-size:.72rem">${c.echaUrl?'View on ECHA →':'—'}</a></td></tr>
        </table></div>

      <div class="dp-section"><div class="dp-section-title">CLP Classification (EC 1272/2008)</div>
        <div style="margin-bottom:.5rem"><strong style="font-size:.82rem;color:${c.signal==='Danger'?'var(--red)':'var(--gold)'}">⬤ ${c.signal}</strong>
        ${c.harmonisedCLP?` <span style="font-size:.72rem;color:var(--t3)">— Harmonised entry, Index No. ${c.clpIndex}, ${c.atpNumber}</span>`:' <span style="font-size:.72rem;color:var(--t3)">— Self-classification by registrant(s)</span>'}</div>
        <div style="margin-bottom:.6rem">${c.clp.map(cl=>{
          const col=cl.includes('Carc')||cl.includes('Muta')||cl.includes('Repr')?'red':cl.includes('Acute Tox. 1')||cl.includes('Acute Tox. 2')||cl.includes('Acute Tox. 3')?'red':cl.includes('Flam')||cl.includes('Ox.')?'orange':cl.includes('Aquatic')?'green':cl.includes('Skin Corr')||cl.includes('Resp. Sens')?'purple':'gold';
          return `<span class="pill pill-${col}">${cl}</span>`}).join('')}</div>
        <div style="margin-bottom:.6rem">${c.pictograms.map(p=>`<span class="pictogram">${GHS_PICTOGRAMS[p]?.icon||''} ${p} — ${GHS_PICTOGRAMS[p]?.name||''}</span>`).join('')}</div>
        <div style="margin-bottom:.4rem;font-size:.72rem;font-weight:600;color:var(--t3)">Hazard Statements:</div>
        ${c.hStatements.map(h=>`<div class="h-stmt"><code>${h}</code><span>${H_STATEMENTS[h]||h}</span></div>`).join('')}
        <div style="margin-top:.5rem;font-size:.72rem;font-weight:600;color:var(--t3)">Precautionary Statements:</div>
        <div style="font-size:.78rem;color:var(--t2);margin-top:.2rem">${c.pStatements.join(', ')}</div>
      </div>

      <div class="dp-section"><div class="dp-section-title">Physical & Chemical Properties (IUCLID Section 4)</div>
        <table class="dp-table">
          <tr><td>Melting Point</td><td>${pc.mp}°C</td></tr>
          <tr><td>Boiling Point</td><td>${pc.bp}°C</td></tr>
          <tr><td>Density (20°C)</td><td>${pc.density} g/cm³</td></tr>
          <tr><td>Vapour Pressure (20°C)</td><td>${pc.vp} Pa</td></tr>
          <tr><td>Log Kow</td><td>${pc.logP!==null?pc.logP:'N/A (inorganic)'}</td></tr>
          <tr><td>Water Solubility</td><td>${pc.solubility}</td></tr>
          ${pc.flashPoint!==null?`<tr><td>Flash Point</td><td>${pc.flashPoint}°C</td></tr>`:''}
          ${pc.autoIgnition!==null?`<tr><td>Auto-ignition Temperature</td><td>${pc.autoIgnition}°C</td></tr>`:''}
          ${pc.ph?`<tr><td>pH</td><td>${pc.ph}</td></tr>`:''}
        </table></div>

      ${dnelData?`<div class="dp-section"><div class="dp-section-title">DNEL / PNEC Values (Risk Characterisation)</div>
        <table class="dp-table">
          <tr><td colspan="2" style="color:var(--gold);font-weight:700;border-bottom:1px solid var(--border)">DNELs (Derived No-Effect Levels)</td></tr>
          ${dnelData.dnelWorkerInhal!==null?`<tr><td>Worker — Inhalation (long-term)</td><td>${dnelData.dnelWorkerInhal} mg/m³</td></tr>`:''}
          ${dnelData.dnelWorkerDermal!==null?`<tr><td>Worker — Dermal (long-term)</td><td>${dnelData.dnelWorkerDermal} mg/kg bw/d</td></tr>`:''}
          ${dnelData.dnelGenPopInhal!==null?`<tr><td>General Population — Inhalation</td><td>${dnelData.dnelGenPopInhal} mg/m³</td></tr>`:''}
          ${dnelData.dnelGenPopDermal!==null?`<tr><td>General Population — Dermal</td><td>${dnelData.dnelGenPopDermal} mg/kg bw/d</td></tr>`:''}
          ${dnelData.dnelGenPopOral!==null?`<tr><td>General Population — Oral</td><td>${dnelData.dnelGenPopOral} mg/kg bw/d</td></tr>`:''}
          <tr><td colspan="2" style="color:var(--blue);font-weight:700;border-bottom:1px solid var(--border);padding-top:.5rem">PNECs (Predicted No-Effect Concentrations)</td></tr>
          ${dnelData.pnecFreshwater!==null?`<tr><td>Freshwater</td><td>${dnelData.pnecFreshwater} mg/L</td></tr>`:''}
          ${dnelData.pnecMarine!==null?`<tr><td>Marine water</td><td>${dnelData.pnecMarine} mg/L</td></tr>`:''}
          ${dnelData.pnecSTP!==null?`<tr><td>STP microorganisms</td><td>${dnelData.pnecSTP} mg/L</td></tr>`:''}
          ${dnelData.pnecSediment!==null?`<tr><td>Sediment (freshwater)</td><td>${dnelData.pnecSediment} mg/kg dw</td></tr>`:''}
          ${dnelData.pnecSoil!==null?`<tr><td>Soil</td><td>${dnelData.pnecSoil} mg/kg dw</td></tr>`:''}
        </table></div>`:``}

      ${restrictions.length?`<div class="dp-section"><div class="dp-section-title">Annex XVII Restrictions</div>
        ${restrictions.map(r=>`<div style="padding:.6rem;background:var(--red-d);border:1px solid rgba(239,68,68,.15);border-radius:8px;margin-bottom:.4rem">
          <div style="font-weight:700;font-size:.82rem;color:var(--red)">Entry ${r.entry}: ${r.name}</div>
          <div style="font-size:.75rem;color:var(--t2);margin-top:.3rem"><strong>Condition:</strong> ${r.condition}</div>
          <div style="font-size:.75rem;color:var(--t2)"><strong>Scope:</strong> ${r.scope}</div>
          <div style="font-size:.75rem;color:var(--t2)"><strong>Exemptions:</strong> ${r.exemptions}</div>
        </div>`).join('')}</div>`:``}

      ${auth?`<div class="dp-section"><div class="dp-section-title">SVHC / Authorization Status (Annex XIV)</div>
        <table class="dp-table">
          <tr><td>Candidate List Date</td><td>${auth.candidateDate}</td></tr>
          <tr><td>Reason for Inclusion</td><td>${auth.reason}</td></tr>
          <tr><td>Annex XIV (Authorization List)</td><td>${auth.annexXIV?'<span class="pill pill-red">Listed</span>':'<span class="pill pill-orange">Not yet listed</span>'}</td></tr>
          ${auth.sunsetDate?`<tr><td>Sunset Date</td><td>${auth.sunsetDate}</td></tr>`:''}
          ${auth.latestAppDate?`<tr><td>Latest Application Date</td><td>${auth.latestAppDate}</td></tr>`:''}
          <tr><td>Known Alternatives</td><td>${auth.alternatives.join(', ')}</td></tr>
          <tr><td>Socio-economic Context</td><td style="font-size:.72rem">${auth.socioEconomic}</td></tr>
        </table></div>`:``}

      ${transport?`<div class="dp-section"><div class="dp-section-title">Transport Classification (ADR/IMDG/IATA)</div>
        <table class="dp-table">
          <tr><td>UN Number</td><td>UN ${transport.un}</td></tr>
          <tr><td>Proper Shipping Name</td><td>${transport.properShipping}</td></tr>
          <tr><td>Class</td><td>${transport.class}${transport.subsidiary?' ('+transport.subsidiary+')':''}</td></tr>
          <tr><td>Packing Group</td><td>${transport.packingGroup}</td></tr>
          <tr><td>Labels</td><td>${transport.labels.join(', ')}</td></tr>
          <tr><td>Tunnel Code (ADR)</td><td>${transport.tunnelCode||'—'}</td></tr>
        </table></div>`:``}

      <div class="dp-section"><div class="dp-section-title">Common Uses</div>
        <p style="font-size:.82rem;color:var(--t2)">${c.use}</p></div>

      <div class="dp-actions">
        <button class="btn btn-gold" onclick="switchReachTab('dossier');setTimeout(()=>renderDossierCompleteness('${c.cas}'),50)">📋 Dossier Analysis</button>
        <button class="btn btn-blue" onclick="switchReachTab('esds');setTimeout(()=>{document.getElementById('sdsSubstance').value='${c.cas}';generateESDS()},50)">📄 Generate eSDS</button>
        <button class="btn btn-purple" onclick="switchReachTab('iuclid');setTimeout(()=>renderIUCLID('${c.cas}'),50)">💾 IUCLID Export</button>
        <button class="btn btn-outline" onclick="switchReachTab('submission');setTimeout(()=>renderSubmissionReadiness('${c.cas}'),50)">✅ Submission Check</button>
        <button class="btn btn-outline" onclick="askCopilot('Analyze the regulatory status of ${c.name} (CAS ${c.cas}) and identify any compliance gaps or upcoming deadlines.')">🤖 Ask AI Copilot</button>
      </div>
    </div></div>`;
  copilotContext={substance:c,auth,dnelData,transport,restrictions};
}

// ─── DOSSIER COMPLETENESS ────────────────────────────────────────────────
function renderDossierCompleteness(cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const band=TONNAGE_BANDS[c.tonnageBand];if(!band)return;
  const dc=c.dossierCompleteness||{};
  const eps=band.endpoints;
  const counts={complete:0,waived:0,read_across:0,missing:0,not_required:0};
  eps.forEach(e=>{const s=dc[e]||'missing';counts[s]=(counts[s]||0)+1});
  const total=eps.length;
  const satisfied=counts.complete+counts.waived+counts.not_required+counts.read_across;
  const pct=Math.round(satisfied/total*100);
  const missingCost=eps.filter(e=>(dc[e]||'missing')==='missing').reduce((s,e)=>s+(ENDPOINT_META[e]?.cost||0),0);

  const container=document.getElementById('dossierContent');
  container.innerHTML=`
    <div class="card" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
        <div><span style="font-size:1.1rem;font-weight:800">${c.name}</span> <span style="font-size:.78rem;color:var(--t3)">— ${band.label} (Annex ${band.annex})</span></div>
        <span style="font-size:1.5rem;font-weight:800;color:${pct>=90?'var(--green)':pct>=60?'var(--orange)':'var(--red)'}">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>=90?'var(--green)':pct>=60?'var(--orange)':'var(--red)'}"></div></div>
      <div style="display:flex;gap:1rem;margin-top:.6rem;font-size:.72rem">
        <span style="color:var(--green)">● ${counts.complete} Complete</span>
        <span style="color:var(--orange)">● ${counts.waived} Waived</span>
        <span style="color:var(--blue)">● ${counts.read_across||0} Read-across</span>
        <span style="color:var(--red)">● ${counts.missing} Missing</span>
        <span style="color:var(--t3)">● ${counts.not_required} N/A</span>
      </div>
      ${counts.missing>0?`<div style="margin-top:.6rem;padding:.5rem;background:var(--red-d);border:1px solid rgba(239,68,68,.15);border-radius:8px;font-size:.78rem;color:var(--red)">
        ⚠ ${counts.missing} endpoint${counts.missing>1?'s':''} missing — estimated cost to fill gaps: <strong>€${missingCost.toLocaleString()}</strong>
      </div>`:''}
    </div>
    <div class="endpoint-grid">${eps.map(e=>{
      const meta=ENDPOINT_META[e]||{};
      const status=dc[e]||'missing';
      const statusLabel={complete:'Complete',waived:'Waived',read_across:'Read-across',missing:'Missing',not_required:'N/A'}[status]||status;
      return `<div class="ep-row">
        <span class="ep-annex">${meta.annex||''}</span>
        <span class="ep-name">${meta.name||e}</span>
        <span class="ep-status ep-${status}">${statusLabel}</span>
        <span class="ep-cost">${status==='missing'?'€'+((meta.cost||0)/1000).toFixed(0)+'K':''}</span>
        <span class="ep-action" title="Ask AI for guidance" onclick="event.stopPropagation();askCopilot('For ${c.name}, provide guidance on the ${meta.name||e} endpoint. Status: ${statusLabel}. What testing strategy, waiver options, or read-across possibilities exist?')">🤖</span>
      </div>`}).join('')}</div>`;
}

// ─── EXPOSURE SCENARIOS ──────────────────────────────────────────────────
function renderExposureScenarios(cas){
  const scenarios=EXPOSURE_SCENARIOS[cas];
  const container=document.getElementById('exposureContent');
  if(!scenarios||!scenarios.length){container.innerHTML='<div class="empty" style="padding:2rem;text-align:center;color:var(--t3)">No exposure scenarios available for this substance in the demo database.<br><button class="btn btn-purple btn-sm" style="margin-top:.5rem" onclick="askCopilot(\'Generate exposure scenario structure for '+cas+'\')">🤖 Ask AI to draft ES</button></div>';return}
  container.innerHTML=scenarios.map((es,i)=>`<div class="es-card" onclick="this.classList.toggle('open')">
    <div class="es-header"><div class="es-title">${es.esTitle}</div><div style="display:flex;align-items:center;gap:.5rem"><span class="pill pill-blue">${es.procCat}</span><span class="pill pill-green">${es.envRelCat}</span><span class="es-chevron">▸</span></div></div>
    <div class="es-body">
      <div style="font-size:.72rem;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem">Contributing Scenarios — Worker Exposure</div>
      ${es.contribScenarios.map(cs=>`<div class="cs-row">
        <div class="cs-title">${cs.name}</div>
        <table class="dp-table" style="margin:.3rem 0">
          <tr><td>PROC</td><td>${cs.proc}</td></tr>
          <tr><td>Duration / Frequency</td><td>${cs.duration}, ${cs.frequency}</td></tr>
          <tr><td>Concentration</td><td>${cs.concentration}</td></tr>
          <tr><td>PPE</td><td>${cs.ppe}</td></tr>
          <tr><td>LEV / Engineering Controls</td><td>${cs.lev}</td></tr>
        </table>
        <div style="font-size:.72rem;font-weight:600;color:var(--t3);margin-top:.4rem">Risk Characterisation Ratios (RCR):</div>
        <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">Inhalation</span><div class="rcr-track"><div class="rcr-fill" style="width:${cs.rcrWorkerInhal*100}%;background:${cs.rcrWorkerInhal<0.5?'var(--green)':cs.rcrWorkerInhal<0.8?'var(--orange)':'var(--red)'}"></div></div><span class="rcr-val" style="color:${cs.rcrWorkerInhal<1?'var(--green)':'var(--red)'}">${cs.rcrWorkerInhal.toFixed(2)}</span></div>
        <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">Dermal</span><div class="rcr-track"><div class="rcr-fill" style="width:${cs.rcrWorkerDermal*100}%;background:${cs.rcrWorkerDermal<0.5?'var(--green)':cs.rcrWorkerDermal<0.8?'var(--orange)':'var(--red)'}"></div></div><span class="rcr-val" style="color:${cs.rcrWorkerDermal<1?'var(--green)':'var(--red)'}">${cs.rcrWorkerDermal.toFixed(2)}</span></div>
      </div>`).join('')}
      <div style="font-size:.72rem;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin:.8rem 0 .4rem">Environmental Release — RCRs</div>
      <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">Freshwater</span><div class="rcr-track"><div class="rcr-fill" style="width:${es.envRcr.rcrFreshwater*100}%;background:${es.envRcr.rcrFreshwater<1?'var(--green)':'var(--red)'}"></div></div><span class="rcr-val">${es.envRcr.rcrFreshwater.toFixed(2)}</span></div>
      <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">Marine</span><div class="rcr-track"><div class="rcr-fill" style="width:${es.envRcr.rcrMarine*100}%;background:${es.envRcr.rcrMarine<1?'var(--green)':'var(--red)'}"></div></div><span class="rcr-val">${es.envRcr.rcrMarine.toFixed(2)}</span></div>
      <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">STP</span><div class="rcr-track"><div class="rcr-fill" style="width:${es.envRcr.rcrSTP*100}%;background:${es.envRcr.rcrSTP<1?'var(--green)':'var(--red)'}"></div></div><span class="rcr-val">${es.envRcr.rcrSTP.toFixed(2)}</span></div>
      <div class="rcr-bar"><span style="font-size:.7rem;color:var(--t2);width:80px">Soil</span><div class="rcr-track"><div class="rcr-fill" style="width:${es.envRcr.rcrSoil*100}%;background:${es.envRcr.rcrSoil<1?'var(--green)':'var(--red)'}"></div></div><span class="rcr-val">${es.envRcr.rcrSoil.toFixed(2)}</span></div>
    </div></div>`).join('');
}

// ─── READ-ACROSS ─────────────────────────────────────────────────────────
function renderReadAcross(cas){
  const groups=READ_ACROSS_GROUPS.filter(g=>g.members.includes(cas));
  const container=document.getElementById('readAcrossContent');
  if(!groups.length){container.innerHTML='<div class="empty" style="padding:2rem;text-align:center;color:var(--t3)">No read-across groups defined for this substance.<br><button class="btn btn-purple btn-sm" style="margin-top:.5rem" onclick="askCopilot(\'Identify potential read-across analogues for CAS '+cas+' based on structural similarity and metabolic pathways.\')">🤖 Ask AI to find analogues</button></div>';return}
  container.innerHTML=groups.map(g=>{
    const members=g.members.map(m=>{const s=CHEMICALS_DB.find(x=>x.cas===m);return s?`<span class="pill pill-${m===cas?'gold':'blue'}">${s.name} (${m})</span>`:`<span class="pill pill-blue">${m}</span>`}).join('');
    return `<div class="card" style="margin-bottom:.8rem">
      <div style="font-weight:700;font-size:.95rem;margin-bottom:.5rem">${g.groupName}</div>
      <div style="margin-bottom:.5rem">${members}</div>
      <div style="font-size:.72rem;font-weight:600;color:var(--t3);text-transform:uppercase;margin-bottom:.3rem">RAAF Justification</div>
      <div style="font-size:.78rem;color:var(--t2);margin-bottom:.5rem;line-height:1.6">${g.justification}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-size:.7rem;font-weight:600;color:var(--t3)">Applicable endpoints:</span>
        ${g.endpoints.map(e=>`<span class="pill pill-green">${ENDPOINT_META[e]?.name||e}</span>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="pill pill-${g.confidence==='High'?'green':g.confidence==='Medium'?'orange':'red'}">Confidence: ${g.confidence}</span>
        <span style="font-size:.72rem;color:var(--t3)">${g.regulatoryPrecedent}</span>
      </div>
    </div>`}).join('');
}

// ─── IUCLID XML EXPORT ───────────────────────────────────────────────────
function renderIUCLID(cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const container=document.getElementById('iuclidContent');
  const templates=[
    {name:'Substance Identity (Section 1)',fn:IUCLID_XML_TEMPLATES.substanceIdentity},
    {name:'CLP Notification',fn:IUCLID_XML_TEMPLATES.clpNotification},
    {name:'Physical-Chemical Properties (Section 4)',fn:IUCLID_XML_TEMPLATES.physChemEndpoint},
    {name:'Chemical Safety Report Summary',fn:IUCLID_XML_TEMPLATES.csrSummary}
  ];
  container.innerHTML=`<div class="card" style="margin-bottom:1rem">
    <div style="font-weight:700;font-size:.95rem;margin-bottom:.3rem">IUCLID 6 Export — ${c.name}</div>
    <div style="font-size:.78rem;color:var(--t2);margin-bottom:.8rem">Generate XML fragments compatible with IUCLID 6 for import into your dossier. These are draft templates — review before submission to ECHA.</div>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap">${templates.map((t,i)=>`<button class="btn btn-outline btn-sm" onclick="showXmlPreview(${i},'${cas}')">${t.name}</button>`).join('')}
    <button class="btn btn-gold btn-sm" onclick="downloadAllXml('${cas}')">💾 Download All XML</button></div>
  </div><div id="xmlPreviewArea"></div>`;
}

function showXmlPreview(idx,cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const templates=[IUCLID_XML_TEMPLATES.substanceIdentity,IUCLID_XML_TEMPLATES.clpNotification,IUCLID_XML_TEMPLATES.physChemEndpoint,IUCLID_XML_TEMPLATES.csrSummary];
  const names=['substance-identity','clp-notification','physchem-endpoint','csr-summary'];
  const xml=templates[idx](c);
  const highlighted=xml.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/(&lt;\/?[\w:]+)/g,'<span class="tag">$1</span>').replace(/([\w:-]+)=/g,'<span class="attr">$1</span>=').replace(/"([^"]*)"/g,'"<span class="val">$1</span>"');
  document.getElementById('xmlPreviewArea').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
    <span style="font-size:.82rem;font-weight:600">${names[idx]}.xml</span>
    <button class="btn btn-sm btn-outline" onclick="downloadXml('${names[idx]}','${cas}',${idx})">⬇ Download</button>
  </div><div class="xml-preview">${highlighted}</div>`;
}

function downloadXml(name,cas,idx){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const templates=[IUCLID_XML_TEMPLATES.substanceIdentity,IUCLID_XML_TEMPLATES.clpNotification,IUCLID_XML_TEMPLATES.physChemEndpoint,IUCLID_XML_TEMPLATES.csrSummary];
  const xml=templates[idx](c);
  const blob=new Blob([xml],{type:'application/xml'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${name}_${cas}.xml`;a.click();
}

function downloadAllXml(cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const templates=[IUCLID_XML_TEMPLATES.substanceIdentity,IUCLID_XML_TEMPLATES.clpNotification,IUCLID_XML_TEMPLATES.physChemEndpoint,IUCLID_XML_TEMPLATES.csrSummary];
  const names=['substance-identity','clp-notification','physchem-endpoint','csr-summary'];
  templates.forEach((fn,i)=>{
    const xml=fn(c);const blob=new Blob([xml],{type:'application/xml'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${names[i]}_${cas}.xml`;
    setTimeout(()=>a.click(),i*300);
  });
}

// ─── SUBMISSION READINESS ────────────────────────────────────────────────
function renderSubmissionReadiness(cas){
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const band=TONNAGE_BANDS[c.tonnageBand];
  const dc=c.dossierCompleteness||{};
  const eps=band?band.endpoints:[];
  const missing=eps.filter(e=>(dc[e]||'missing')==='missing');
  const auth=AUTHORIZATION_ENTRIES[cas];
  const restrictions=ANNEX_XVII_RESTRICTIONS.filter(r=>r.substances.includes(cas));

  const checks=[
    {label:'Substance identity complete (IUPAC, CAS, EC, SMILES, InChI)',pass:!!(c.iupac&&c.cas&&c.ecNumber&&c.smiles),detail:'IUCLID Section 1'},
    {label:'CLP classification assigned',pass:c.clp&&c.clp.length>0,detail:c.harmonisedCLP?'Harmonised entry — Index '+c.clpIndex:'Self-classification'},
    {label:'REACH registration number assigned',pass:!!c.reach,detail:c.reach||'Not yet registered'},
    {label:`Tonnage band declared (${band?band.label:'—'})`,pass:!!c.tonnageBand,detail:`Annex ${band?band.annex:'—'} requirements apply`},
    {label:`All ${eps.length} required endpoints satisfied`,pass:missing.length===0,warn:missing.length>0&&missing.length<=3,detail:missing.length?`${missing.length} missing: ${missing.map(e=>ENDPOINT_META[e]?.name||e).join(', ')}`:'All endpoints complete, waived, or covered by read-across'},
    {label:'Chemical Safety Report (CSR) prepared',pass:!!c.csr,detail:c.csr?'CSR included in dossier':'CSR required for ≥10 t/y'},
    {label:'Exposure assessment conducted',pass:!!c.exposureAssessment,detail:c.exposureAssessment?'Exposure scenarios documented':'Required if classified as hazardous'},
    {label:'SVHC / Authorization status checked',pass:true,warn:!!auth,detail:auth?`SVHC since ${auth.candidateDate} — ${auth.reason}`:'Not on SVHC candidate list'},
    {label:'Annex XVII restriction compliance verified',pass:true,warn:restrictions.length>0,detail:restrictions.length?`${restrictions.length} restriction(s) apply — review conditions`:'No applicable restrictions'},
    {label:'Joint submission alignment confirmed',pass:!!c.jointSubmission,detail:c.jointSubmission?`Lead registrant: ${c.leadRegistrant}`:'Individual submission'},
    {label:'Registration fee calculated',pass:true,detail:band?`Standard fee: €${band.regFee.toLocaleString()}`:'—'}
  ];

  const passCount=checks.filter(ch=>ch.pass&&!ch.warn).length;
  const warnCount=checks.filter(ch=>ch.warn).length;
  const failCount=checks.filter(ch=>!ch.pass).length;

  const container=document.getElementById('submissionContent');
  container.innerHTML=`<div class="card" style="margin-bottom:1rem">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><span style="font-size:1.1rem;font-weight:800">${c.name}</span> <span style="font-size:.78rem;color:var(--t3)">— Submission Readiness</span></div>
      <div style="display:flex;gap:.5rem"><span class="pill pill-green">${passCount} Pass</span><span class="pill pill-orange">${warnCount} Warning</span><span class="pill pill-red">${failCount} Fail</span></div>
    </div>
  </div>
  <div class="checklist">${checks.map(ch=>`<div class="check-item">
    <div class="check-icon ${ch.pass?(ch.warn?'check-warn':'check-pass'):'check-fail'}">${ch.pass?(ch.warn?'⚠':'✓'):'✕'}</div>
    <div><div class="check-text">${ch.label}</div><div class="check-detail">${ch.detail}</div></div>
  </div>`).join('')}</div>
  <div style="margin-top:1rem;display:flex;gap:.4rem">
    <button class="btn btn-purple" onclick="askCopilot('Generate a complete submission readiness report for ${c.name} (CAS ${c.cas}), tonnage band ${c.tonnageBand}. List all blocking issues and recommended actions.')">🤖 AI Readiness Report</button>
    <button class="btn btn-outline" onclick="switchReachTab('iuclid');setTimeout(()=>renderIUCLID('${cas}'),50)">💾 Export IUCLID Files</button>
  </div>`;
}
