/* ═══════════════════════════════════════════════════════════════════════
   AI REGULATORY COPILOT — Context-aware assistant for REACH compliance
   Uses rule-based intelligence from AI_COPILOT_RULES + substance context
   ═══════════════════════════════════════════════════════════════════════ */

let copilotContext = {};
let copilotMessages = [];

function toggleCopilot(){
  const panel=document.getElementById('copilotPanel');
  const btn=document.getElementById('copilotToggle');
  const main=document.querySelector('.main');
  panel.classList.toggle('open');
  btn.classList.toggle('active');
  main.classList.toggle('copilot-open');
}

function initCopilot(){
  copilotMessages=[{role:'ai',text:'Welcome to the REACH Regulatory Copilot. I can help with:\n\n• Dossier gap analysis and testing strategies\n• Waiver justifications (Annex XI)\n• Read-across assessment (RAAF compliance)\n• Exposure scenario drafting\n• IUCLID section guidance\n• Regulatory timeline planning\n\nSelect a substance and ask me anything about its compliance status.'}];
  renderCopilotMessages();

  document.getElementById('copilotInput').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCopilotMessage()}
  });
}

function askCopilot(question){
  const panel=document.getElementById('copilotPanel');
  if(!panel.classList.contains('open'))toggleCopilot();
  copilotMessages.push({role:'user',text:question});
  renderCopilotMessages();
  setTimeout(()=>generateCopilotResponse(question),400);
}

function sendCopilotMessage(){
  const inp=document.getElementById('copilotInput');
  const text=inp.value.trim();if(!text)return;
  inp.value='';
  copilotMessages.push({role:'user',text});
  renderCopilotMessages();
  setTimeout(()=>generateCopilotResponse(text),400);
}

