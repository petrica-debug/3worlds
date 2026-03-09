/* ═══════════════════════════════════════════════════════════════════════
   REACH ENGINE — Guided Registration Workflow with AI Intelligence
   5-step wizard: Identify → Scope → Gap Analysis → Draft → Submit
   ═══════════════════════════════════════════════════════════════════════ */

let workflowState = {
  step: 0,
  substance: null,
  tonnageBand: null,
  role: null,
  gaps: [],
  strategies: {},
  generatedDocs: {},
  aiAnalysis: {}
};

const WORKFLOW_STEPS = [
  { id: 'identify', label: 'Substance ID', icon: '🔬' },
  { id: 'scope', label: 'Regulatory Scope', icon: '📋' },
  { id: 'gaps', label: 'Gap Analysis', icon: '🔍' },
  { id: 'draft', label: 'Dossier Drafting', icon: '📝' },
  { id: 'submit', label: 'Submission', icon: '🚀' }
];

// ─── SUBSTANCE SEARCH (kept for compatibility) ──────────────────────────
function initSubstanceSearch() {
  const inp = document.getElementById('substanceSearch');
  const res = document.getElementById('searchResults');
  if (!inp || !res) return;
  renderSubstanceList(CHEMICALS_DB, res);
  inp.addEventListener('input', () => {
    const det = document.getElementById('substanceDetail');
    if (det) det.style.display = 'none';
    res.style.display = '';
    const q = inp.value.toLowerCase().trim();
    if (!q) { renderSubstanceList(CHEMICALS_DB, res); return; }
    renderSubstanceList(CHEMICALS_DB.filter(c =>
      c.name.toLowerCase().includes(q) || c.cas.includes(q) ||
      c.formula.toLowerCase().includes(q) || (c.ecNumber || '').includes(q)
    ), res);
  });
}

function renderSubstanceList(list, container) {
  if (!list.length) { container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--t3)">🔍 No substances found.</div>'; return; }
  container.innerHTML = list.map(c => {
    const band = TONNAGE_BANDS[c.tonnageBand];
    const dc = c.dossierCompleteness || {};
    const eps = band ? band.endpoints : [];
    const done = eps.filter(e => dc[e] === 'complete' || dc[e] === 'waived' || dc[e] === 'not_required' || dc[e] === 'read_across').length;
    const pct = eps.length ? Math.round(done / eps.length * 100) : 0;
    const pctColor = pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--red)';
    return `<div class="substance-row" onclick="startWorkflow('${c.cas}')">
      <div><div class="sr-name">${c.name}${c.svhc ? ' <span class="pill pill-red">SVHC</span>' : ''}${c.harmonisedCLP ? ' <span class="pill pill-blue">Harmonised CLP</span>' : ''}</div>
      <div class="sr-meta">CAS ${c.cas} · EC ${c.ecNumber || '—'} · ${c.formula} · MW ${c.mw} · ${band ? band.label : c.tonnageBand}</div></div>
      <div class="sr-right"><span style="font-size:.72rem;font-weight:700;color:${pctColor}">${pct}%</span>
      ${c.pictograms.slice(0, 4).map(p => `<span style="font-size:.9rem" title="${GHS_PICTOGRAMS[p]?.name || p}">${GHS_PICTOGRAMS[p]?.icon || ''}</span>`).join('')}
      <button class="btn btn-gold btn-sm" onclick="event.stopPropagation();startWorkflow('${c.cas}')">Start Registration →</button>
      </div></div>`;
  }).join('');
}

// ─── WORKFLOW ENGINE ────────────────────────────────────────────────────
function startWorkflow(cas) {
  const c = CHEMICALS_DB.find(x => x.cas === cas);
  if (!c) return;

  workflowState = {
    step: 0, substance: c, tonnageBand: c.tonnageBand,
    role: null, gaps: [], strategies: {}, generatedDocs: {}, aiAnalysis: {}
  };

  copilotContext = {
    substance: c,
    auth: AUTHORIZATION_ENTRIES[cas],
    dnelData: DNEL_PNEC[cas],
    transport: UN_TRANSPORT[cas],
    restrictions: ANNEX_XVII_RESTRICTIONS.filter(r => r.substances.includes(cas))
  };

  document.getElementById('searchResults').style.display = 'none';
  const det = document.getElementById('substanceDetail');
  if (det) det.style.display = 'none';

  const wf = document.getElementById('workflowContainer');
  if (wf) wf.style.display = 'block';

  renderWorkflow();
}

function renderWorkflow() {
  const container = document.getElementById('workflowContainer');
  if (!container) return;

  const stepsHtml = WORKFLOW_STEPS.map((s, i) => {
    const state = i < workflowState.step ? 'done' : i === workflowState.step ? 'active' : 'pending';
    return `<div class="wf-step ${state}" onclick="${i <= workflowState.step ? 'goToStep(' + i + ')' : ''}">
      <div class="wf-step-icon">${state === 'done' ? '✓' : s.icon}</div>
      <div class="wf-step-label">${s.label}</div>
    </div>`;
  }).join('<div class="wf-step-line"></div>');

  container.innerHTML = `
    <div class="wf-header">
      <div class="wf-title-row">
        <div>
          <h2 class="wf-title">REACH Registration Workflow</h2>
          <div class="wf-subtitle">${workflowState.substance.name} · CAS ${workflowState.substance.cas} · ${TONNAGE_BANDS[workflowState.tonnageBand]?.label || ''}</div>
        </div>
        <div style="display:flex;gap:.4rem">
          <button class="btn btn-outline btn-sm" onclick="exitWorkflow()">✕ Exit</button>
          <button class="btn btn-purple btn-sm" onclick="askCopilot('Give me a complete regulatory overview of ${workflowState.substance.name} (CAS ${workflowState.substance.cas}). Cover registration status, CLP classification, SVHC status, restrictions, and key compliance concerns.')">🧠 AI Overview</button>
        </div>
      </div>
      <div class="wf-steps">${stepsHtml}</div>
    </div>
    <div class="wf-body" id="wfBody"></div>`;

  renderStep(workflowState.step);
}

