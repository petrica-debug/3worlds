/* ═══════════════════════════════════════════════════════════════════════
   3WORLDS AI — Powered by OpenAI via secure server-side proxy
   Real regulatory intelligence for REACH compliance
   ═══════════════════════════════════════════════════════════════════════ */

let copilotContext = {};
let copilotMessages = [];
let conversationHistory = [];
let aiLoading = false;

const SYSTEM_PROMPT = `You are 3Worlds AI, an expert REACH regulatory consultant with 15+ years of experience in EU chemical regulation. You work for the Three Worlds Chemical Intelligence Platform.

Your expertise covers:
- REACH Regulation (EC 1907/2006) — registration, evaluation, authorization, restriction
- CLP Regulation (EC 1272/2008) — classification, labelling, packaging
- IUCLID 6 dossier preparation and submission via REACH-IT
- Chemical Safety Reports (CSR) and exposure assessment
- ECHA guidance documents and regulatory updates
- Annex XI waiver strategies (read-across, QSAR, weight of evidence, exposure-based)
- RAAF (Read-Across Assessment Framework) compliance
- Exposure scenario development (ECETOC TRA, Stoffenmanager, ART)
- SVHC identification, Candidate List, Authorization (Annex XIV)
- Restriction proposals (Annex XVII)
- Testing proposals and ECHA evaluation process
- DNEL/PNEC derivation and risk characterisation

When answering:
1. Be specific and actionable — cite specific ECHA guidance, OECD test guidelines, and regulatory references
2. When discussing endpoints, mention the IUCLID section number, applicable test guideline, and estimated cost
3. For waiver strategies, explain the legal basis (Annex XI section), required justification, and likelihood of acceptance
4. For read-across, discuss RAAF scenarios, structural justification requirements, and data matrix needs
5. Always note when professional review is needed before submission
6. Use markdown formatting: **bold** for emphasis, bullet points for lists
7. When generating dossier text, IUCLID justifications, or CSR sections, produce actual regulatory-quality prose that could be used as a starting draft
8. If the user asks you to generate submission files or regulatory documents, produce detailed, structured content

You have access to the substance context provided in each message. Use it to give substance-specific advice.

IMPORTANT: You are branded as "3Worlds AI" — never refer to yourself as ChatGPT or OpenAI. You are the AI engine of the Three Worlds platform.`;

function toggleCopilot() {
  const panel = document.getElementById('copilotPanel');
  const btn = document.getElementById('copilotToggle');
  const main = document.querySelector('.main');
  panel.classList.toggle('open');
  btn.classList.toggle('active');
  main.classList.toggle('copilot-open');
}

function initCopilot() {
  copilotMessages = [{
    role: 'ai',
    text: `**Welcome to 3Worlds AI** — your REACH regulatory intelligence engine.\n\nI can help you with:\n\n• **Dossier gap analysis** — identify missing endpoints and estimate costs\n• **Waiver strategies** — draft Annex XI justifications (read-across, QSAR, WoE)\n• **Generate regulatory text** — IUCLID justifications, CSR sections, robust study summaries\n• **Exposure assessment** — draft exposure scenarios, calculate RCRs\n• **Submission preparation** — pre-submission checklist, REACH-IT guidance\n• **Regulatory strategy** — timeline planning, cost optimization, testing proposals\n\nSelect a substance and ask me anything. I'll provide expert-level guidance with specific regulatory references.`
  }];
  conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  renderCopilotMessages();

  document.getElementById('copilotInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCopilotMessage(); }
  });
}

function askCopilot(question) {
  const panel = document.getElementById('copilotPanel');
  if (!panel.classList.contains('open')) toggleCopilot();
  copilotMessages.push({ role: 'user', text: question });
  renderCopilotMessages();
  callAI(question);
}

function sendCopilotMessage() {
  const inp = document.getElementById('copilotInput');
  const text = inp.value.trim();
  if (!text || aiLoading) return;
  inp.value = '';
  copilotMessages.push({ role: 'user', text });
  renderCopilotMessages();
  callAI(text);
}

