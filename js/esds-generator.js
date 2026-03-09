/* ═══════════════════════════════════════════════════════════════════════
   eSDS GENERATOR — Extended Safety Data Sheet with Annex Exposure Scenarios
   Compliant with Regulation (EC) No 1907/2006 Annex II (as amended by
   Commission Regulation (EU) 2020/878)
   ═══════════════════════════════════════════════════════════════════════ */

const SDS_SECTION_TITLES=[
  "Identification of the substance/mixture and of the company/undertaking",
  "Hazards identification",
  "Composition/information on ingredients",
  "First aid measures",
  "Firefighting measures",
  "Accidental release measures",
  "Handling and storage",
  "Exposure controls/personal protection",
  "Physical and chemical properties",
  "Stability and reactivity",
  "Toxicological information",
  "Ecological information",
  "Disposal considerations",
  "Transport information",
  "Regulatory information",
  "Other information"
];

function initESDSGenerator(){
  const sel=document.getElementById('sdsSubstance');
  CHEMICALS_DB.forEach(c=>{const o=document.createElement('option');o.value=c.cas;o.textContent=`${c.name} (${c.cas})`;sel.appendChild(o)});
}

function generateESDS(){
  const cas=document.getElementById('sdsSubstance').value;
  const lang=document.getElementById('sdsLang').value;
  const c=CHEMICALS_DB.find(x=>x.cas===cas);if(!c)return;
  const pc=c.physChem;
  const dnelData=DNEL_PNEC[cas];
  const transport=UN_TRANSPORT[cas];
  const auth=AUTHORIZATION_ENTRIES[cas];
  const restrictions=ANNEX_XVII_RESTRICTIONS.filter(r=>r.substances.includes(cas));
  const scenarios=EXPOSURE_SCENARIOS[cas];

  const sections=[
    // Section 1
    `<strong>1.1 Product identifier</strong><br>
    Substance name: ${c.name}<br>
    CAS Number: ${c.cas}<br>
    EC Number: ${c.ecNumber||'—'}<br>
    IUPAC Name: ${c.iupac||c.name}<br>
    REACH Registration No.: ${c.reach||'Pending'}<br>
    ${c.clpIndex?`CLP Index No.: ${c.clpIndex}<br>`:''}
    Molecular formula: ${c.formula}<br>
    Molecular weight: ${c.mw} g/mol<br><br>
    <strong>1.2 Relevant identified uses and uses advised against</strong><br>
    Identified uses: ${c.use}<br>
    ${auth?`Uses advised against: Uses not covered by authorization (see Section 15)<br>`:''}
    <br><strong>1.3 Details of the supplier</strong><br>
    [Company Name]<br>[Address], Brussels, Belgium<br>Tel: +32 2 XXX XXXX<br>Email: reach@company.eu<br><br>
    <strong>1.4 Emergency telephone number</strong><br>
    National Poison Centre: +32 70 245 245 (Belgium)<br>
    Company emergency: +32 2 XXX XXXX (24h)`,

    // Section 2
    `<strong>2.1 Classification of the substance or mixture</strong><br>
    Regulation (EC) No 1272/2008 [CLP]:<br>
    ${c.harmonisedCLP?`<em>Harmonised classification (Annex VI, ${c.atpNumber}, Index No. ${c.clpIndex})</em><br>`:'<em>Self-classification by registrant</em><br>'}
    ${c.clp.map(cl=>`${cl}`).join('<br>')}<br><br>
    <strong>2.2 Label elements</strong><br>
    Signal word: <strong style="color:${c.signal==='Danger'?'var(--red)':'var(--gold)'}"> ${c.signal}</strong><br><br>
    Pictograms: ${c.pictograms.map(p=>`${GHS_PICTOGRAMS[p]?.icon||''} ${p}`).join(', ')}<br><br>
    Hazard statements:<br>${c.hStatements.map(h=>`${h} — ${H_STATEMENTS[h]||''}`).join('<br>')}<br><br>
    Precautionary statements:<br>${c.pStatements.join(', ')}<br><br>
    ${c.svhc?'<strong style="color:var(--red)">Contains substance on the SVHC Candidate List (Article 59(1) REACH)</strong><br>':''}
    <strong>2.3 Other hazards</strong><br>
    ${c.clp.some(x=>x.includes('PBT'))?'This substance meets the criteria for PBT/vPvB under Annex XIII of REACH.<br>':'This substance does not meet the criteria for PBT/vPvB under Annex XIII of REACH.<br>'}
    ${pc.logP!==null&&pc.logP>4?'Log Kow > 4: potential for bioaccumulation — see Section 12.<br>':''}`,

    // Section 3
    `<strong>3.1 Substance</strong><br>
    Chemical name: ${c.iupac||c.name}<br>
    CAS Number: ${c.cas}<br>
    EC Number: ${c.ecNumber||'—'}<br>
    REACH Registration No.: ${c.reach||'Pending'}<br>
    Molecular formula: ${c.formula}<br>
    Molecular weight: ${c.mw} g/mol<br>
    Concentration: ≥ 99.0% (mono-constituent substance)<br><br>
    <strong>Impurities:</strong> No hazardous impurities above classification thresholds per CLP Article 11.<br>
    <strong>Stabilisers:</strong> ${c.name==='Hydrogen Peroxide'?'Contains stabiliser (stannate)':'None required'}`,

    // Section 4
    `<strong>4.1 Description of first aid measures</strong><br><br>
    <strong>Inhalation:</strong> Move person to fresh air. ${c.clp.some(x=>x.includes('Acute Tox')&&x.includes('Inhalation'))?'If breathing is difficult, give oxygen. If not breathing, give artificial respiration. ':''}Seek medical attention ${c.clp.some(x=>x.includes('Acute Tox. 2')||x.includes('Acute Tox. 3'))?'immediately':'if symptoms persist'}.<br><br>
    <strong>Skin contact:</strong> Remove contaminated clothing immediately. ${c.clp.some(x=>x.includes('Skin Corr'))?'Flush skin with copious amounts of water for at least 20 minutes. Do NOT neutralize with chemicals.':'Wash skin with soap and water for at least 15 minutes.'} Seek medical attention.<br><br>
    <strong>Eye contact:</strong> ${c.clp.some(x=>x.includes('Skin Corr')||x.includes('Eye'))?'Rinse cautiously with water for at least 15 minutes. Remove contact lenses if present and easy to do.':'Rinse with water for several minutes.'} Seek ${c.clp.some(x=>x.includes('Skin Corr'))?'immediate ':''}medical attention.<br><br>
    <strong>Ingestion:</strong> ${c.clp.some(x=>x.includes('Skin Corr'))?'Do NOT induce vomiting (risk of perforation). ':''}Rinse mouth with water. ${c.clp.some(x=>x.includes('Acute Tox'))?'Seek medical attention immediately. Contact Poison Centre.':'Seek medical attention if symptoms develop.'}<br><br>
    <strong>4.2 Most important symptoms and effects</strong><br>
    ${c.clp.filter(x=>x.includes('STOT')).length?'Target organ effects: '+c.clp.filter(x=>x.includes('STOT')).join(', ')+'<br>':''}
    ${c.clp.some(x=>x.includes('Carc'))?'<strong style="color:var(--red)">Carcinogenic potential — refer to Section 11 for details.</strong><br>':''}
    ${c.clp.some(x=>x.includes('Muta'))?'<strong style="color:var(--red)">Mutagenic potential — refer to Section 11 for details.</strong><br>':''}
    <strong>4.3 Indication of immediate medical attention</strong><br>
    ${c.clp.some(x=>x.includes('Acute Tox. 2')||x.includes('Acute Tox. 1'))?'Immediate medical attention required. Symptomatic and supportive treatment.':'Treat symptomatically. No specific antidote.'}`,

    // Section 5
    `<strong>5.1 Extinguishing media</strong><br>
    Suitable: ${c.clp.some(x=>x.includes('Flam'))?'Alcohol-resistant foam, CO₂, dry chemical powder, water spray':'Water spray, foam, CO₂, dry chemical'}<br>
    Unsuitable: ${c.clp.some(x=>x.includes('Flam'))?'Direct water jet on large fires (may spread burning liquid)':'No specific restrictions'}<br><br>
    <strong>5.2 Special hazards</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?`Highly flammable. Flash point: ${pc.flashPoint!==null?pc.flashPoint+'°C':'N/A'}. Vapours may form explosive mixtures with air. Vapour is heavier than air and may travel to ignition sources.`:'No specific fire hazard beyond standard chemical fire risks.'}
    ${c.clp.some(x=>x.includes('Ox.'))?'<br><strong>Strong oxidizer</strong> — may intensify fire. Do not store near combustible materials.':''}
    <br>Hazardous combustion products: CO, CO₂${c.formula.includes('Cl')?', HCl, Cl₂':''}${c.formula.includes('N')?', NOₓ':''}${c.formula.includes('S')?', SOₓ':''}<br><br>
    <strong>5.3 Advice for firefighters</strong><br>
    Self-contained breathing apparatus (SCBA) and full protective clothing. Cool containers with water spray. Collect contaminated fire-fighting water separately — do not allow to enter drains.`,

    // Section 6
    `<strong>6.1 Personal precautions, protective equipment and emergency procedures</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?'Eliminate all ignition sources. Use non-sparking tools. ':''}Evacuate area. Use appropriate PPE (see Section 8). Ensure adequate ventilation. ${c.clp.some(x=>x.includes('Acute Tox. 2')||x.includes('Acute Tox. 3'))?'Use respiratory protection.':''}<br><br>
    <strong>6.2 Environmental precautions</strong><br>
    Prevent entry into drains, sewers, basements, and waterways. ${c.clp.some(x=>x.includes('Aquatic'))?'<strong>Substance is toxic to aquatic organisms.</strong> Notify authorities if substance enters water courses.':''}<br><br>
    <strong>6.3 Methods and material for containment and cleaning up</strong><br>
    ${c.state==='Liquid'||c.state==='Gas/Liquid'?'Absorb spillage with inert material (sand, vermiculite, diatomaceous earth). Collect in suitable containers for disposal per Section 13.':'Carefully sweep up. Avoid generating dust. Collect in suitable containers.'}<br><br>
    <strong>6.4 Reference to other sections</strong><br>
    See Section 8 for PPE. See Section 13 for disposal.`,

    // Section 7
    `<strong>7.1 Precautions for safe handling</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?'Keep away from heat, hot surfaces, sparks, open flames, and other ignition sources. No smoking. Use non-sparking tools. Take precautionary measures against static discharge.<br>':''}
    ${c.clp.some(x=>x.includes('Skin Corr'))?'Avoid contact with skin and eyes. ':''}
    ${c.clp.some(x=>x.includes('Acute Tox')&&x.includes('Inhalation'))?'Use only in well-ventilated areas or with appropriate respiratory protection. ':''}
    ${c.clp.some(x=>x.includes('Carc')||x.includes('Muta'))?'<strong>CMR substance</strong> — minimize exposure. Apply closed systems where possible. Follow workplace-specific risk management measures.<br>':''}
    Observe good industrial hygiene. Wash hands before breaks and after handling.<br><br>
    <strong>7.2 Conditions for safe storage</strong><br>
    Store in a cool, dry, well-ventilated area. Keep container tightly closed.
    ${c.clp.some(x=>x.includes('Flam'))?'<br>Store away from oxidizers and ignition sources. Storage class: Flammable liquids.':''}
    ${c.clp.some(x=>x.includes('Ox.'))?'<br>Store away from combustible materials and reducing agents.':''}
    ${c.clp.some(x=>x.includes('Skin Corr'))?'<br>Store in corrosion-resistant containers (HDPE, PTFE-lined steel).':''}<br><br>
    <strong>7.3 Specific end use(s)</strong><br>
    ${c.exposureAssessment?'See attached exposure scenarios in the Annex to this eSDS.':'Refer to identified uses in Section 1.2.'}`,

    // Section 8
    `<strong>8.1 Control parameters</strong><br>
    ${DNEL_PNEC[cas+'_oel']?`<strong>Occupational Exposure Limits:</strong><br>TWA (8h): ${DNEL_PNEC[cas+'_oel'].oelTWA8h} ${DNEL_PNEC[cas+'_oel'].oelUnit}<br>STEL (15 min): ${DNEL_PNEC[cas+'_oel'].oelSTEL} ${DNEL_PNEC[cas+'_oel'].oelUnit}<br>Source: ${DNEL_PNEC[cas+'_oel'].oelSource}<br><br>`:'<strong>Occupational Exposure Limits:</strong> Refer to national OEL tables.<br><br>'}
    ${dnelData?`<strong>DNEL values (from REACH registration):</strong><br>
    ${dnelData.dnelWorkerInhal!==null?`Worker inhalation (long-term, systemic): ${dnelData.dnelWorkerInhal} mg/m³<br>`:''}
    ${dnelData.dnelWorkerDermal!==null?`Worker dermal (long-term, systemic): ${dnelData.dnelWorkerDermal} mg/kg bw/d<br>`:''}
    ${dnelData.dnelGenPopInhal!==null?`General population inhalation: ${dnelData.dnelGenPopInhal} mg/m³<br>`:''}
    ${dnelData.dnelGenPopOral!==null?`General population oral: ${dnelData.dnelGenPopOral} mg/kg bw/d<br>`:''}
    <br>`:``}
    <strong>8.2 Exposure controls</strong><br>
    <strong>Engineering controls:</strong> ${c.clp.some(x=>x.includes('Carc')||x.includes('Muta'))?'Closed systems preferred. Local exhaust ventilation (LEV) mandatory at all emission points.':'Local exhaust ventilation recommended. Ensure adequate general ventilation.'}<br><br>
    <strong>Personal protective equipment:</strong><br>
    • Respiratory: ${c.clp.some(x=>x.includes('Acute Tox. 2')||x.includes('Acute Tox. 3')&&x.includes('Inhalation'))?'Full-face respirator with appropriate filter (A for organic vapours, B for inorganic gases, E for acid gases)':'Half-face respirator with appropriate filter if exposure limits may be exceeded'}<br>
    • Hands: Chemical-resistant gloves — ${c.clp.some(x=>x.includes('Skin Corr'))?'butyl rubber or viton, ≥0.5mm thickness, breakthrough time >480 min':'nitrile, ≥0.4mm thickness, breakthrough time >240 min'}. Refer to EN 374.<br>
    • Eyes: ${c.clp.some(x=>x.includes('Skin Corr'))?'Full-face shield':'Chemical splash goggles'} (EN 166)<br>
    • Body: ${c.clp.some(x=>x.includes('Skin Corr')||x.includes('Carc'))?'Chemical-resistant protective suit (Type 3 or 4 per EN 14605)':'Chemical-resistant protective clothing'}`,

    // Section 9
    `<strong>9.1 Information on basic physical and chemical properties</strong><br><br>
    <table style="width:100%;font-size:.78rem;border-collapse:collapse">
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3);width:45%">Appearance</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${c.state}</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Melting point/freezing point</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.mp} °C (OECD TG 102)</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Boiling point</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.bp} °C (OECD TG 103)</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Relative density</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.density} g/cm³ at 20°C (OECD TG 109)</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Vapour pressure</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.vp} Pa at 20°C (OECD TG 104)</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Partition coefficient (log Kow)</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.logP!==null?pc.logP+' (OECD TG 107)':'Not applicable (inorganic/ionic)'}</td></tr>
    <tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Water solubility</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.solubility} at 20°C (OECD TG 105)</td></tr>
    ${pc.flashPoint!==null?`<tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Flash point</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.flashPoint} °C (closed cup, OECD TG 113)</td></tr>`:''}
    ${pc.autoIgnition!==null?`<tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">Auto-ignition temperature</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.autoIgnition} °C (EU A.15)</td></tr>`:''}
    ${pc.ph?`<tr><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border);color:var(--t3)">pH</td><td style="padding:.25rem .4rem;border-bottom:1px solid var(--border)">${pc.ph}</td></tr>`:''}
    </table>`,

    // Section 10
    `<strong>10.1 Reactivity</strong><br>
    ${c.clp.some(x=>x.includes('Ox.'))?'Strong oxidizer — may react vigorously with reducing agents, organic materials, and combustible substances.':'Stable under recommended storage conditions.'}<br><br>
    <strong>10.2 Chemical stability</strong><br>Stable under normal conditions of use and storage.<br><br>
    <strong>10.3 Possibility of hazardous reactions</strong><br>
    ${c.clp.some(x=>x.includes('Ox.'))?'Exothermic reactions with reducing agents and organic materials.':'No hazardous polymerization will occur.'}<br><br>
    <strong>10.4 Conditions to avoid</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?'Heat, sparks, open flame, static discharge. ':''}${c.clp.some(x=>x.includes('Ox.'))?'Contact with combustible materials. ':''}Incompatible materials (see 10.5).<br><br>
    <strong>10.5 Incompatible materials</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?'Strong oxidizers, ':''}${c.clp.some(x=>x.includes('Ox.'))?'Reducing agents, organic materials, ':''}strong acids, strong bases, reactive metals.<br><br>
    <strong>10.6 Hazardous decomposition products</strong><br>
    CO, CO₂${c.formula.includes('Cl')?', HCl, phosgene':''}${c.formula.includes('N')?', nitrogen oxides':''}${c.formula.includes('S')?', sulfur oxides':''}`,

    // Section 11
    `<strong>11.1 Information on hazard classes as defined in Regulation (EC) No 1272/2008</strong><br><br>
    <strong>Acute toxicity:</strong> ${c.clp.filter(x=>x.includes('Acute Tox')).join('; ')||'Not classified'}<br>
    <strong>Skin corrosion/irritation:</strong> ${c.clp.filter(x=>x.includes('Skin Corr')||x.includes('Skin Irrit')).join('; ')||'Not classified'}<br>
    <strong>Serious eye damage/irritation:</strong> ${c.clp.filter(x=>x.includes('Eye')).join('; ')||'Not classified'}<br>
    <strong>Respiratory/skin sensitisation:</strong> ${c.clp.filter(x=>x.includes('Sens')).join('; ')||'Not classified'}<br>
    <strong>Germ cell mutagenicity:</strong> ${c.clp.filter(x=>x.includes('Muta')).join('; ')||'Not classified'}<br>
    <strong>Carcinogenicity:</strong> ${c.clp.filter(x=>x.includes('Carc')).join('; ')||'Not classified'}<br>
    <strong>Reproductive toxicity:</strong> ${c.clp.filter(x=>x.includes('Repr')||x.includes('Lact')).join('; ')||'Not classified'}<br>
    <strong>STOT — single exposure:</strong> ${c.clp.filter(x=>x.includes('STOT SE')).join('; ')||'Not classified'}<br>
    <strong>STOT — repeated exposure:</strong> ${c.clp.filter(x=>x.includes('STOT RE')).join('; ')||'Not classified'}<br>
    <strong>Aspiration hazard:</strong> ${c.clp.filter(x=>x.includes('Asp')).join('; ')||'Not classified'}<br><br>
    <strong>11.2 Information on other hazards</strong><br>
    ${c.clp.some(x=>x.includes('Carc')||x.includes('Muta')||x.includes('Repr'))?'<strong style="color:var(--red)">CMR substance — special attention required. Refer to workplace-specific risk management measures.</strong>':'No additional hazard information.'}`,

    // Section 12
    `<strong>12.1 Toxicity</strong><br>
    Aquatic toxicity: ${c.clp.filter(x=>x.includes('Aquatic')).join('; ')||'Not classified as hazardous to the aquatic environment'}<br>
    ${dnelData?`PNEC freshwater: ${dnelData.pnecFreshwater!==null?dnelData.pnecFreshwater+' mg/L':'N/A'}<br>PNEC marine: ${dnelData.pnecMarine!==null?dnelData.pnecMarine+' mg/L':'N/A'}<br>`:''}<br>
    <strong>12.2 Persistence and degradability</strong><br>
    ${c.dossierCompleteness?.biodeg==='complete'?'Biodegradation data available in the REACH dossier.':'Data not yet available — refer to REACH dossier.'}<br><br>
    <strong>12.3 Bioaccumulative potential</strong><br>
    Log Kow: ${pc.logP!==null?pc.logP:'N/A'}. ${pc.logP!==null&&pc.logP>3?'Potential for bioaccumulation (log Kow > 3). BCF data should be consulted.':'Low bioaccumulation potential.'}<br><br>
    <strong>12.4 Mobility in soil</strong><br>
    ${c.dossierCompleteness?.adsorptionDesorption==='complete'?'Adsorption/desorption data available.':'Refer to REACH dossier.'}<br><br>
    <strong>12.5 Results of PBT and vPvB assessment</strong><br>
    ${c.svhc&&c.clp.some(x=>x.includes('Carc'))&&pc.logP>4?'Substance may meet PBT/vPvB criteria — see SVHC assessment.':'Does not meet PBT/vPvB criteria based on available data.'}<br><br>
    <strong>12.6 Endocrine disrupting properties</strong><br>
    ${c.cas==='80-05-7'?'Identified as endocrine disruptor.':'No evidence of endocrine disrupting properties in available data.'}<br><br>
    <strong>12.7 Other adverse effects</strong><br>
    ${c.clp.some(x=>x.includes('Ozone'))?'Hazardous to the ozone layer.':'No other known adverse environmental effects.'}`,

    // Section 13
    `<strong>13.1 Waste treatment methods</strong><br>
    Dispose of in accordance with local/national regulations (Directive 2008/98/EC on waste).<br><br>
    <strong>Waste code (EWC):</strong> Depends on use — consult the European Waste Catalogue. Likely codes:<br>
    ${c.clp.some(x=>x.includes('Flam'))?'• 07 01 04* — other organic solvents, washing liquids (hazardous)<br>':''}
    ${c.clp.some(x=>x.includes('Skin Corr'))?'• 06 01/02 — waste acids/bases (hazardous)<br>':''}
    • 16 05 06* — laboratory chemicals consisting of or containing hazardous substances<br><br>
    Do not discharge into drains or the environment. Incineration in licensed facility preferred for organic substances.<br><br>
    <strong>Contaminated packaging:</strong> Empty containers may contain residues. Do not reuse. Dispose as hazardous waste if contaminated.`,

    // Section 14
    `<strong>14.1 UN number or ID number</strong><br>
    ${transport?`UN ${transport.un}`:'Refer to applicable transport regulations'}<br><br>
    <strong>14.2 UN proper shipping name</strong><br>
    ${transport?transport.properShipping:c.name}<br><br>
    <strong>14.3 Transport hazard class(es)</strong><br>
    ${transport?`Class ${transport.class}${transport.subsidiary?' (subsidiary: '+transport.subsidiary+')':''}`:'Refer to regulations'}<br><br>
    <strong>14.4 Packing group</strong><br>
    ${transport?transport.packingGroup:'Refer to regulations'}<br><br>
    <strong>14.5 Environmental hazards</strong><br>
    ${c.clp.some(x=>x.includes('Aquatic'))?'Marine pollutant: Yes':'Marine pollutant: No'}<br><br>
    <strong>14.6 Special precautions for user</strong><br>
    ${c.clp.some(x=>x.includes('Flam'))?'Flammable liquid — observe fire precautions during transport.':'No special precautions beyond standard chemical transport.'}<br><br>
    <strong>14.7 Maritime transport in bulk (MARPOL)</strong><br>
    ${transport?`ADR tunnel code: ${transport.tunnelCode||'—'}`:'Not applicable'}`,

    // Section 15
    `<strong>15.1 Safety, health and environmental regulations specific to the substance</strong><br><br>
    <strong>EU Regulations:</strong><br>
    • REACH (EC 1907/2006) — ${c.reach?'Registered ('+c.reach+')':'Registration pending'}<br>
    • CLP (EC 1272/2008) — ${c.harmonisedCLP?'Harmonised classification, Index '+c.clpIndex:'Self-classified'}<br>
    ${c.svhc?`• <strong style="color:var(--red)">SVHC Candidate List</strong> — Article 33 communication obligations apply<br>`:''}
    ${auth&&auth.annexXIV?`• <strong style="color:var(--red)">Annex XIV (Authorization List)</strong> — Sunset date: ${auth.sunsetDate}. Authorization required for continued use.<br>`:''}
    ${restrictions.length?restrictions.map(r=>`• <strong>Annex XVII Entry ${r.entry}</strong>: ${r.condition}<br>`).join(''):''}
    • Seveso III Directive (2012/18/EU) — ${c.clp.some(x=>x.includes('Acute Tox. 1')||x.includes('Acute Tox. 2')||x.includes('Flam. Gas 1'))?'May be subject to Seveso thresholds':'Check against Annex I thresholds'}<br>
    • Carcinogens & Mutagens Directive (2004/37/EC) — ${c.clp.some(x=>x.includes('Carc')||x.includes('Muta'))?'<strong>Applicable</strong> — workplace exposure minimization required':'Not applicable'}<br><br>
    <strong>15.2 Chemical safety assessment</strong><br>
    ${c.csr?'A Chemical Safety Report (CSR) has been prepared for this substance.':'A CSR has not yet been prepared.'}
    ${c.exposureAssessment?' Exposure scenarios are attached as Annex to this extended SDS.':''}`,

    // Section 16
    `<strong>Revision information</strong><br>
    Revision date: ${new Date().toISOString().split('T')[0]}<br>
    Version: 1.0 (AI-generated draft)<br>
    Regulation: Commission Regulation (EU) 2020/878 amending Annex II to REACH<br><br>
    <strong>Generated by:</strong> Three Worlds — Chemistry. Capital. Community.<br>
    Chemical Intelligence Platform — AI-assisted eSDS generation<br><br>
    <strong>Abbreviations:</strong><br>
    CLP — Classification, Labelling and Packaging; CSR — Chemical Safety Report; DNEL — Derived No-Effect Level; eSDS — extended Safety Data Sheet; GHS — Globally Harmonized System; LEV — Local Exhaust Ventilation; OEL — Occupational Exposure Limit; PNEC — Predicted No-Effect Concentration; PPE — Personal Protective Equipment; PROC — Process Category; RCR — Risk Characterisation Ratio; SVHC — Substance of Very High Concern<br><br>
    <em style="color:var(--t3)">⚠ This eSDS was generated by AI and must be reviewed by a qualified regulatory professional (REACH consultant or in-house toxicologist) before distribution. It is intended as a draft to accelerate compliance workflows, not as a final regulatory document.</em>
    ${scenarios&&scenarios.length?'<br><br><strong style="color:var(--gold)">📎 ANNEX: Exposure Scenarios attached — see Exposure Scenarios tab for full details.</strong>':''}`
  ];

  const html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem">
    <div><h3 style="font-size:1rem;font-weight:700">Extended Safety Data Sheet — ${c.name}</h3>
    <div style="font-size:.72rem;color:var(--t3)">Per Regulation (EU) 2020/878 amending REACH Annex II · ${c.reach?'Reg. '+c.reach:''}</div></div>
    <div style="display:flex;gap:.4rem">
      <button class="btn btn-outline btn-sm" onclick="alert('PDF export coming soon')">Export PDF</button>
      <button class="btn btn-outline btn-sm" onclick="alert('DOCX export coming soon')">Export DOCX</button>
    </div></div>`+
    sections.map((content,i)=>`<div class="sds-section" onclick="this.classList.toggle('open')">
      <div class="sds-section-header"><span><span class="sds-num">${i+1}.</span>${SDS_SECTION_TITLES[i]}</span><span class="sds-chevron">▸</span></div>
      <div class="sds-section-body">${content}</div></div>`).join('');
  document.getElementById('sdsPreview').innerHTML=html;
}