function goToStep(i) {
  workflowState.step = i;
  renderWorkflow();
}

function nextStep() {
  if (workflowState.step < WORKFLOW_STEPS.length - 1) {
    workflowState.step++;
    renderWorkflow();
  }
}

function exitWorkflow() {
  document.getElementById('workflowContainer').style.display = 'none';
  document.getElementById('searchResults').style.display = '';
  workflowState.step = 0;
}

function renderStep(step) {
  const body = document.getElementById('wfBody');
  if (!body) return;
  const renderers = [renderStep1_Identify, renderStep2_Scope, renderStep3_Gaps, renderStep4_Draft, renderStep5_Submit];
  renderers[step](body);
}

// ─── STEP 1: SUBSTANCE IDENTIFICATION ───────────────────────────────────
function renderStep1_Identify(container) {
  const c = workflowState.substance;
  const auth = AUTHORIZATION_ENTRIES[c.cas];
  const restrictions = ANNEX_XVII_RESTRICTIONS.filter(r => r.substances.includes(c.cas));
  const transport = UN_TRANSPORT[c.cas];

  container.innerHTML = `
    <div class="wf-step-header">
      <h3>Step 1: Substance Identification & Verification</h3>
      <p>Verify substance identity data for IUCLID Section 1. The AI will validate completeness.</p>
    </div>

    <div class="wf-grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:.6rem">Substance Identity</div>
        <table class="dp-table">
          <tr><td>IUPAC Name</td><td>${c.iupac || c.name}</td></tr>
          <tr><td>CAS Number</td><td>${c.cas}</td></tr>
          <tr><td>EC Number</td><td>${c.ecNumber || '—'}</td></tr>
          <tr><td>Molecular Formula</td><td>${c.formula}</td></tr>
          <tr><td>Molecular Weight</td><td>${c.mw} g/mol</td></tr>
          <tr><td>SMILES</td><td style="font-size:.7rem;word-break:break-all">${c.smiles || '—'}</td></tr>
          <tr><td>InChI</td><td style="font-size:.65rem;word-break:break-all">${c.inchi || '—'}</td></tr>
          <tr><td>Physical State</td><td>${c.state}</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:.6rem">Registration Status</div>
        <table class="dp-table">
          <tr><td>REACH Reg. No.</td><td>${c.reach || '<span class="pill pill-red">Not registered</span>'}</td></tr>
          <tr><td>Registration Type</td><td>${c.registrationType || '—'}</td></tr>
          <tr><td>Joint Submission</td><td>${c.jointSubmission ? 'Yes — ' + c.leadRegistrant : 'Individual'}</td></tr>
          <tr><td>Tonnage Band</td><td>${TONNAGE_BANDS[c.tonnageBand]?.label || c.tonnageBand}</td></tr>
          <tr><td>SVHC Status</td><td>${c.svhc ? '<span class="pill pill-red">Candidate List</span>' : '<span class="pill pill-green">Not SVHC</span>'}</td></tr>
          <tr><td>CLP</td><td>${c.harmonisedCLP ? '<span class="pill pill-blue">Harmonised</span> ' + c.clpIndex : '<span class="pill pill-orange">Self-classified</span>'}</td></tr>
          <tr><td>Signal Word</td><td><strong style="color:${c.signal === 'Danger' ? 'var(--red)' : 'var(--gold)'}">${c.signal}</strong></td></tr>
          <tr><td>ECHA</td><td><a href="${c.echaUrl || '#'}" target="_blank">View on ECHA →</a></td></tr>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title" style="margin-bottom:.6rem">CLP Classification</div>
      <div style="margin-bottom:.5rem">${c.clp.map(cl => {
        const col = cl.includes('Carc') || cl.includes('Muta') || cl.includes('Repr') ? 'red' : cl.includes('Acute Tox') ? 'red' : cl.includes('Flam') || cl.includes('Ox.') ? 'orange' : cl.includes('Aquatic') ? 'green' : cl.includes('Skin Corr') || cl.includes('Resp. Sens') ? 'purple' : 'gold';
        return `<span class="pill pill-${col}">${cl}</span>`;
      }).join('')}</div>
      <div style="margin-bottom:.4rem">${c.pictograms.map(p => `<span class="pictogram">${GHS_PICTOGRAMS[p]?.icon || ''} ${p}</span>`).join('')}</div>
      <div style="font-size:.75rem;color:var(--t2);margin-top:.4rem">
        <strong>H-statements:</strong> ${c.hStatements.map(h => `${h} (${H_STATEMENTS[h] || ''})`).join('; ')}
      </div>
    </div>

    ${auth ? `<div class="card wf-alert-card" style="margin-top:.8rem">
      <div style="font-weight:700;color:var(--red);margin-bottom:.4rem">⚠ SVHC / Authorization Alert</div>
      <div style="font-size:.78rem;color:var(--t2)">
        Candidate List since ${auth.candidateDate}. Reason: ${auth.reason}.<br>
        ${auth.annexXIV ? `<strong>Annex XIV listed</strong> — Sunset: ${auth.sunsetDate}. Authorization required.` : 'Not yet on Annex XIV.'}
        <br>Alternatives: ${auth.alternatives.join(', ')}
      </div>
    </div>` : ''}

    ${restrictions.length ? `<div class="card wf-alert-card" style="margin-top:.8rem;border-color:rgba(249,115,22,.3)">
      <div style="font-weight:700;color:var(--orange);margin-bottom:.4rem">⚠ Annex XVII Restrictions</div>
      ${restrictions.map(r => `<div style="font-size:.78rem;color:var(--t2);margin-bottom:.3rem"><strong>Entry ${r.entry}:</strong> ${r.condition}</div>`).join('')}
    </div>` : ''}

    <div class="wf-actions">
      <button class="btn btn-purple" onclick="askCopilot('Validate the substance identity for ${c.name} (CAS ${c.cas}). Check if all required IUCLID Section 1 fields are complete. Flag any issues with the identifiers (CAS, EC, SMILES, InChI). Assess if this is a mono-constituent, multi-constituent, or UVCB substance and what additional characterization might be needed.')">🧠 AI: Validate Identity</button>
      <button class="btn btn-gold" onclick="nextStep()">Continue to Regulatory Scope →</button>
    </div>`;
}