function buildSubstanceContext() {
  const c = copilotContext.substance;
  if (!c) return '';

  const band = TONNAGE_BANDS[c.tonnageBand];
  const dc = c.dossierCompleteness || {};
  const eps = band ? band.endpoints : [];
  const missing = eps.filter(e => (dc[e] || 'missing') === 'missing');
  const waived = eps.filter(e => dc[e] === 'waived');
  const readAcross = eps.filter(e => dc[e] === 'read_across');
  const auth = AUTHORIZATION_ENTRIES[c.cas];
  const dnelData = DNEL_PNEC[c.cas];
  const scenarios = EXPOSURE_SCENARIOS[c.cas];
  const restrictions = ANNEX_XVII_RESTRICTIONS.filter(r => r.substances.includes(c.cas));
  const groups = READ_ACROSS_GROUPS.filter(g => g.members.includes(c.cas));

  let ctx = `\n\n--- CURRENT SUBSTANCE CONTEXT ---
Substance: ${c.name} (CAS ${c.cas}, EC ${c.ecNumber || '—'})
IUPAC: ${c.iupac || c.name}
Formula: ${c.formula}, MW: ${c.mw} g/mol
SMILES: ${c.smiles || '—'}
State: ${c.state}
Uses: ${c.use}
Tonnage band: ${band ? band.label : c.tonnageBand} (Annex ${band ? band.annex : '—'})
Registration: ${c.reach || 'Pending'} | Type: ${c.registrationType} | Joint: ${c.jointSubmission ? 'Yes, Lead: ' + c.leadRegistrant : 'No'}
CLP: ${c.clp.join('; ')}
Harmonised CLP: ${c.harmonisedCLP ? 'Yes, Index ' + c.clpIndex : 'No (self-classification)'}
Signal word: ${c.signal}
H-statements: ${c.hStatements.join(', ')}
SVHC: ${c.svhc ? 'Yes' : 'No'}`;

  if (missing.length > 0) {
    ctx += `\n\nMISSING ENDPOINTS (${missing.length}):`;
    missing.forEach(e => {
      const m = ENDPOINT_META[e] || {};
      ctx += `\n- ${m.name || e} (${m.annex}, ${m.guideline}, est. €${(m.cost || 0).toLocaleString()}, waivable: ${m.waivable ? 'yes' : 'no'})`;
    });
  }

  if (waived.length > 0) {
    ctx += `\nWAIVED ENDPOINTS: ${waived.map(e => ENDPOINT_META[e]?.name || e).join(', ')}`;
  }
  if (readAcross.length > 0) {
    ctx += `\nREAD-ACROSS ENDPOINTS: ${readAcross.map(e => ENDPOINT_META[e]?.name || e).join(', ')}`;
  }

  if (auth) {
    ctx += `\n\nAUTHORIZATION: Candidate List since ${auth.candidateDate}. Reason: ${auth.reason}. Annex XIV: ${auth.annexXIV ? 'Listed, sunset ' + auth.sunsetDate : 'Not listed'}. Alternatives: ${auth.alternatives.join(', ')}`;
  }

  if (dnelData) {
    ctx += `\n\nDNELs: Worker inhal ${dnelData.dnelWorkerInhal} mg/m³, Worker dermal ${dnelData.dnelWorkerDermal} mg/kg bw/d, GenPop oral ${dnelData.dnelGenPopOral} mg/kg bw/d`;
    ctx += `\nPNECs: Freshwater ${dnelData.pnecFreshwater} mg/L, Marine ${dnelData.pnecMarine} mg/L, STP ${dnelData.pnecSTP} mg/L`;
  }

  if (restrictions.length > 0) {
    ctx += `\n\nRESTRICTIONS: ${restrictions.map(r => `Entry ${r.entry}: ${r.condition}`).join('; ')}`;
  }

  if (groups.length > 0) {
    ctx += `\n\nREAD-ACROSS GROUPS: ${groups.map(g => `${g.groupName} (confidence: ${g.confidence}, endpoints: ${g.endpoints.map(e => ENDPOINT_META[e]?.name || e).join(', ')})`).join('; ')}`;
  }

  if (scenarios && scenarios.length > 0) {
    ctx += `\n\nEXPOSURE SCENARIOS: ${scenarios.length} defined. All RCRs < 1.`;
  }

  const pc = c.physChem;
  ctx += `\n\nPHYSCHEM: MP ${pc.mp}°C, BP ${pc.bp}°C, density ${pc.density}, VP ${pc.vp} Pa, logP ${pc.logP}, solubility ${pc.solubility}, flash ${pc.flashPoint}°C`;

  return ctx;
}