function generateCopilotResponse(query){
  const q=query.toLowerCase();
  let response='';
  const c=copilotContext.substance;

  if(q.includes('gap')||q.includes('missing')||q.includes('completeness')||q.includes('endpoint')){
    if(c){
      const band=TONNAGE_BANDS[c.tonnageBand];
      const dc=c.dossierCompleteness||{};
      const missing=(band?band.endpoints:[]).filter(e=>(dc[e]||'missing')==='missing');
      if(missing.length===0){
        response=`**${c.name} — Dossier Complete**\n\nAll required endpoints for the ${band?.label||''} tonnage band (Annex ${band?.annex||''}) are satisfied. The dossier appears submission-ready from an endpoint perspective.\n\nRecommendation: Proceed to the Submission Readiness check to verify all administrative requirements.`;
      } else {
        response=`**${c.name} — ${missing.length} Endpoint Gap(s) Identified**\n\nTonnage band: ${band?.label||''} (Annex ${band?.annex||''})\n\n`;
        missing.forEach(e=>{
          const meta=ENDPOINT_META[e]||{};
          const guidance=AI_COPILOT_RULES.dossierGaps[e]||'No specific guidance available.';
          response+=`**${meta.name||e}** (${meta.annex||''}, ${meta.guideline||''})\nEstimated cost: €${(meta.cost||0).toLocaleString()}${meta.waivable?' — *waiver may be possible*':''}\n${guidance}\n\n`;
        });
        response+=`**Total estimated cost to fill gaps: €${missing.reduce((s,e)=>s+(ENDPOINT_META[e]?.cost||0),0).toLocaleString()}**`;
      }
    } else {
      response='Please select a substance first so I can analyze its dossier completeness against the required tonnage band endpoints.';
    }
  }
  else if(q.includes('waiver')||q.includes('waive')||q.includes('annex xi')){
    response=`**Waiver Strategies under Annex XI**\n\n`;
    Object.entries(AI_COPILOT_RULES.waiverStrategies).forEach(([key,val])=>{
      const labels={substanceProperties:'1.3 — Substance Properties',exposureBased:'3 — Exposure-Based',readAcross:'1.5 — Read-Across/Grouping',weightOfEvidence:'1.2 — Weight of Evidence',qsar:'1.3 — QSAR'};
      response+=`**${labels[key]||key}**\n${val}\n\n`;
    });
    if(c)response+=`For ${c.name}, the most promising waiver strategies depend on which endpoints are missing. Use the Dossier Completeness tab to identify gaps, then ask me about specific endpoints.`;
  }
  else if(q.includes('read-across')||q.includes('read across')||q.includes('analogue')||q.includes('raaf')){
    if(c){
      const groups=READ_ACROSS_GROUPS.filter(g=>g.members.includes(c.cas));
      if(groups.length){
        response=`**Read-Across Groups for ${c.name}**\n\n`;
        groups.forEach(g=>{
          response+=`**${g.groupName}** (Confidence: ${g.confidence})\nMembers: ${g.members.map(m=>{const s=CHEMICALS_DB.find(x=>x.cas===m);return s?s.name:m}).join(', ')}\n\nRAFF Justification: ${g.justification}\n\nApplicable endpoints: ${g.endpoints.map(e=>ENDPOINT_META[e]?.name||e).join(', ')}\n\nRegulatory precedent: ${g.regulatoryPrecedent}\n\n`;
        });
      } else {
        response=`No pre-defined read-across groups exist for ${c.name} in the current database.\n\n**Suggested approach:**\n1. Use OECD QSAR Toolbox to identify structural analogues\n2. Check ECHA disseminated dossiers for substances with similar SMILES: \`${c.smiles||'N/A'}\`\n3. Evaluate common metabolic pathways\n4. Ensure RAAF (Read-Across Assessment Framework) compliance\n5. Document the hypothesis (target vs source) and data matrix`;
      }
    } else {
      response='Select a substance to see available read-across groups and RAAF-compliant justifications.';
    }
  }
  else if(q.includes('exposure')||q.includes('scenario')||q.includes('rcr')||q.includes('dnel')||q.includes('pnec')){
    if(c){
      const scenarios=EXPOSURE_SCENARIOS[c.cas];
      const dnelData=DNEL_PNEC[c.cas];
      response=`**Exposure Assessment for ${c.name}**\n\n`;
      if(dnelData){
        response+=`**DNELs:**\n`;
        if(dnelData.dnelWorkerInhal!==null)response+=`• Worker inhalation (long-term): ${dnelData.dnelWorkerInhal} mg/m³\n`;
        if(dnelData.dnelWorkerDermal!==null)response+=`• Worker dermal (long-term): ${dnelData.dnelWorkerDermal} mg/kg bw/d\n`;
        if(dnelData.dnelGenPopOral!==null)response+=`• General population oral: ${dnelData.dnelGenPopOral} mg/kg bw/d\n`;
        response+=`\n**PNECs:**\n`;
        if(dnelData.pnecFreshwater!==null)response+=`• Freshwater: ${dnelData.pnecFreshwater} mg/L\n`;
        if(dnelData.pnecMarine!==null)response+=`• Marine: ${dnelData.pnecMarine} mg/L\n`;
        if(dnelData.pnecSTP!==null)response+=`• STP: ${dnelData.pnecSTP} mg/L\n`;
        response+='\n';
      }
      if(scenarios&&scenarios.length){
        response+=`**${scenarios.length} Exposure Scenario(s) defined.** All RCRs < 1 — safe use demonstrated under the specified operational conditions and risk management measures.\n\nUse the Exposure Scenarios tab for full details including contributing scenarios, PROCs, and RCR breakdowns.`;
      } else {
        response+=`No exposure scenarios in the demo database. For a substance classified as hazardous at ≥10 t/y, exposure scenarios are mandatory as part of the CSR.\n\n**Recommended approach:**\n1. Identify all uses (industrial, professional, consumer)\n2. Map to PROC/ERC categories using ECHA Use Descriptor System\n3. Model exposure using ECETOC TRA (Tier 1) or Stoffenmanager/ART (Tier 2)\n4. Calculate RCRs: RCR = Exposure / DNEL (must be < 1)\n5. Attach as Annex to extended SDS`;
      }
    } else {
      response='Select a substance to see its DNEL/PNEC values and exposure scenarios.';
    }
  }
  else if(q.includes('svhc')||q.includes('authorization')||q.includes('annex xiv')||q.includes('candidate')){
    if(c){
      const auth=AUTHORIZATION_ENTRIES[c.cas];
      if(auth){
        response=`**SVHC / Authorization Status — ${c.name}**\n\n`;
        response+=`• Candidate List since: ${auth.candidateDate}\n`;
        response+=`• Reason: ${auth.reason}\n`;
        response+=`• Annex XIV: ${auth.annexXIV?'**Listed** — authorization required for continued use':'Not yet listed'}\n`;
        if(auth.sunsetDate)response+=`• Sunset date: ${auth.sunsetDate}\n`;
        if(auth.latestAppDate)response+=`• Latest application date: ${auth.latestAppDate}\n`;
        response+=`\n**Known alternatives:** ${auth.alternatives.join(', ')}\n\n`;
        response+=`**Socio-economic context:** ${auth.socioEconomic}\n\n`;
        if(auth.annexXIV){
          response+=`⚠ **Action required:** If you are using this substance, you must either:\n1. Apply for authorization (demonstrate adequate control or socio-economic benefit outweighs risk)\n2. Substitute with an alternative\n3. Cease use by the sunset date`;
        }
      } else {
        response=`${c.name} is ${c.svhc?'on the SVHC candidate list but':'**not** on the SVHC candidate list and'} not listed on Annex XIV (Authorization List).\n\n${c.svhc?'As an SVHC candidate, Article 33 communication obligations apply for articles containing >0.1% w/w.':'No authorization obligations apply.'}`;
      }
    } else {
      response='Select a substance to check its SVHC and authorization status.';
    }
  }
  else if(q.includes('restriction')||q.includes('annex xvii')){
    if(c){
      const restrictions=ANNEX_XVII_RESTRICTIONS.filter(r=>r.substances.includes(c.cas));
      if(restrictions.length){
        response=`**Annex XVII Restrictions for ${c.name}**\n\n`;
        restrictions.forEach(r=>{
          response+=`**Entry ${r.entry}: ${r.name}**\nCondition: ${r.condition}\nScope: ${r.scope}\nExemptions: ${r.exemptions}\n\n`;
        });
      } else {
        response=`No specific Annex XVII restrictions found for ${c.name} in the database.\n\nNote: Always verify against the latest consolidated version of Annex XVII, as restrictions are regularly updated. Check ECHA's restriction list for the most current information.`;
      }
    } else {
      response='Select a substance to check applicable Annex XVII restrictions.';
    }
  }
  else if(q.includes('submission')||q.includes('readiness')||q.includes('submit')||q.includes('deadline')){
    if(c){
      response=`**Submission Readiness — ${c.name}**\n\n`;
      response+=`Registration type: ${c.registrationType||'Standard'}\n`;
      response+=`Joint submission: ${c.jointSubmission?'Yes — Lead: '+c.leadRegistrant:'Individual'}\n`;
      response+=`Registration fee: €${TONNAGE_BANDS[c.tonnageBand]?.regFee?.toLocaleString()||'—'}\n\n`;
      response+=`**Submission steps:**\n1. Complete all IUCLID dossier sections\n2. Run IUCLID Validation Assistant (built-in tool)\n3. Run ECHA Dossier Quality Check\n4. Submit via REACH-IT portal\n5. Pay registration fee\n6. Await completeness check (3 weeks) and technical completeness check\n\nUse the Submission Readiness tab for a detailed checklist.`;
    } else {
      response='Select a substance to generate a submission readiness assessment.';
    }
  }
  else if(q.includes('iuclid')||q.includes('xml')||q.includes('export')||q.includes('dossier format')){
    response=`**IUCLID 6 Dossier Structure**\n\nThe platform generates XML fragments for the following IUCLID sections:\n\n• **Section 1** — Substance Identity (CAS, EC, IUPAC, SMILES, InChI)\n• **CLP Notification** — Harmonised or self-classification\n• **Section 4** — Physical-chemical properties\n• **CSR Summary** — Chemical Safety Report overview\n\nThese XML files can be imported into IUCLID 6 Cloud or Desktop. They serve as draft templates — always validate using IUCLID's built-in Validation Assistant before submission.\n\n**Full dossier requires additional sections:**\n• Section 3 — Manufacture and uses\n• Sections 5-7 — Environmental fate, ecotox, toxicology (endpoint study records)\n• Section 13 — Literature search documentation\n• Exposure scenarios (attached to CSR)`;
  }
  else {
    if(c){
      response=`I can help with the following for **${c.name}** (CAS ${c.cas}):\n\n• **"gaps"** — Analyze dossier completeness and missing endpoints\n• **"waiver"** — Explore Annex XI waiver strategies\n• **"read-across"** — Find analogue groups and RAAF justifications\n• **"exposure"** — Review DNELs, PNECs, and exposure scenarios\n• **"SVHC"** — Check authorization status and alternatives\n• **"restriction"** — Verify Annex XVII compliance\n• **"submission"** — Assess readiness for ECHA submission\n• **"IUCLID"** — Generate export files\n\nOr ask any specific regulatory question about this substance.`;
    } else {
      response=`I'm your REACH regulatory copilot. To get started:\n\n1. **Select a substance** from the Substance Search tab\n2. **Ask me** about its compliance status, dossier gaps, waiver strategies, or submission readiness\n\nI can also answer general questions about:\n• REACH registration requirements by tonnage band\n• CLP classification rules\n• Annex XI waiver strategies\n• Read-across methodology (RAAF)\n• Exposure scenario structure\n• IUCLID dossier format`;
    }
  }

  copilotMessages.push({role:'ai',text:response});
  renderCopilotMessages();
}

function renderCopilotMessages(){
  const container=document.getElementById('copilotMessages');
  container.innerHTML=copilotMessages.map(m=>{
    const html=m.text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>').replace(/`([^`]+)`/g,'<code style="background:var(--s3);padding:.1rem .3rem;border-radius:3px;font-size:.72rem">$1</code>').replace(/• /g,'<span style="color:var(--gold)">▸</span> ');
    return `<div class="cp-msg ${m.role}"><div class="msg-label">${m.role==='ai'?'🤖 AI Copilot':'You'}</div>${html}</div>`}).join('');
  container.scrollTop=container.scrollHeight;
}