// ─── STEP 2: REGULATORY SCOPING ─────────────────────────────────────────
function renderStep2_Scope(container) {
  const c = workflowState.substance;
  const band = TONNAGE_BANDS[c.tonnageBand];
  const dc = c.dossierCompleteness || {};
  const eps = band ? band.endpoints : [];
  const auth = AUTHORIZATION_ENTRIES[c.cas];

  const annexGroups = {};
  eps.forEach(e => {
    const meta = ENDPOINT_META[e] || {};
    const annex = meta.annex || 'Other';
    if (!annexGroups[annex]) annexGroups[annex] = [];
    annexGroups[annex].push({ key: e, ...meta, status: dc[e] || 'missing' });
  });

  const totalCost = eps.reduce((s, e) => s + (ENDPOINT_META[e]?.cost || 0), 0);
  const missingCost = eps.filter(e => (dc[e] || 'missing') === 'missing').reduce((s, e) => s + (ENDPOINT_META[e]?.cost || 0), 0);

  container.innerHTML = `
    <div class="wf-step-header">
      <h3>Step 2: Regulatory Scoping</h3>
      <p>Determine applicable requirements based on tonnage band, substance properties, and regulatory status.</p>
    </div>

    <div class="wf-grid-3">
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--gold)">${band?.label || '—'}</div>
        <div class="wf-metric-label">Tonnage Band</div>
        <div class="wf-metric-sub">Annex ${band?.annex || '—'}</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--blue)">${eps.length}</div>
        <div class="wf-metric-label">Required Endpoints</div>
        <div class="wf-metric-sub">€${totalCost.toLocaleString()} total if all tested</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--red)">€${band?.regFee?.toLocaleString() || '—'}</div>
        <div class="wf-metric-label">Registration Fee</div>
        <div class="wf-metric-sub">Standard (SME discounts available)</div>
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title" style="margin-bottom:.6rem">Your Role in the Registration</div>
      <div class="wf-role-grid">
        <div class="wf-role-option ${workflowState.role === 'lead' ? 'selected' : ''}" onclick="setRole('lead')">
          <div class="wf-role-icon">👑</div>
          <div class="wf-role-name">Lead Registrant</div>
          <div class="wf-role-desc">Full dossier responsibility. Submit joint dossier on behalf of co-registrants.</div>
        </div>
        <div class="wf-role-option ${workflowState.role === 'member' ? 'selected' : ''}" onclick="setRole('member')">
          <div class="wf-role-icon">🤝</div>
          <div class="wf-role-name">Member Registrant</div>
          <div class="wf-role-desc">Submit own dossier referencing joint data. Letter of Access required.</div>
        </div>
        <div class="wf-role-option ${workflowState.role === 'individual' ? 'selected' : ''}" onclick="setRole('individual')">
          <div class="wf-role-icon">📄</div>
          <div class="wf-role-name">Individual Registrant</div>
          <div class="wf-role-desc">Full individual dossier. Opt-out from joint submission (requires justification).</div>
        </div>
        <div class="wf-role-option ${workflowState.role === 'only' ? 'selected' : ''}" onclick="setRole('only')">
          <div class="wf-role-icon">🆕</div>
          <div class="wf-role-name">Only Registrant</div>
          <div class="wf-role-desc">First/sole registrant for this substance. Full dossier + inquiry to ECHA.</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title" style="margin-bottom:.6rem">Required Information by Annex</div>
      ${Object.entries(annexGroups).map(([annex, endpoints]) => `
        <div style="margin-bottom:.8rem">
          <div style="font-size:.72rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:.4rem">Annex ${annex} (${endpoints.length} endpoints)</div>
          <div class="endpoint-grid">${endpoints.map(ep => {
            const statusLabel = { complete: 'Complete', waived: 'Waived', read_across: 'Read-across', missing: 'Missing', not_required: 'N/A' }[ep.status] || ep.status;
            return `<div class="ep-row">
              <span class="ep-annex">${ep.iuclidSection || ''}</span>
              <span class="ep-name">${ep.name || ep.key}</span>
              <span class="ep-status ep-${ep.status}">${statusLabel}</span>
              <span class="ep-cost">${ep.status === 'missing' ? '€' + ((ep.cost || 0) / 1000).toFixed(0) + 'K' : ''}</span>
            </div>`;
          }).join('')}</div>
        </div>`).join('')}
    </div>

    ${auth ? `<div class="card wf-alert-card" style="margin-top:.8rem">
      <div style="font-weight:700;color:var(--red);margin-bottom:.3rem">⚠ Authorization Implications</div>
      <div style="font-size:.78rem;color:var(--t2)">${auth.annexXIV ?
        'This substance is on Annex XIV. Registration alone is not sufficient — you must also apply for authorization or demonstrate an exemption.' :
        'This substance is on the SVHC Candidate List. Article 33 communication obligations apply. Monitor for potential Annex XIV inclusion.'}</div>
    </div>` : ''}

    <div class="wf-actions">
      <button class="btn btn-outline" onclick="goToStep(0)">← Back</button>
      <button class="btn btn-purple" onclick="askCopilot('For ${c.name} (CAS ${c.cas}) at ${band?.label || ''} tonnage band: 1) Confirm the applicable REACH Annexes and information requirements. 2) Identify any column 2 adaptations that could reduce testing. 3) Estimate the total timeline for completing the registration. 4) Flag any special considerations (SVHC, CMR, PBT). 5) Recommend the optimal registration strategy.')">🧠 AI: Registration Strategy</button>
      <button class="btn btn-gold" onclick="nextStep()">Continue to Gap Analysis →</button>
    </div>`;
}