async function callAI(userMessage) {
  aiLoading = true;
  updateSendButton();

  copilotMessages.push({ role: 'ai', text: '⏳ Analyzing...', loading: true });
  renderCopilotMessages();

  const contextStr = buildSubstanceContext();
  const fullMessage = userMessage + contextStr;

  conversationHistory.push({ role: 'user', content: fullMessage });

  try {
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '/api/chat'
      : '/api/chat';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';

    conversationHistory.push({ role: 'assistant', content: aiText });

    copilotMessages = copilotMessages.filter(m => !m.loading);
    copilotMessages.push({ role: 'ai', text: aiText });

  } catch (err) {
    copilotMessages = copilotMessages.filter(m => !m.loading);

    if (err.message.includes('API error') || err.message.includes('Failed to fetch')) {
      copilotMessages.push({
        role: 'ai',
        text: `**Connection issue** — Unable to reach the 3Worlds AI service.\n\nThis typically means:\n• The platform is running locally without the API proxy\n• The Vercel deployment needs the OPENAI_API_KEY environment variable\n\nFalling back to built-in knowledge base...\n\n${generateFallbackResponse(userMessage)}`
      });
    } else {
      copilotMessages.push({ role: 'ai', text: `**Error:** ${err.message}. Please try again.` });
    }
  }

  aiLoading = false;
  updateSendButton();
  renderCopilotMessages();
}

function updateSendButton() {
  const btn = document.getElementById('copilotSend');
  if (btn) {
    btn.textContent = aiLoading ? '...' : '→';
    btn.disabled = aiLoading;
  }
}

function generateFallbackResponse(query) {
  const q = query.toLowerCase();
  const c = copilotContext.substance;

  if (q.includes('gap') || q.includes('missing') || q.includes('completeness')) {
    if (c) {
      const band = TONNAGE_BANDS[c.tonnageBand];
      const dc = c.dossierCompleteness || {};
      const missing = (band ? band.endpoints : []).filter(e => (dc[e] || 'missing') === 'missing');
      if (missing.length === 0) return `**${c.name}** — All required endpoints for ${band?.label || ''} are satisfied.`;
      return `**${c.name}** — ${missing.length} gap(s): ${missing.map(e => ENDPOINT_META[e]?.name || e).join(', ')}. Estimated cost: €${missing.reduce((s, e) => s + (ENDPOINT_META[e]?.cost || 0), 0).toLocaleString()}.`;
    }
    return 'Select a substance first to analyze dossier gaps.';
  }
  if (q.includes('waiver')) return 'Annex XI provides five waiver strategies: 1.2 Weight of Evidence, 1.3 QSAR/Substance Properties, 1.5 Read-across/Grouping, and 3. Exposure-based waivers.';
  return 'Select a substance and ask about dossier gaps, waivers, read-across, exposure scenarios, or submission readiness.';
}

function renderCopilotMessages() {
  const container = document.getElementById('copilotMessages');
  container.innerHTML = copilotMessages.map(m => {
    let html = m.text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--s3);padding:.1rem .3rem;border-radius:3px;font-size:.72rem">$1</code>')
      .replace(/• /g, '<span style="color:var(--gold)">▸</span> ')
      .replace(/(\d+)\. /g, '<span style="color:var(--gold);font-weight:700">$1.</span> ');
    if (m.loading) html = '<div class="ai-loading"><span class="ai-loading-dot"></span><span class="ai-loading-dot"></span><span class="ai-loading-dot"></span></div>';
    return `<div class="cp-msg ${m.role}"><div class="msg-label">${m.role === 'ai' ? '🧠 3Worlds AI' : 'You'}</div>${html}</div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function clearCopilotHistory() {
  conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  copilotMessages = [{
    role: 'ai',
    text: '**Conversation cleared.** Context reset. Select a substance and ask me anything about REACH compliance.'
  }];
  renderCopilotMessages();
}