function setRole(role) {
  workflowState.role = role;
  document.querySelectorAll('.wf-role-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

// ─── STEP 3: DATA GAP ANALYSIS ──────────────────────────────────────────
function renderStep3_Gaps(container) {
  const c = workflowState.substance;
  const band = TONNAGE_BANDS[c.tonnageBand];
  const dc = c.dossierCompleteness || {};
  const eps = band ? band.endpoints : [];
  const missing = eps.filter(e => (dc[e] || 'missing') === 'missing');
  const waived = eps.filter(e => dc[e] === 'waived');
  const readAcrossEps = eps.filter(e => dc[e] === 'read_across');
  const complete = eps.filter(e => dc[e] === 'complete');
  const notRequired = eps.filter(e => dc[e] === 'not_required');
  const satisfied = complete.length + waived.length + notRequired.length + readAcrossEps.length;
  const pct = eps.length ? Math.round(satisfied / eps.length * 100) : 0;
  const missingCost = missing.reduce((s, e) => s + (ENDPOINT_META[e]?.cost || 0), 0);

  const groups = READ_ACROSS_GROUPS.filter(g => g.members.includes(c.cas));

  container.innerHTML = `
    <div class="wf-step-header">
      <h3>Step 3: Data Gap Analysis & Strategy</h3>
      <p>AI-powered analysis of each endpoint — with waiver, read-across, and testing recommendations.</p>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
        <div><span style="font-size:1.1rem;font-weight:800">${c.name}</span> <span style="font-size:.78rem;color:var(--t3)">— ${band?.label || ''}</span></div>
        <span style="font-size:1.5rem;font-weight:800;color:${pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--red)'}">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct >= 90 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--red)'}"></div></div>
      <div style="display:flex;gap:1rem;margin-top:.6rem;font-size:.72rem">
        <span style="color:var(--green)">● ${complete.length} Complete</span>
        <span style="color:var(--orange)">● ${waived.length} Waived</span>
        <span style="color:var(--blue)">● ${readAcrossEps.length} Read-across</span>
        <span style="color:var(--red)">● ${missing.length} Missing</span>
        <span style="color:var(--t3)">● ${notRequired.length} N/A</span>
      </div>
      ${missing.length > 0 ? `<div style="margin-top:.6rem;padding:.5rem;background:var(--red-d);border:1px solid rgba(239,68,68,.15);border-radius:8px;font-size:.78rem;color:var(--red)">
        ⚠ ${missing.length} endpoint${missing.length > 1 ? 's' : ''} missing — estimated cost if all tested: <strong>€${missingCost.toLocaleString()}</strong>
      </div>` : '<div style="margin-top:.6rem;padding:.5rem;background:var(--green-d);border:1px solid rgba(16,185,129,.15);border-radius:8px;font-size:.78rem;color:var(--green)">✓ All endpoints satisfied — dossier is data-complete</div>'}
    </div>

    ${missing.length > 0 ? `
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title" style="margin-bottom:.6rem;color:var(--red)">Missing Endpoints — Action Required</div>
      <div class="endpoint-grid">${missing.map(e => {
        const meta = ENDPOINT_META[e] || {};
        const guidance = AI_COPILOT_RULES.dossierGaps[e] || '';
        return `<div class="ep-row ep-row-expandable" onclick="this.classList.toggle('expanded')">
          <div style="display:flex;align-items:center;gap:.6rem;flex:1">
            <span class="ep-annex">${meta.annex || ''}</span>
            <div style="flex:1">
              <div class="ep-name">${meta.name || e}</div>
              <div class="ep-guidance">${meta.guideline || ''} · IUCLID ${meta.iuclidSection || ''} · ${meta.waivable ? 'Waiver possible' : 'No standard waiver'}</div>
            </div>
            <span class="ep-cost">€${((meta.cost || 0) / 1000).toFixed(0)}K</span>
            <button class="btn btn-purple btn-sm" onclick="event.stopPropagation();askCopilot('For ${c.name}: Provide a detailed strategy for the ${meta.name || e} endpoint (${meta.annex}, ${meta.guideline}). Consider: 1) Is a waiver possible under Annex XI? Which section? 2) Can read-across be used? From which analogues? 3) Are there QSAR models available? 4) What is the minimum testing needed? 5) Draft the IUCLID justification text if a waiver is recommended. 6) Estimated cost and timeline.')">🧠 AI Strategy</button>
          </div>
          <div class="ep-expanded-content">
            <div style="font-size:.75rem;color:var(--t2);line-height:1.6;padding:.5rem 0">${guidance}</div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>` : ''}

    ${groups.length > 0 ? `
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title" style="margin-bottom:.6rem">Available Read-Across Groups</div>
      ${groups.map(g => `<div style="padding:.6rem;background:var(--s2);border:1px solid var(--border);border-radius:8px;margin-bottom:.4rem">
        <div style="font-weight:600;font-size:.85rem;margin-bottom:.3rem">${g.groupName} <span class="pill pill-${g.confidence === 'High' ? 'green' : g.confidence === 'Medium' ? 'orange' : 'red'}">${g.confidence}</span></div>
        <div style="font-size:.75rem;color:var(--t2);margin-bottom:.3rem">${g.justification.substring(0, 150)}...</div>
        <div style="font-size:.72rem">Endpoints: ${g.endpoints.map(e => `<span class="pill pill-blue">${ENDPOINT_META[e]?.name || e}</span>`).join('')}</div>
      </div>`).join('')}
    </div>` : ''}

    <div class="wf-actions">
      <button class="btn btn-outline" onclick="goToStep(1)">← Back</button>
      <button class="btn btn-purple" onclick="askCopilot('For ${c.name} (CAS ${c.cas}), perform a comprehensive gap analysis. For each missing endpoint, recommend the optimal strategy (test, waive, read-across, QSAR). Prioritize cost savings. Calculate the total optimized budget vs full testing budget. Provide a timeline estimate. Draft any waiver justification texts that could be used directly in IUCLID.')">🧠 AI: Full Gap Analysis</button>
      <button class="btn btn-gold" onclick="nextStep()">Continue to Dossier Drafting →</button>
    </div>`;
}

// ─── STEP 4: DOSSIER DRAFTING & FILE GENERATION ─────────────────────────
function renderStep4_Draft(container) {
  const c = workflowState.substance;
  const band = TONNAGE_BANDS[c.tonnageBand];

  const iuclidFiles = typeof getIUCLIDFileList === 'function' ? getIUCLIDFileList(c) : [];
  const xmlCount = iuclidFiles.length;

  container.innerHTML = `
    <div class="wf-step-header">
      <h3>Step 4: Dossier Drafting & Submission Files</h3>
      <p>Generate all IUCLID XML files and regulatory documents needed for ECHA submission. Download, review, sign, and upload to REACH-IT.</p>
    </div>

    <div class="wf-grid-3">
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--green)">${xmlCount}</div>
        <div class="wf-metric-label">IUCLID XML Files</div>
        <div class="wf-metric-sub">Ready for IUCLID 6 import</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--gold)">3</div>
        <div class="wf-metric-label">AI Documents</div>
        <div class="wf-metric-sub">CSR, eSDS, Inquiry Letter</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--blue)">${band?.annex || '—'}</div>
        <div class="wf-metric-label">REACH Annex</div>
        <div class="wf-metric-sub">${band?.label || ''}</div>
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem">
        <div class="card-title" style="margin-bottom:0">IUCLID 6 Submission Package</div>
        <button class="btn btn-gold btn-sm" onclick="downloadIUCLIDPackage('${c.cas}')">Download All XML Files</button>
      </div>
      <p style="font-size:.75rem;color:var(--t2);margin-bottom:.8rem">These XML files follow IUCLID 6 schema and can be imported directly into your IUCLID installation. Review and edit before submission via REACH-IT.</p>
      <div class="file-grid">
        ${iuclidFiles.map((f, i) => `<div class="file-card" onclick="previewIUCLIDFile(${i},'${c.cas}')">
          <div class="file-icon file-icon-xml">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="file-info">
            <div class="file-name">${f.name}</div>
            <div class="file-desc">${f.description}</div>
            <div class="file-status"><span class="pill pill-green" style="margin:0">Ready</span></div>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title">AI-Generated Regulatory Documents</div>
      <p style="font-size:.75rem;color:var(--t2);margin-bottom:.8rem">Use 3Worlds AI to draft professional regulatory documents. Click to generate via AI — each document is a starting draft for expert review.</p>
      <div class="wf-doc-grid">
        <div class="wf-doc-card" onclick="generateDoc('csr')">
          <div class="wf-doc-icon">📊</div>
          <div class="wf-doc-title">Chemical Safety Report</div>
          <div class="wf-doc-desc">Full CSR with hazard, exposure, and risk characterisation.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('esds')">
          <div class="wf-doc-icon">📄</div>
          <div class="wf-doc-title">Extended SDS</div>
          <div class="wf-doc-desc">16-section eSDS per Regulation (EU) 2020/878.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('waiver')">
          <div class="wf-doc-icon">📝</div>
          <div class="wf-doc-title">Waiver Justifications</div>
          <div class="wf-doc-desc">Annex XI justifications for waived endpoints.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('readacross')">
          <div class="wf-doc-icon">🔗</div>
          <div class="wf-doc-title">Read-Across Report</div>
          <div class="wf-doc-desc">RAAF-compliant read-across justification.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('exposure')">
          <div class="wf-doc-icon">🏭</div>
          <div class="wf-doc-title">Exposure Scenarios</div>
          <div class="wf-doc-desc">Contributing scenarios, OCs, RMMs, RCRs.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('robust')">
          <div class="wf-doc-icon">🔬</div>
          <div class="wf-doc-title">Robust Study Summaries</div>
          <div class="wf-doc-desc">RSS templates for endpoint study records.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('inquiry')">
          <div class="wf-doc-icon">📨</div>
          <div class="wf-doc-title">ECHA Inquiry Letter</div>
          <div class="wf-doc-desc">Article 26 pre-registration inquiry.</div>
          <span class="pill pill-gold">AI Draft</span>
        </div>
        <div class="wf-doc-card" onclick="generateDoc('iuclid_old')">
          <div class="wf-doc-icon">💾</div>
          <div class="wf-doc-title">Legacy XML Export</div>
          <div class="wf-doc-desc">Original 4-file IUCLID export.</div>
          <span class="pill pill-blue">XML</span>
        </div>
      </div>
    </div>

    <div id="docPreviewArea" style="margin-top:.8rem"></div>

    <div class="wf-actions">
      <button class="btn btn-outline" onclick="goToStep(2)">← Back</button>
      <button class="btn btn-purple" onclick="askCopilot('For ${c.name} (CAS ${c.cas}), generate a complete Chemical Safety Report (CSR) outline following ECHA Guidance on Information Requirements (Chapter R). Include: Part A (risk management measures summary), Part B (hazard assessment for each endpoint with available data, exposure assessment with DNELs/PNECs, risk characterisation). Make it detailed and regulatory-quality.')">AI: Draft Full CSR</button>
      <button class="btn btn-gold" onclick="nextStep()">Continue to Submission →</button>
    </div>`;
}

function previewIUCLIDFile(idx, cas) {
  const c = CHEMICALS_DB.find(x => x.cas === cas);
  if (!c || typeof generateAllIUCLIDFiles !== 'function') return;
  const files = generateAllIUCLIDFiles(c);
  if (!files[idx]) return;
  const f = files[idx];
  const xml = f.xml;
  const highlighted = xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;\/?[\w:]+)/g, '<span class="tag">$1</span>')
    .replace(/([\w:-]+)=/g, '<span class="attr">$1</span>=')
    .replace(/"([^"]*)"/g, '"<span class="val">$1</span>"');

  const area = document.getElementById('docPreviewArea');
  area.innerHTML = `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
      <div>
        <div style="font-weight:700;font-size:.85rem">${f.name}</div>
        <div style="font-size:.68rem;color:var(--t3)">${f.filename} — ${f.description}</div>
      </div>
      <button class="btn btn-gold btn-sm" onclick="downloadSingleIUCLIDFile(${idx},'${cas}')">Download</button>
    </div>
    <div class="xml-preview">${highlighted}</div>
  </div>`;
  area.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadSingleIUCLIDFile(idx, cas) {
  const c = CHEMICALS_DB.find(x => x.cas === cas);
  if (!c || typeof generateAllIUCLIDFiles !== 'function') return;
  const files = generateAllIUCLIDFiles(c);
  if (!files[idx]) return;
  const f = files[idx];
  const blob = new Blob([f.xml], { type: 'application/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = f.filename;
  a.click();
}

function generateDoc(type) {
  const c = workflowState.substance;
  const prompts = {
    csr: `Generate a detailed Chemical Safety Report (CSR) for ${c.name} (CAS ${c.cas}). Structure it per ECHA guidance: 1) Substance identity, 2) Hazard classification summary, 3) Environmental hazard assessment (PNECs), 4) Human health hazard assessment (DNELs), 5) Exposure assessment summary, 6) Risk characterisation. Use the substance data I provided. Make it professional regulatory quality.`,
    esds: `Generate the key sections of an extended Safety Data Sheet for ${c.name} (CAS ${c.cas}) per Regulation (EU) 2020/878. Focus on Sections 1-3, 8, 11, 14, and 15 with substance-specific content. Include proper regulatory references.`,
    iuclid_old: 'iuclid_export',
    waiver: `For ${c.name} (CAS ${c.cas}), draft Annex XI waiver justification texts for all waived endpoints. For each waiver, provide: 1) Legal basis (specific Annex XI section), 2) Scientific justification (why testing is not needed), 3) Supporting evidence, 4) Conclusion. Format each as a standalone text that could be pasted into IUCLID.`,
    readacross: `For ${c.name} (CAS ${c.cas}), draft a RAAF-compliant read-across justification. Include: 1) Hypothesis (which RAAF scenario applies), 2) Source and target substance identification, 3) Structural similarity assessment, 4) Mechanistic plausibility, 5) Data matrix showing available data, 6) Uncertainty analysis, 7) Conclusion on acceptability.`,
    exposure: `For ${c.name} (CAS ${c.cas}), draft exposure scenarios for the main identified uses. For each scenario include: 1) Title and use descriptor, 2) Contributing scenarios with PROC/ERC, 3) Operational conditions (duration, frequency, concentration), 4) Risk management measures (PPE, LEV), 5) Exposure estimates, 6) RCR calculations. Use ECETOC TRA methodology.`,
    robust: `For ${c.name} (CAS ${c.cas}), draft robust study summary templates for the key toxicological endpoints (acute toxicity, skin irritation, eye irritation, skin sensitisation, mutagenicity). For each, include: Administrative data (guideline, GLP, reliability), Materials and methods, Results, Applicant's summary and conclusion. Format per IUCLID requirements.`,
    inquiry: `Draft an ECHA pre-registration inquiry letter for ${c.name} (CAS ${c.cas}) under Article 26 of REACH. Include: 1) Substance identity, 2) Tonnage band, 3) Request for existing registrant data, 4) Willingness to share costs, 5) Contact details placeholder. Make it formal and ready to submit.`
  };

  if (type === 'iuclid_old') {
    renderIUCLIDExport(c);
    return;
  }

  askCopilot(prompts[type]);
}

function renderIUCLIDExport(c) {
  const area = document.getElementById('docPreviewArea');
  const templates = [
    { name: 'Substance Identity (Section 1)', fn: IUCLID_XML_TEMPLATES.substanceIdentity },
    { name: 'CLP Notification', fn: IUCLID_XML_TEMPLATES.clpNotification },
    { name: 'Physical-Chemical Properties (Section 4)', fn: IUCLID_XML_TEMPLATES.physChemEndpoint },
    { name: 'Chemical Safety Report Summary', fn: IUCLID_XML_TEMPLATES.csrSummary }
  ];

  area.innerHTML = `<div class="card">
    <div class="card-title" style="margin-bottom:.6rem">IUCLID 6 XML Export — ${c.name}</div>
    <div style="font-size:.78rem;color:var(--t2);margin-bottom:.8rem">These XML fragments are compatible with IUCLID 6 for import into your dossier.</div>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap">
      ${templates.map((t, i) => `<button class="btn btn-outline btn-sm" onclick="showXmlPreview(${i},'${c.cas}')">${t.name}</button>`).join('')}
      <button class="btn btn-gold btn-sm" onclick="downloadAllXml('${c.cas}')">💾 Download All</button>
    </div>
    <div id="xmlPreviewArea" style="margin-top:.8rem"></div>
  </div>`;
}

// kept from original for XML functionality
function showXmlPreview(idx, cas) {
  const c = CHEMICALS_DB.find(x => x.cas === cas); if (!c) return;
  const templates = [IUCLID_XML_TEMPLATES.substanceIdentity, IUCLID_XML_TEMPLATES.clpNotification, IUCLID_XML_TEMPLATES.physChemEndpoint, IUCLID_XML_TEMPLATES.csrSummary];
  const names = ['substance-identity', 'clp-notification', 'physchem-endpoint', 'csr-summary'];
  const xml = templates[idx](c);
  const highlighted = xml.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(&lt;\/?[\w:]+)/g, '<span class="tag">$1</span>').replace(/([\w:-]+)=/g, '<span class="attr">$1</span>=').replace(/"([^"]*)"/g, '"<span class="val">$1</span>"');
  document.getElementById('xmlPreviewArea').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
    <span style="font-size:.82rem;font-weight:600">${names[idx]}.xml</span>
    <button class="btn btn-sm btn-outline" onclick="downloadXml('${names[idx]}','${cas}',${idx})">⬇ Download</button>
  </div><div class="xml-preview">${highlighted}</div>`;
}

function downloadXml(name, cas, idx) {
  const c = CHEMICALS_DB.find(x => x.cas === cas); if (!c) return;
  const templates = [IUCLID_XML_TEMPLATES.substanceIdentity, IUCLID_XML_TEMPLATES.clpNotification, IUCLID_XML_TEMPLATES.physChemEndpoint, IUCLID_XML_TEMPLATES.csrSummary];
  const xml = templates[idx](c);
  const blob = new Blob([xml], { type: 'application/xml' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}_${cas}.xml`; a.click();
}

function downloadAllXml(cas) {
  const c = CHEMICALS_DB.find(x => x.cas === cas); if (!c) return;
  const templates = [IUCLID_XML_TEMPLATES.substanceIdentity, IUCLID_XML_TEMPLATES.clpNotification, IUCLID_XML_TEMPLATES.physChemEndpoint, IUCLID_XML_TEMPLATES.csrSummary];
  const names = ['substance-identity', 'clp-notification', 'physchem-endpoint', 'csr-summary'];
  templates.forEach((fn, i) => {
    const xml = fn(c); const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${names[i]}_${cas}.xml`;
    setTimeout(() => a.click(), i * 300);
  });
}

// ─── STEP 5: SUBMISSION PREPARATION ─────────────────────────────────────
function renderStep5_Submit(container) {
  const c = workflowState.substance;
  const band = TONNAGE_BANDS[c.tonnageBand];
  const dc = c.dossierCompleteness || {};
  const eps = band ? band.endpoints : [];
  const missing = eps.filter(e => (dc[e] || 'missing') === 'missing');
  const auth = AUTHORIZATION_ENTRIES[c.cas];
  const restrictions = ANNEX_XVII_RESTRICTIONS.filter(r => r.substances.includes(c.cas));

  const checks = [
    { label: 'Substance identity complete (IUPAC, CAS, EC, SMILES, InChI)', pass: !!(c.iupac && c.cas && c.ecNumber && c.smiles), detail: 'IUCLID Section 1', critical: true },
    { label: 'CLP classification assigned', pass: c.clp && c.clp.length > 0, detail: c.harmonisedCLP ? 'Harmonised — Index ' + c.clpIndex : 'Self-classification', critical: true },
    { label: 'REACH registration number', pass: !!c.reach, detail: c.reach || 'Required — submit via REACH-IT', critical: false },
    { label: `Tonnage band declared (${band ? band.label : '—'})`, pass: !!c.tonnageBand, detail: `Annex ${band ? band.annex : '—'}`, critical: true },
    { label: `All ${eps.length} required endpoints satisfied`, pass: missing.length === 0, warn: missing.length > 0 && missing.length <= 3, detail: missing.length ? `${missing.length} missing: ${missing.map(e => ENDPOINT_META[e]?.name || e).join(', ')}` : 'All endpoints complete', critical: true },
    { label: 'Chemical Safety Report (CSR)', pass: !!c.csr, detail: c.csr ? 'CSR prepared' : 'Required for ≥10 t/y', critical: true },
    { label: 'Exposure assessment', pass: !!c.exposureAssessment, detail: c.exposureAssessment ? 'Exposure scenarios documented' : 'Required if classified hazardous', critical: true },
    { label: 'SVHC / Authorization check', pass: true, warn: !!auth, detail: auth ? `SVHC since ${auth.candidateDate}` : 'Not SVHC', critical: false },
    { label: 'Annex XVII restriction compliance', pass: true, warn: restrictions.length > 0, detail: restrictions.length ? `${restrictions.length} restriction(s) apply` : 'No restrictions', critical: false },
    { label: 'Joint submission alignment', pass: !!c.jointSubmission, detail: c.jointSubmission ? `Lead: ${c.leadRegistrant}` : 'Individual', critical: false },
    { label: 'Registration fee', pass: true, detail: band ? `€${band.regFee.toLocaleString()} (standard)` : '—', critical: false },
    { label: 'IUCLID Validation Assistant', pass: false, detail: 'Run validation in IUCLID before submission', critical: true },
    { label: 'ECHA Dossier Quality Check', pass: false, detail: 'Recommended before submission to REACH-IT', critical: false }
  ];

  const passCount = checks.filter(ch => ch.pass && !ch.warn).length;
  const warnCount = checks.filter(ch => ch.warn).length;
  const failCount = checks.filter(ch => !ch.pass).length;
  const readiness = Math.round(passCount / checks.length * 100);

  container.innerHTML = `
    <div class="wf-step-header">
      <h3>Step 5: Submission Preparation</h3>
      <p>Final checklist before submitting to ECHA via REACH-IT. AI can generate a complete submission readiness report.</p>
    </div>

    <div class="wf-grid-3">
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:${readiness >= 80 ? 'var(--green)' : readiness >= 50 ? 'var(--orange)' : 'var(--red)'}">${readiness}%</div>
        <div class="wf-metric-label">Submission Readiness</div>
        <div class="wf-metric-sub">${passCount} pass · ${warnCount} warn · ${failCount} fail</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--gold)">€${band?.regFee?.toLocaleString() || '—'}</div>
        <div class="wf-metric-label">Registration Fee</div>
        <div class="wf-metric-sub">SME: 50-95% discount</div>
      </div>
      <div class="card wf-metric-card">
        <div class="wf-metric-val" style="color:var(--blue)">${c.registrationType || 'Standard'}</div>
        <div class="wf-metric-label">Registration Type</div>
        <div class="wf-metric-sub">${c.jointSubmission ? 'Joint submission' : 'Individual'}</div>
      </div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title" style="margin-bottom:.6rem">Pre-Submission Checklist</div>
      <div class="checklist">${checks.map(ch => `<div class="check-item ${ch.critical ? 'critical' : ''}">
        <div class="check-icon ${ch.pass ? (ch.warn ? 'check-warn' : 'check-pass') : 'check-fail'}">${ch.pass ? (ch.warn ? '⚠' : '✓') : '✕'}</div>
        <div style="flex:1"><div class="check-text">${ch.label}${ch.critical ? ' <span style="color:var(--red);font-size:.6rem;font-weight:700">BLOCKING</span>' : ''}</div><div class="check-detail">${ch.detail}</div></div>
      </div>`).join('')}</div>
    </div>

    <div class="card" style="margin-top:.8rem">
      <div class="card-title" style="margin-bottom:.6rem">Submission Workflow</div>
      <div class="wf-submission-steps">
        <div class="wf-sub-step"><span class="wf-sub-num">1</span><div><strong>Complete IUCLID dossier</strong><div class="wf-sub-desc">All sections populated, endpoint study records attached</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">2</span><div><strong>Run IUCLID Validation Assistant</strong><div class="wf-sub-desc">Fix all errors, review warnings</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">3</span><div><strong>Run ECHA Dossier Quality Check</strong><div class="wf-sub-desc">Optional but recommended — identifies common deficiencies</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">4</span><div><strong>Export dossier from IUCLID</strong><div class="wf-sub-desc">Create .i6z file for REACH-IT upload</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">5</span><div><strong>Submit via REACH-IT</strong><div class="wf-sub-desc">Upload dossier, pay fee, receive submission number</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">6</span><div><strong>Completeness check (3 weeks)</strong><div class="wf-sub-desc">ECHA verifies all required information is present</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">7</span><div><strong>Technical completeness check</strong><div class="wf-sub-desc">ECHA may request additional information</div></div></div>
        <div class="wf-sub-step"><span class="wf-sub-num">8</span><div><strong>Registration number issued</strong><div class="wf-sub-desc">Substance can be manufactured/imported in the EU</div></div></div>
      </div>
    </div>

    <div class="wf-actions">
      <button class="btn btn-outline" onclick="goToStep(3)">← Back</button>
      <button class="btn btn-purple" onclick="askCopilot('Generate a complete submission readiness report for ${c.name} (CAS ${c.cas}). For each checklist item that is not passing, provide: 1) What exactly is needed, 2) How to fix it, 3) Estimated time to resolve. Then provide an overall assessment: Is this dossier ready for submission? What are the blocking issues? What is the recommended timeline to submission?')">🧠 AI: Readiness Report</button>
      <button class="btn btn-green" onclick="downloadIUCLIDPackage('${c.cas}')">Download Full IUCLID Package (${typeof getIUCLIDFileList === 'function' ? getIUCLIDFileList(c).length : 4} files)</button>
      <button class="btn btn-gold" onclick="downloadAllXml('${c.cas}')">Download Legacy XML</button>
    </div>`;
}

// Legacy functions for backward compatibility with tab-based navigation
function renderDossierCompleteness(cas) { startWorkflow(cas); goToStep(2); }
function renderExposureScenarios(cas) {
  startWorkflow(cas);
  askCopilot(`Show me the exposure scenarios for ${CHEMICALS_DB.find(x=>x.cas===cas)?.name || cas}. Include contributing scenarios, PROCs, operational conditions, RMMs, and RCR calculations.`);
}
function renderReadAcross(cas) {
  startWorkflow(cas);
  askCopilot(`Analyze read-across options for ${CHEMICALS_DB.find(x=>x.cas===cas)?.name || cas}. Identify analogue groups, assess RAAF compliance, and recommend which endpoints can be covered.`);
}
function renderIUCLID(cas) { startWorkflow(cas); goToStep(3); }
function renderSubmissionReadiness(cas) { startWorkflow(cas); goToStep(4); }
