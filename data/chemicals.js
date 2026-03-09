/**
 * Three Worlds (Chemistry. Capital. Community.) — Chemical Intelligence Platform
 * Regulatory Data Layer
 *
 * Domain model reflects actual REACH (EC 1907/2006) dossier structure,
 * IUCLID 6 endpoint study records, CLP (EC 1272/2008) harmonised entries,
 * and ECHA submission requirements per tonnage band.
 */

// ─── REACH ANNEX REQUIREMENTS BY TONNAGE BAND ───────────────────────────
const TONNAGE_BANDS = {
  "1-10":   {label:"1 – 10 t/y",annex:"VII",endpoints:["physChem","acuteTox","skinIrrit","eyeIrrit","skinSens","mutagenicity_invitro","acuteAquatic","biodeg","logP"],regFee:1636,deadline:null},
  "10-100": {label:"10 – 100 t/y",annex:"VII + VIII",endpoints:["physChem","acuteTox","skinIrrit","eyeIrrit","skinSens","mutagenicity_invitro","acuteAquatic","biodeg","logP","subacuteTox28d","reproScreen","mutagenicity_invivo","chronicAquatic","adsorptionDesorption","shortTermFish","daphniaChronic","terrestrialTox"],regFee:4636,deadline:null},
  "100-1000":{label:"100 – 1 000 t/y",annex:"VII + VIII + IX",endpoints:["physChem","acuteTox","skinIrrit","eyeIrrit","skinSens","mutagenicity_invitro","acuteAquatic","biodeg","logP","subacuteTox28d","reproScreen","mutagenicity_invivo","chronicAquatic","adsorptionDesorption","shortTermFish","daphniaChronic","terrestrialTox","subchronicTox90d","prenatalDev","reproTwoGen","longTermAquatic","bioaccumulation","furtherFate","sedimentTox"],regFee:11636,deadline:null},
  "1000+":  {label:"≥ 1 000 t/y",annex:"VII + VIII + IX + X",endpoints:["physChem","acuteTox","skinIrrit","eyeIrrit","skinSens","mutagenicity_invitro","acuteAquatic","biodeg","logP","subacuteTox28d","reproScreen","mutagenicity_invivo","chronicAquatic","adsorptionDesorption","shortTermFish","daphniaChronic","terrestrialTox","subchronicTox90d","prenatalDev","reproTwoGen","longTermAquatic","bioaccumulation","furtherFate","sedimentTox","carcinogenicity","longTermReproTox","furtherMutagenicity","longTermTerrestrial","fieldStudies"],regFee:31636,deadline:null}
};

// ─── IUCLID ENDPOINT DEFINITIONS ─────────────────────────────────────────
const ENDPOINT_META = {
  physChem:           {name:"Physical & Chemical Properties",iuclidSection:"4",annex:"VII",guideline:"OECD TG 101–120",waivable:false,cost:15000},
  acuteTox:           {name:"Acute Toxicity (oral, dermal, inhalation)",iuclidSection:"7.2",annex:"VII",guideline:"OECD TG 401/402/403",waivable:false,cost:25000},
  skinIrrit:          {name:"Skin Irritation / Corrosion",iuclidSection:"7.3.1",annex:"VII",guideline:"OECD TG 404 / 439",waivable:true,cost:8000},
  eyeIrrit:           {name:"Serious Eye Damage / Irritation",iuclidSection:"7.3.2",annex:"VII",guideline:"OECD TG 405 / 437 / 438",waivable:true,cost:8000},
  skinSens:           {name:"Skin Sensitisation",iuclidSection:"7.4.1",annex:"VII",guideline:"OECD TG 406 / 429 / 442C/D/E",waivable:false,cost:12000},
  mutagenicity_invitro:{name:"In Vitro Gene Mutation (Ames)",iuclidSection:"7.6.1",annex:"VII",guideline:"OECD TG 471",waivable:false,cost:18000},
  acuteAquatic:       {name:"Short-term Aquatic Toxicity",iuclidSection:"6.1.1",annex:"VII",guideline:"OECD TG 201/202/203",waivable:false,cost:20000},
  biodeg:             {name:"Ready Biodegradability",iuclidSection:"5.2.1",annex:"VII",guideline:"OECD TG 301",waivable:false,cost:10000},
  logP:               {name:"Partition Coefficient (log Kow)",iuclidSection:"4.7",annex:"VII",guideline:"OECD TG 107/117",waivable:false,cost:3000},
  subacuteTox28d:     {name:"Short-term Repeated Dose (28-day)",iuclidSection:"7.5.1",annex:"VIII",guideline:"OECD TG 407",waivable:false,cost:85000},
  reproScreen:        {name:"Reproductive/Developmental Toxicity Screening",iuclidSection:"7.8.1",annex:"VIII",guideline:"OECD TG 421/422",waivable:false,cost:120000},
  mutagenicity_invivo:{name:"In Vivo Mutagenicity (if positive in vitro)",iuclidSection:"7.6.2",annex:"VIII",guideline:"OECD TG 474/475",waivable:true,cost:45000},
  chronicAquatic:     {name:"Chronic Aquatic Toxicity (Daphnia 21-d)",iuclidSection:"6.1.3",annex:"VIII",guideline:"OECD TG 211",waivable:false,cost:35000},
  adsorptionDesorption:{name:"Adsorption / Desorption Screening",iuclidSection:"5.4.1",annex:"VIII",guideline:"OECD TG 106/121",waivable:false,cost:12000},
  shortTermFish:      {name:"Short-term Fish Toxicity",iuclidSection:"6.1.2",annex:"VIII",guideline:"OECD TG 203",waivable:false,cost:15000},
  daphniaChronic:     {name:"Daphnia Reproduction (21-d)",iuclidSection:"6.1.3",annex:"VIII",guideline:"OECD TG 211",waivable:false,cost:35000},
  terrestrialTox:     {name:"Terrestrial Toxicity",iuclidSection:"6.2",annex:"VIII",guideline:"OECD TG 207/222",waivable:true,cost:20000},
  subchronicTox90d:   {name:"Sub-chronic Toxicity (90-day)",iuclidSection:"7.5.2",annex:"IX",guideline:"OECD TG 408",waivable:false,cost:350000},
  prenatalDev:        {name:"Prenatal Developmental Toxicity",iuclidSection:"7.8.2",annex:"IX",guideline:"OECD TG 414",waivable:false,cost:250000},
  reproTwoGen:        {name:"Two-Generation Reproductive Toxicity",iuclidSection:"7.8.3",annex:"IX",guideline:"OECD TG 416 / EOGRTS 443",waivable:false,cost:600000},
  longTermAquatic:    {name:"Long-term Aquatic Toxicity (Fish ELS)",iuclidSection:"6.1.4",annex:"IX",guideline:"OECD TG 210",waivable:false,cost:80000},
  bioaccumulation:    {name:"Bioaccumulation in Fish",iuclidSection:"5.3.1",annex:"IX",guideline:"OECD TG 305",waivable:true,cost:90000},
  furtherFate:        {name:"Further Environmental Fate & Behaviour",iuclidSection:"5.4",annex:"IX",guideline:"Various",waivable:true,cost:40000},
  sedimentTox:        {name:"Sediment Organism Toxicity",iuclidSection:"6.3",annex:"IX",guideline:"OECD TG 218/219",waivable:true,cost:55000},
  carcinogenicity:    {name:"Carcinogenicity Study",iuclidSection:"7.7",annex:"X",guideline:"OECD TG 451/453",waivable:false,cost:1500000},
  longTermReproTox:   {name:"Extended One-Generation Repro (EOGRTS)",iuclidSection:"7.8.4",annex:"X",guideline:"OECD TG 443",waivable:false,cost:800000},
  furtherMutagenicity:{name:"Further Mutagenicity Studies",iuclidSection:"7.6.3",annex:"X",guideline:"OECD TG 488/489",waivable:true,cost:120000},
  longTermTerrestrial:{name:"Long-term Terrestrial Toxicity",iuclidSection:"6.2.2",annex:"X",guideline:"OECD TG 222/232",waivable:true,cost:60000},
  fieldStudies:       {name:"Environmental Field Studies",iuclidSection:"6.4",annex:"X",guideline:"Case-specific",waivable:true,cost:200000}
};

// ─── ANNEX XVII RESTRICTIONS ─────────────────────────────────────────────
const ANNEX_XVII_RESTRICTIONS = [
  {entry:28,substances:["71-43-2"],name:"Benzene",condition:"Shall not be placed on the market or used as a substance or in mixtures in concentrations ≥ 0.1% by weight",scope:"Consumer & professional products",exemptions:"Motor fuels (≤1% vol per Directive 98/70/EC)"},
  {entry:51,substances:["71-43-2","108-88-3","100-41-4","1330-20-7"],name:"CMR substances Cat 1A/1B in consumer products",condition:"Shall not be placed on the market for sale to the general public in individual concentration ≥ the specific concentration limit",scope:"Substances classified Carc./Muta./Repr. 1A or 1B",exemptions:"Professional use, motor fuels, artist paints per EN 71-7"},
  {entry:6,substances:["71-43-2","79-01-6","107-06-2","50-32-8"],name:"Asbestos fibres / specific carcinogens",condition:"Manufacturing, placing on market and use prohibited",scope:"Broad industrial and consumer",exemptions:"Analytical standards, research under controlled conditions"},
  {entry:47,substances:["1333-82-0"],name:"Chromium VI compounds",condition:"Shall not be used in cement at > 2 mg/kg (as soluble Cr VI) when placed on the market",scope:"Cement and cement-containing mixtures",exemptions:"Controlled closed processes with no skin contact"},
  {entry:63,substances:["7439-92-1"],name:"Lead and its compounds",condition:"Shall not be placed on the market or used in jewellery articles if Pb concentration ≥ 0.05% by weight",scope:"Jewellery, consumer articles",exemptions:"Crystal glass, enamels, specific alloys"},
  {entry:72,substances:["50-00-0"],name:"Formaldehyde and formaldehyde releasers",condition:"Shall not be placed on the market in articles if formaldehyde emission > 0.062 mg/m³ (after 28 days)",scope:"Articles placed in indoor environments",exemptions:"Articles exclusively for outdoor use"},
  {entry:75,substances:["various"],name:"Substances in tattoo inks and permanent make-up",condition:"Specific concentration limits for CMR, sensitisers, colourants",scope:"Tattoo inks and PMU mixtures",exemptions:"None"},
  {entry:68,substances:["various_pfoa"],name:"PFOA, its salts and PFOA-related substances",condition:"Shall not be manufactured, placed on market, or used as substance, constituent of mixture, or in articles > 25 ppb PFOA / 1000 ppb PFOA-related",scope:"All uses",exemptions:"Semiconductor manufacturing (until 2025), implantable medical devices"},
  {entry:30,substances:["7439-97-6"],name:"Mercury and mercury compounds",condition:"Shall not be placed on the market in measuring devices, switches, relays",scope:"Consumer and professional measuring devices",exemptions:"Large-scale industrial installations, military/aerospace"}
];

// ─── SVHC CANDIDATE LIST & AUTHORIZATION (Annex XIV) ────────────────────
const AUTHORIZATION_ENTRIES = {
  "50-00-0":  {candidateDate:"2016-01-12",reason:"Art. 57(a) — CMR (Carc. 1B)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Glutaraldehyde","Peracetic acid","Ortho-phthalaldehyde"],socioEconomic:"Widely used biocide; alternatives exist for most applications but not all"},
  "71-43-2":  {candidateDate:"2010-01-13",reason:"Art. 57(a) — CMR (Carc. 1A, Muta. 1B)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Toluene (lower hazard)","Cyclohexane","Heptane"],socioEconomic:"Critical chemical intermediate; alternatives feasible for solvent uses"},
  "79-01-6":  {candidateDate:"2016-06-20",reason:"Art. 57(a) — CMR (Carc. 1B)",annexXIV:true,sunsetDate:"2016-04-21",latestAppDate:"2013-10-21",alternatives:["Modified alcohols","Aqueous cleaning","nPB (with restrictions)"],socioEconomic:"€2.1B/year EU market; degreasing alternatives available but capital-intensive transition"},
  "107-06-2": {candidateDate:"2012-06-18",reason:"Art. 57(a) — CMR (Carc. 1B)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Direct chlorination processes"],socioEconomic:"Intermediate for PVC — no viable alternative for this use"},
  "50-32-8":  {candidateDate:"2010-01-13",reason:"Art. 57(a)(b)(c) — CMR (Carc. 1B, Muta. 1B, Repr. 1B) + PBT + vPvB",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Process controls to minimize formation"],socioEconomic:"Unavoidable byproduct of combustion; control-based approach"},
  "7440-02-0":{candidateDate:"2018-06-27",reason:"Art. 57(a) — CMR (Carc. 2) + Art. 57(f) — Resp. Sens.",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Cobalt-free alloys","Copper alloys"],socioEconomic:"Critical for stainless steel, batteries; limited alternatives"},
  "7440-43-9":{candidateDate:"2012-06-18",reason:"Art. 57(a) — CMR (Carc. 1B, Muta. 2, Repr. 2)",annexXIV:true,sunsetDate:"2016-05-21",latestAppDate:"2013-11-21",alternatives:["Zinc coatings","Lithium-ion batteries"],socioEconomic:"NiCd battery phase-out largely complete; remaining uses in aerospace"},
  "7440-38-2":{candidateDate:"2010-01-13",reason:"Art. 57(a) — CMR (Carc. 1A)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Copper-based wood preservatives","Silicon-based semiconductors"],socioEconomic:"Legacy contamination; new uses largely eliminated"},
  "7439-92-1":{candidateDate:"2018-06-27",reason:"Art. 57(c) — Repr. 1A",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Lithium-ion batteries","Tin-based solders"],socioEconomic:"Lead-acid batteries remain dominant for automotive; transition ongoing"},
  "7439-97-6":{candidateDate:"2010-01-13",reason:"Art. 57(a)(c) — Repr. 1B + PBT equivalent",annexXIV:true,sunsetDate:"2017-04-10",latestAppDate:"2014-10-10",alternatives:["Digital thermometers","LED lighting","Composite dental fillings"],socioEconomic:"Minamata Convention driving global phase-out"},
  "106-99-0": {candidateDate:"2010-01-13",reason:"Art. 57(a) — CMR (Carc. 1A, Muta. 1B)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Bio-based butadiene","Isoprene"],socioEconomic:"Fundamental monomer for synthetic rubber; no drop-in replacement at scale"},
  "75-21-8":  {candidateDate:"2012-12-19",reason:"Art. 57(a) — CMR (Carc. 1B, Muta. 1B, Repr. 1B)",annexXIV:false,sunsetDate:null,latestAppDate:null,alternatives:["Hydrogen peroxide sterilization","Gamma irradiation"],socioEconomic:"Critical for medical device sterilization; alternatives not suitable for all device types"},
  "1333-82-0":{candidateDate:"2010-01-13",reason:"Art. 57(a) — CMR (Carc. 1A, Muta. 1B) + Art. 57(f)",annexXIV:true,sunsetDate:"2017-09-21",latestAppDate:"2015-03-21",alternatives:["Trivalent chromium plating","PVD coatings","HVOF thermal spray"],socioEconomic:"€3.6B/year EU market; functional chrome plating transition requires significant CAPEX"},
  "302-01-2": {candidateDate:"2011-06-20",reason:"Art. 57(a) — CMR (Carc. 1B)",annexXIV:true,sunsetDate:"2017-08-21",latestAppDate:"2015-02-21",alternatives:["Carbohydrazide","Erythorbic acid (for O₂ scavenging)"],socioEconomic:"Boiler water treatment and rocket fuel; alternatives exist for water treatment"}
};

// ─── DNEL / PNEC VALUES ──────────────────────────────────────────────────
const DNEL_PNEC = {
  "50-00-0":  {dnelWorkerInhal:0.369,dnelWorkerDermal:2.4,dnelGenPopInhal:0.1,dnelGenPopDermal:1.1,dnelGenPopOral:1.5,pnecFreshwater:0.0092,pnecMarine:0.00092,pnecSTP:6.8,pnecSediment:0.0544,pnecSoil:0.0136,unit_dnel:"mg/m³ or mg/kg bw/d",unit_pnec:"mg/L or mg/kg"},
  "67-56-1":  {dnelWorkerInhal:260,dnelWorkerDermal:40,dnelGenPopInhal:26,dnelGenPopDermal:8,dnelGenPopOral:8,pnecFreshwater:15.4,pnecMarine:1.54,pnecSTP:100,pnecSediment:57.2,pnecSoil:1.37,unit_dnel:"mg/m³ or mg/kg bw/d",unit_pnec:"mg/L or mg/kg"},
  "64-17-5":  {dnelWorkerInhal:950,dnelWorkerDermal:343,dnelGenPopInhal:114,dnelGenPopDermal:206,dnelGenPopOral:87,pnecFreshwater:0.96,pnecMarine:0.096,pnecSTP:580,pnecSediment:3.6,pnecSoil:0.63,unit_dnel:"mg/m³ or mg/kg bw/d",unit_pnec:"mg/L or mg/kg"},
  "71-43-2":  {dnelWorkerInhal:1.65,dnelWorkerDermal:null,dnelGenPopInhal:0.165,dnelGenPopDermal:null,dnelGenPopOral:0.043,pnecFreshwater:0.008,pnecMarine:0.0008,pnecSTP:1.0,pnecSediment:0.057,pnecSoil:0.012,unit_dnel:"mg/m³ or mg/kg bw/d",unit_pnec:"mg/L or mg/kg"},
  "108-88-3": {dnelWorkerInhal:192,dnelWorkerDermal:384,dnelGenPopInhal:56.5,dnelGenPopDermal:226,dnelGenPopOral:8.12,pnecFreshwater:0.068,pnecMarine:0.0068,pnecSTP:13.6,pnecSediment:0.254,pnecSoil:0.052,unit_dnel:"mg/m³ or mg/kg bw/d",unit_pnec:"mg/L or mg/kg"},
  "1310-73-2":{dnelWorkerInhal:1.0,dnelWorkerDermal:null,dnelGenPopInhal:null,dnelGenPopDermal:null,dnelGenPopOral:null,pnecFreshwater:null,pnecMarine:null,pnecSTP:null,pnecSediment:null,pnecSoil:null,unit_dnel:"mg/m³",unit_pnec:"pH-driven"},
  "50-00-0_oel":{oelTWA8h:0.3,oelSTEL:0.6,oelUnit:"ppm",oelSource:"Directive (EU) 2019/983"},
  "71-43-2_oel":{oelTWA8h:0.5,oelSTEL:2.5,oelUnit:"ppm",oelSource:"Directive 2004/37/EC (CMD)"},
  "108-88-3_oel":{oelTWA8h:50,oelSTEL:100,oelUnit:"ppm",oelSource:"Directive 2000/39/EC (1st IOELV)"}
};

// ─── EXPOSURE SCENARIOS (Contributing Scenarios) ─────────────────────────
const EXPOSURE_SCENARIOS = {
  "50-00-0":[
    {esTitle:"ES 1: Industrial use as intermediate",procCat:"PROC 1, PROC 2",envRelCat:"ERC 6a",
      contribScenarios:[
        {name:"CS 1.1: Closed continuous process with occasional controlled exposure",proc:"PROC 1",duration:"8 h/d",frequency:"220 d/y",concentration:"≥ 99.5%",ppe:"Respiratory protection (APF 10) when opening equipment",lev:"Integrated LEV on sampling points",rcrWorkerInhal:0.42,rcrWorkerDermal:0.15},
        {name:"CS 1.2: Sampling and loading/unloading",proc:"PROC 8b",duration:"1 h/d",frequency:"220 d/y",concentration:"≥ 99.5%",ppe:"Full-face respirator (APF 20), chemical-resistant gloves (nitrile ≥0.4mm)",lev:"LEV at transfer points",rcrWorkerInhal:0.68,rcrWorkerDermal:0.31}
      ],
      envRcr:{rcrFreshwater:0.22,rcrMarine:0.18,rcrSTP:0.05,rcrSoil:0.08}},
    {esTitle:"ES 2: Professional use in resin production",procCat:"PROC 5, PROC 8a",envRelCat:"ERC 5",
      contribScenarios:[
        {name:"CS 2.1: Mixing/blending in batch process",proc:"PROC 5",duration:"4 h/d",frequency:"220 d/y",concentration:"0.1 – 25%",ppe:"Half-face respirator (APF 10), nitrile gloves, safety goggles",lev:"General ventilation + LEV at mixing point",rcrWorkerInhal:0.55,rcrWorkerDermal:0.28},
        {name:"CS 2.2: Application by roller/brush",proc:"PROC 10",duration:"6 h/d",frequency:"220 d/y",concentration:"0.1 – 5%",ppe:"Respiratory protection (APF 10), chemical-resistant gloves, coverall",lev:"General ventilation (indoor)",rcrWorkerInhal:0.72,rcrWorkerDermal:0.45}
      ],
      envRcr:{rcrFreshwater:0.35,rcrMarine:0.28,rcrSTP:0.12,rcrSoil:0.15}}
  ],
  "71-43-2":[
    {esTitle:"ES 1: Industrial use as chemical intermediate (strictly controlled)",procCat:"PROC 1",envRelCat:"ERC 6a",
      contribScenarios:[
        {name:"CS 1.1: Closed continuous process — no direct exposure expected",proc:"PROC 1",duration:"8 h/d",frequency:"220 d/y",concentration:"≥ 99%",ppe:"Emergency escape respirator available; routine: none required",lev:"Fully enclosed system with gas detection",rcrWorkerInhal:0.12,rcrWorkerDermal:0.05}
      ],
      envRcr:{rcrFreshwater:0.08,rcrMarine:0.06,rcrSTP:0.02,rcrSoil:0.03}}
  ],
  "108-88-3":[
    {esTitle:"ES 1: Industrial use as solvent",procCat:"PROC 1, PROC 2, PROC 3, PROC 4",envRelCat:"ERC 4",
      contribScenarios:[
        {name:"CS 1.1: Use in closed batch process",proc:"PROC 3",duration:"8 h/d",frequency:"220 d/y",concentration:"≥ 99%",ppe:"Organic vapour respirator when opening equipment",lev:"LEV on reactor vents",rcrWorkerInhal:0.35,rcrWorkerDermal:0.12},
        {name:"CS 1.2: Transfer and drum filling",proc:"PROC 8b",duration:"2 h/d",frequency:"220 d/y",concentration:"≥ 99%",ppe:"Full-face organic vapour respirator, chemical gloves",lev:"LEV at filling station",rcrWorkerInhal:0.58,rcrWorkerDermal:0.22}
      ],
      envRcr:{rcrFreshwater:0.28,rcrMarine:0.22,rcrSTP:0.08,rcrSoil:0.12}},
    {esTitle:"ES 2: Professional use in coatings",procCat:"PROC 10, PROC 11",envRelCat:"ERC 5",
      contribScenarios:[
        {name:"CS 2.1: Spray application (indoor)",proc:"PROC 11",duration:"4 h/d",frequency:"220 d/y",concentration:"10 – 50%",ppe:"Supplied-air respirator, chemical suit, gloves",lev:"Spray booth with extraction",rcrWorkerInhal:0.78,rcrWorkerDermal:0.55}
      ],
      envRcr:{rcrFreshwater:0.42,rcrMarine:0.35,rcrSTP:0.15,rcrSoil:0.18}}
  ]
};

// ─── READ-ACROSS ANALOGUE GROUPS ─────────────────────────────────────────
const READ_ACROSS_GROUPS = [
  {groupName:"Short-chain aliphatic alcohols",members:["67-56-1","64-17-5","67-63-0"],
    justification:"Structural similarity: linear C1–C3 aliphatic alcohols with single hydroxyl group. Common metabolic pathway via alcohol dehydrogenase → aldehyde dehydrogenase. Consistent trend in acute toxicity decreasing with chain length. Supported by OECD QSAR Toolbox profiling.",
    endpoints:["acuteTox","skinIrrit","eyeIrrit","biodeg"],
    confidence:"High",regulatoryPrecedent:"ECHA disseminated dossier for propan-1-ol references ethanol read-across for eye irritation."},
  {groupName:"BTEX aromatics",members:["71-43-2","108-88-3","100-41-4","1330-20-7","100-42-5"],
    justification:"Monosubstituted benzene derivatives with similar physical-chemical properties and metabolic pathways (ring hydroxylation via CYP2E1). Consistent narcotic mode of action for acute aquatic toxicity. Benzene is the outlier for haematotoxicity (unique metabolite benzoquinone).",
    endpoints:["acuteAquatic","biodeg","adsorptionDesorption"],
    confidence:"Medium — benzene haematotoxicity cannot be read across",regulatoryPrecedent:"ECHA grouping assessment for petroleum substances (2014)."},
  {groupName:"Chlorinated ethylenes",members:["79-01-6","127-18-4","107-06-2"],
    justification:"C2 chlorinated hydrocarbons with similar physical-chemical behaviour. Metabolic activation via CYP2E1 to reactive intermediates. Common concern for genotoxicity/carcinogenicity. Environmental persistence correlates with degree of chlorination.",
    endpoints:["biodeg","bioaccumulation","chronicAquatic"],
    confidence:"Medium",regulatoryPrecedent:"ECHA substance evaluation for TCE (2015) references PCE data."},
  {groupName:"Heavy metals (divalent cations)",members:["7440-02-0","7440-43-9","7440-38-2","7439-92-1","7439-97-6"],
    justification:"Divalent metal cations with similar bioavailability and toxicity mechanisms (protein binding, oxidative stress, ion channel disruption). BLM (Biotic Ligand Model) applicable for aquatic toxicity normalization. However, each metal has unique target organ specificity — read-across limited to environmental fate.",
    endpoints:["adsorptionDesorption","sedimentTox"],
    confidence:"Low — toxicological read-across not recommended",regulatoryPrecedent:"ECHA metals & inorganics guidance (2008)."}
];

// ─── UN TRANSPORT CLASSIFICATIONS ────────────────────────────────────────
const UN_TRANSPORT = {
  "50-00-0":  {un:1198,properShipping:"Formaldehyde solution, flammable",class:"3",subsidiary:"8",packingGroup:"III",labels:["Flammable liquid","Corrosive"],imdg:true,iata:true,adr:true,tunnelCode:"(E)"},
  "67-56-1":  {un:1230,properShipping:"Methanol",class:"3",subsidiary:"6.1",packingGroup:"II",labels:["Flammable liquid","Toxic"],imdg:true,iata:true,adr:true,tunnelCode:"(D/E)"},
  "64-17-5":  {un:1170,properShipping:"Ethanol",class:"3",subsidiary:null,packingGroup:"II",labels:["Flammable liquid"],imdg:true,iata:true,adr:true,tunnelCode:"(D/E)"},
  "71-43-2":  {un:1114,properShipping:"Benzene",class:"3",subsidiary:null,packingGroup:"II",labels:["Flammable liquid"],imdg:true,iata:true,adr:true,tunnelCode:"(D/E)"},
  "108-88-3": {un:1294,properShipping:"Toluene",class:"3",subsidiary:null,packingGroup:"II",labels:["Flammable liquid"],imdg:true,iata:true,adr:true,tunnelCode:"(D/E)"},
  "1310-73-2":{un:1823,properShipping:"Sodium hydroxide, solid",class:"8",subsidiary:null,packingGroup:"II",labels:["Corrosive"],imdg:true,iata:true,adr:true,tunnelCode:"(E)"},
  "7664-93-9":{un:1830,properShipping:"Sulfuric acid",class:"8",subsidiary:null,packingGroup:"II",labels:["Corrosive"],imdg:true,iata:true,adr:true,tunnelCode:"(E)"},
  "7647-01-0":{un:1789,properShipping:"Hydrochloric acid",class:"8",subsidiary:null,packingGroup:"II",labels:["Corrosive"],imdg:true,iata:true,adr:true,tunnelCode:"(E)"},
  "7722-84-1":{un:2015,properShipping:"Hydrogen peroxide, stabilized",class:"5.1",subsidiary:"8",packingGroup:"II",labels:["Oxidizer","Corrosive"],imdg:true,iata:true,adr:true,tunnelCode:"(B/E)"},
  "302-01-2": {un:2029,properShipping:"Hydrazine, anhydrous",class:"8",subsidiary:"3, 6.1",packingGroup:"I",labels:["Corrosive","Flammable liquid","Toxic"],imdg:true,iata:true,adr:true,tunnelCode:"(C/D)"}
};

// ─── SUBSTANCE DATABASE (enhanced with REACH-specific fields) ────────────
const CHEMICALS_DB = [
  {cas:"50-00-0",name:"Formaldehyde",formula:"CH₂O",mw:30.03,state:"Gas",use:"Disinfectant, resin production, biocide, wood panel manufacturing",
    ecNumber:"200-001-8",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.000.002",
    iupac:"Methanal",smiles:"C=O",inchi:"InChI=1S/CH2O/c1-2/h1H2",
    clp:["Acute Tox. 3 (Oral)","Acute Tox. 3 (Dermal)","Acute Tox. 3 (Inhalation)","Skin Corr. 1B","Skin Sens. 1","Muta. 2","Carc. 1B"],
    harmonisedCLP:true,clpIndex:"605-001-00-5",atpNumber:"ATP 21",
    hStatements:["H301","H311","H331","H314","H317","H341","H350"],pStatements:["P201","P280","P301+P310","P305+P351+P338"],
    pictograms:["GHS05","GHS06","GHS08"],signal:"Danger",svhc:true,reach:"01-2119488953-20",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"BASF SE",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"waived",furtherFate:"complete",sedimentTox:"waived",carcinogenicity:"complete",longTermReproTox:"complete",furtherMutagenicity:"complete",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-92,bp:-19.5,density:0.815,vp:3890,logP:0.35,solubility:"Miscible",flashPoint:64,autoIgnition:430,ph:"2.8-3.5 (37% solution)"}},

  {cas:"67-56-1",name:"Methanol",formula:"CH₃OH",mw:32.04,state:"Liquid",use:"Solvent, fuel, chemical feedstock, formaldehyde production",
    ecNumber:"200-659-6",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.000.599",
    iupac:"Methanol",smiles:"CO",inchi:"InChI=1S/CH4O/c1-2/h2H,1H3",
    clp:["Flam. Liq. 2","Acute Tox. 3 (Oral)","Acute Tox. 3 (Dermal)","Acute Tox. 3 (Inhalation)","STOT SE 1"],
    harmonisedCLP:true,clpIndex:"603-001-00-X",atpNumber:"ATP 1",
    hStatements:["H225","H301","H311","H331","H370"],pStatements:["P210","P233","P280","P302+P352","P304+P340"],
    pictograms:["GHS02","GHS06","GHS08"],signal:"Danger",svhc:false,reach:"01-2119433307-44",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Methanex Europe SA",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"waived",furtherFate:"complete",sedimentTox:"waived",carcinogenicity:"complete",longTermReproTox:"complete",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-97.6,bp:64.7,density:0.792,vp:12800,logP:-0.77,solubility:"Miscible",flashPoint:11,autoIgnition:464,ph:"N/A"}},

  {cas:"64-17-5",name:"Ethanol",formula:"C₂H₅OH",mw:46.07,state:"Liquid",use:"Solvent, fuel, beverages, disinfectant, pharmaceutical excipient",
    ecNumber:"200-578-6",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.000.526",
    iupac:"Ethanol",smiles:"CCO",inchi:"InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3",
    clp:["Flam. Liq. 2","Eye Irrit. 2"],
    harmonisedCLP:false,clpIndex:null,atpNumber:null,
    hStatements:["H225","H319"],pStatements:["P210","P233","P305+P351+P338"],
    pictograms:["GHS02","GHS07"],signal:"Danger",svhc:false,reach:"01-2119457610-43",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Cefic Ethanol REACH Consortium",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"waived",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"waived",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"waived",furtherFate:"complete",sedimentTox:"waived",carcinogenicity:"complete",longTermReproTox:"complete",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-114.1,bp:78.4,density:0.789,vp:5950,logP:-0.31,solubility:"Miscible",flashPoint:13,autoIgnition:363,ph:"N/A"}},

  {cas:"67-64-1",name:"Acetone",formula:"C₃H₆O",mw:58.08,state:"Liquid",use:"Solvent, cleaning agent, chemical intermediate, nail polish remover",
    ecNumber:"200-662-2",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.000.602",
    iupac:"Propan-2-one",smiles:"CC(C)=O",inchi:"InChI=1S/C3H6O/c1-3(2)4/h1-2H3",
    clp:["Flam. Liq. 2","Eye Irrit. 2","STOT SE 3"],
    harmonisedCLP:false,clpIndex:null,atpNumber:null,
    hStatements:["H225","H319","H336"],pStatements:["P210","P233","P305+P351+P338"],
    pictograms:["GHS02","GHS07"],signal:"Danger",svhc:false,reach:"01-2119471330-49",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Cefic Solvents Group",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"waived",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"waived",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"waived",furtherFate:"complete",sedimentTox:"waived",carcinogenicity:"waived",longTermReproTox:"complete",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-94.7,bp:56.1,density:0.791,vp:24000,logP:-0.24,solubility:"Miscible",flashPoint:-20,autoIgnition:465,ph:"N/A"}},

  {cas:"71-43-2",name:"Benzene",formula:"C₆H₆",mw:78.11,state:"Liquid",use:"Chemical intermediate, laboratory solvent (restricted)",
    ecNumber:"200-753-7",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.000.685",
    iupac:"Benzene",smiles:"c1ccccc1",inchi:"InChI=1S/C6H6/c1-2-4-6-5-3-1/h1-6H",
    clp:["Flam. Liq. 2","Carc. 1A","Muta. 1B","STOT RE 1","Asp. Tox. 1","Skin Irrit. 2","Eye Irrit. 2"],
    harmonisedCLP:true,clpIndex:"601-020-00-8",atpNumber:"ATP 1",
    hStatements:["H225","H350","H340","H372","H304","H315","H319"],pStatements:["P201","P210","P280","P308+P313"],
    pictograms:["GHS02","GHS07","GHS08"],signal:"Danger",svhc:true,reach:"01-2119401765-36",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Concawe",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"complete",furtherFate:"complete",sedimentTox:"complete",carcinogenicity:"complete",longTermReproTox:"complete",furtherMutagenicity:"complete",longTermTerrestrial:"complete",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:5.5,bp:80.1,density:0.879,vp:9970,logP:2.13,solubility:"1.79 g/L",flashPoint:-11,autoIgnition:498,ph:"N/A"}},

  {cas:"108-88-3",name:"Toluene",formula:"C₇H₈",mw:92.14,state:"Liquid",use:"Solvent, fuel additive, chemical feedstock, coatings",
    ecNumber:"203-625-9",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.003.297",
    iupac:"Toluene",smiles:"Cc1ccccc1",inchi:"InChI=1S/C7H8/c1-7-5-3-2-4-6-7/h2-6H,1H3",
    clp:["Flam. Liq. 2","Asp. Tox. 1","Skin Irrit. 2","STOT SE 3","STOT RE 2","Repr. 2"],
    harmonisedCLP:true,clpIndex:"601-021-00-3",atpNumber:"ATP 8",
    hStatements:["H225","H304","H315","H336","H373","H361d"],pStatements:["P210","P261","P280","P301+P310"],
    pictograms:["GHS02","GHS07","GHS08"],signal:"Danger",svhc:false,reach:"01-2119471310-51",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Concawe",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"complete",furtherFate:"complete",sedimentTox:"complete",carcinogenicity:"complete",longTermReproTox:"complete",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-95,bp:110.6,density:0.867,vp:2900,logP:2.73,solubility:"0.52 g/L",flashPoint:4,autoIgnition:480,ph:"N/A"}},

  {cas:"1310-73-2",name:"Sodium Hydroxide",formula:"NaOH",mw:40.0,state:"Solid",use:"Chemical manufacturing, water treatment, cleaning, pulp & paper",
    ecNumber:"215-185-5",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.013.805",
    iupac:"Sodium hydroxide",smiles:"[Na+].[OH-]",inchi:"InChI=1S/Na.H2O/h;1H2/q+1;/p-1",
    clp:["Skin Corr. 1A","Acute Tox. 4 (Oral)","Met. Corr. 1"],
    harmonisedCLP:true,clpIndex:"011-002-00-6",atpNumber:"ATP 1",
    hStatements:["H314","H302","H290"],pStatements:["P260","P280","P301+P330+P331","P305+P351+P338"],
    pictograms:["GHS05","GHS07"],signal:"Danger",svhc:false,reach:"01-2119457892-27",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Euro Chlor",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"not_required",logP:"not_required",subacuteTox28d:"complete",reproScreen:"waived",mutagenicity_invivo:"waived",chronicAquatic:"waived",adsorptionDesorption:"not_required",shortTermFish:"complete",daphniaChronic:"waived",terrestrialTox:"waived",subchronicTox90d:"waived",prenatalDev:"waived",reproTwoGen:"waived",longTermAquatic:"waived",bioaccumulation:"not_required",furtherFate:"not_required",sedimentTox:"waived",carcinogenicity:"waived",longTermReproTox:"waived",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:323,bp:1388,density:2.13,vp:0,logP:-3.88,solubility:"1110 g/L",flashPoint:null,autoIgnition:null,ph:"14 (1M solution)"}},

  {cas:"7664-93-9",name:"Sulfuric Acid",formula:"H₂SO₄",mw:98.08,state:"Liquid",use:"Chemical manufacturing, batteries, fertilizers, metal processing",
    ecNumber:"231-639-5",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.028.763",
    iupac:"Sulfuric acid",smiles:"OS(O)(=O)=O",inchi:"InChI=1S/H2O4S/c1-5(2,3)4/h(H2,1,2,3,4)",
    clp:["Skin Corr. 1A","Ox. Liq. 2"],
    harmonisedCLP:true,clpIndex:"016-020-00-8",atpNumber:"ATP 1",
    hStatements:["H314","H272"],pStatements:["P220","P260","P280","P301+P330+P331","P305+P351+P338"],
    pictograms:["GHS03","GHS05"],signal:"Danger",svhc:false,reach:"01-2119458838-20",
    tonnageBand:"1000+",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Essenscia",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"not_required",logP:"not_required",subacuteTox28d:"complete",reproScreen:"waived",mutagenicity_invivo:"waived",chronicAquatic:"waived",adsorptionDesorption:"not_required",shortTermFish:"complete",daphniaChronic:"waived",terrestrialTox:"waived",subchronicTox90d:"waived",prenatalDev:"waived",reproTwoGen:"waived",longTermAquatic:"waived",bioaccumulation:"not_required",furtherFate:"not_required",sedimentTox:"waived",carcinogenicity:"waived",longTermReproTox:"waived",furtherMutagenicity:"waived",longTermTerrestrial:"waived",fieldStudies:"waived"},
    csr:true,exposureAssessment:true,
    physChem:{mp:10.4,bp:337,density:1.84,vp:0.13,logP:-1.0,solubility:"Miscible",flashPoint:null,autoIgnition:null,ph:"<1 (1M solution)"}},

  {cas:"79-01-6",name:"Trichloroethylene",formula:"C₂HCl₃",mw:131.39,state:"Liquid",use:"Degreasing (authorized use), dry cleaning (legacy)",
    ecNumber:"201-167-4",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.001.062",
    iupac:"Trichloroethene",smiles:"ClC=C(Cl)Cl",inchi:"InChI=1S/C2HCl3/c3-1-2(4)5/h1H",
    clp:["Carc. 1B","Muta. 2","Skin Irrit. 2","Eye Irrit. 2","STOT SE 3","Aquatic Chronic 3"],
    harmonisedCLP:true,clpIndex:"602-027-00-9",atpNumber:"ATP 6",
    hStatements:["H350","H341","H315","H319","H336","H412"],pStatements:["P201","P261","P280","P308+P313"],
    pictograms:["GHS07","GHS08"],signal:"Danger",svhc:true,reach:"01-2119471311-49",
    tonnageBand:"100-1000",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"ECSA (European Chlorinated Solvent Association)",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"complete",furtherFate:"complete",sedimentTox:"read_across"},
    csr:true,exposureAssessment:true,
    physChem:{mp:-73,bp:87.2,density:1.46,vp:7700,logP:2.42,solubility:"1.1 g/L",flashPoint:null,autoIgnition:420,ph:"N/A"}},

  {cas:"1333-82-0",name:"Chromium Trioxide",formula:"CrO₃",mw:100.0,state:"Solid",use:"Chrome plating (authorized), wood preservation (legacy)",
    ecNumber:"215-607-8",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.014.189",
    iupac:"Chromium trioxide",smiles:"O=[Cr](=O)=O",inchi:"InChI=1S/Cr.3O/q+6;;;/p-6",
    clp:["Ox. Sol. 1","Carc. 1A","Muta. 1B","Repr. 2","Acute Tox. 2 (Oral)","Acute Tox. 2 (Inhalation)","Acute Tox. 3 (Dermal)","Skin Corr. 1A","Resp. Sens. 1","Skin Sens. 1","Aquatic Acute 1","Aquatic Chronic 1"],
    harmonisedCLP:true,clpIndex:"024-010-00-0",atpNumber:"ATP 1",
    hStatements:["H271","H350","H340","H361f","H300","H330","H311","H314","H334","H317","H400","H410"],
    pStatements:["P201","P210","P260","P273","P280","P284","P308+P313"],
    pictograms:["GHS03","GHS05","GHS06","GHS08","GHS09"],signal:"Danger",svhc:true,reach:"01-2119487470-33",
    tonnageBand:"100-1000",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"CTACSub REACH Consortium",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"not_required",logP:"not_required",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"complete",subchronicTox90d:"complete",prenatalDev:"complete",reproTwoGen:"complete",longTermAquatic:"complete",bioaccumulation:"not_required",furtherFate:"complete",sedimentTox:"complete"},
    csr:true,exposureAssessment:true,
    physChem:{mp:197,bp:250,density:2.7,vp:0,logP:null,solubility:"630 g/L",flashPoint:null,autoIgnition:null,ph:"<1 (solution)"}},

  {cas:"302-01-2",name:"Hydrazine",formula:"N₂H₄",mw:32.05,state:"Liquid",use:"Boiler water treatment, rocket fuel, chemical synthesis",
    ecNumber:"206-114-9",echaUrl:"https://echa.europa.eu/substance-information/-/substanceinfo/100.005.560",
    iupac:"Hydrazine",smiles:"NN",inchi:"InChI=1S/H4N2/c1-2/h1-2H2",
    clp:["Flam. Liq. 3","Carc. 1B","Acute Tox. 3 (Oral)","Acute Tox. 3 (Dermal)","Acute Tox. 3 (Inhalation)","Skin Corr. 1B","Skin Sens. 1","Aquatic Acute 1","Aquatic Chronic 1"],
    harmonisedCLP:true,clpIndex:"007-008-00-3",atpNumber:"ATP 1",
    hStatements:["H226","H350","H301","H311","H331","H314","H317","H400","H410"],
    pStatements:["P201","P210","P260","P273","P280","P308+P313"],
    pictograms:["GHS02","GHS05","GHS06","GHS08","GHS09"],signal:"Danger",svhc:true,reach:"01-2119457627-24",
    tonnageBand:"10-100",registrationStatus:"Active",registrationType:"Full",jointSubmission:true,leadRegistrant:"Arkema France",
    dossierCompleteness:{physChem:"complete",acuteTox:"complete",skinIrrit:"complete",eyeIrrit:"complete",skinSens:"complete",mutagenicity_invitro:"complete",acuteAquatic:"complete",biodeg:"complete",logP:"complete",subacuteTox28d:"complete",reproScreen:"complete",mutagenicity_invivo:"complete",chronicAquatic:"complete",adsorptionDesorption:"complete",shortTermFish:"complete",daphniaChronic:"complete",terrestrialTox:"read_across"},
    csr:true,exposureAssessment:true,
    physChem:{mp:2,bp:114,density:1.004,vp:1400,logP:-2.07,solubility:"Miscible",flashPoint:38,autoIgnition:24,ph:"10.5 (10% solution)"}}
];

// ─── H-STATEMENTS ────────────────────────────────────────────────────────
const H_STATEMENTS = {
  "H220":"Extremely flammable gas","H221":"Flammable gas","H225":"Highly flammable liquid and vapour","H226":"Flammable liquid and vapour",
  "H270":"May cause or intensify fire; oxidiser","H271":"May cause fire or explosion; strong oxidiser","H272":"May intensify fire; oxidiser",
  "H280":"Contains gas under pressure; may explode if heated","H290":"May be corrosive to metals",
  "H300":"Fatal if swallowed","H301":"Toxic if swallowed","H302":"Harmful if swallowed","H304":"May be fatal if swallowed and enters airways",
  "H310":"Fatal in contact with skin","H311":"Toxic in contact with skin","H312":"Harmful in contact with skin","H314":"Causes severe skin burns and eye damage",
  "H315":"Causes skin irritation","H317":"May cause an allergic skin reaction","H319":"Causes serious eye irritation",
  "H330":"Fatal if inhaled","H331":"Toxic if inhaled","H332":"Harmful if inhaled","H334":"May cause allergy or asthma symptoms or breathing difficulties if inhaled",
  "H335":"May cause respiratory irritation","H336":"May cause drowsiness or dizziness",
  "H340":"May cause genetic defects","H341":"Suspected of causing genetic defects",
  "H350":"May cause cancer","H351":"Suspected of causing cancer",
  "H360D":"May damage the unborn child","H360F":"May damage fertility","H360FD":"May damage fertility. May damage the unborn child.",
  "H361d":"Suspected of damaging the unborn child","H361f":"Suspected of damaging fertility","H361fd":"Suspected of damaging fertility. Suspected of damaging the unborn child.",
  "H362":"May cause harm to breast-fed children",
  "H370":"Causes damage to organs","H372":"Causes damage to organs through prolonged or repeated exposure",
  "H373":"May cause damage to organs through prolonged or repeated exposure",
  "H400":"Very toxic to aquatic life","H410":"Very toxic to aquatic life with long lasting effects",
  "H411":"Toxic to aquatic life with long lasting effects","H412":"Harmful to aquatic life with long lasting effects",
  "EUH059":"Hazardous to the ozone layer"
};

const GHS_PICTOGRAMS = {
  "GHS01":{name:"Exploding Bomb",icon:"💥",color:"#ef4444"},
  "GHS02":{name:"Flame",icon:"🔥",color:"#f97316"},
  "GHS03":{name:"Flame Over Circle",icon:"⭕",color:"#f97316"},
  "GHS04":{name:"Gas Cylinder",icon:"🔵",color:"#3b82f6"},
  "GHS05":{name:"Corrosion",icon:"⚗️",color:"#a855f7"},
  "GHS06":{name:"Skull & Crossbones",icon:"☠️",color:"#ef4444"},
  "GHS07":{name:"Exclamation Mark",icon:"⚠️",color:"#eab308"},
  "GHS08":{name:"Health Hazard",icon:"🫁",color:"#ef4444"},
  "GHS09":{name:"Environment",icon:"🌿",color:"#22c55e"}
};

// ─── AI COPILOT KNOWLEDGE BASE ───────────────────────────────────────────
const AI_COPILOT_RULES = {
  dossierGaps: {
    "physChem":      "Physical-chemical data is mandatory for all tonnage bands (Annex VII, Section 7). No waiver possible. Use OECD TG 101-120. If the substance is a UVCB, provide characterization of the composition boundaries.",
    "acuteTox":      "Acute toxicity by all three routes (oral/dermal/inhalation) is required at Annex VII. For gases, inhalation is the primary route. Consider ATE calculation for mixtures per CLP Regulation Article 10. In vivo testing can be replaced by validated in vitro methods (3T3 NRU for oral, EpiDerm for dermal) per Annex XI 1.5.",
    "skinIrrit":     "Can be waived under Annex VII Column 2 if the substance is classified as Skin Corr. 1 (pH ≤ 2 or ≥ 11.5), or if acute dermal toxicity study shows no irritation. In vitro methods (OECD TG 439, EpiSkin/EpiDerm) are the default before in vivo.",
    "eyeIrrit":      "Can be waived if classified as Skin Corr. 1 or Serious Eye Damage 1. Sequential testing strategy: start with in vitro (OECD TG 437 BCOP, TG 438 ICE, TG 491 STE), proceed to in vivo TG 405 only if inconclusive.",
    "skinSens":      "Non-animal methods are now the default: DPRA (TG 442C), KeratinoSens (TG 442D), h-CLAT (TG 442E), or the defined approach (IATA). In vivo LLNA (TG 429) only as last resort with justification.",
    "mutagenicity_invitro": "Ames test (TG 471) is the minimum. If positive, in vitro mammalian cell assay (TG 473/476/487) is needed before in vivo. Negative Ames + negative mammalian cell = no further testing needed at Annex VII.",
    "subacuteTox28d": "28-day repeated dose (TG 407) is the standard at Annex VIII. Route should match expected human exposure. Oral (gavage or diet) is default. Can be combined with reproductive screening (TG 422) to reduce animal use.",
    "subchronicTox90d": "90-day study (TG 408) required at Annex IX. Must include haematology, clinical chemistry, organ weights, histopathology. Route should match the 28-day study. Testing proposal required — ECHA has 12 months to evaluate.",
    "prenatalDev":   "OECD TG 414 in two species (rat + rabbit) at Annex IX. Testing proposal required. Can use one species if justified by weight of evidence. Consider EOGRTS (TG 443) as alternative that covers both developmental and reproductive endpoints.",
    "reproTwoGen":   "EOGRTS (TG 443) has replaced the two-generation study (TG 416) as the default at Annex IX/X. Modular design: trigger cohorts 2A/2B (developmental neurotoxicity) and 3 (developmental immunotoxicity) based on available data.",
    "carcinogenicity": "Annex X only. Combined chronic/carcinogenicity (TG 453) preferred over standalone TG 451. Testing proposal required — ECHA evaluation takes 12 months. Weight of evidence from genotoxicity, repeated dose, and epidemiology should be assessed first.",
    "acuteAquatic":  "Fish (TG 203), Daphnia (TG 202), and algae (TG 201) are all required at Annex VII. For poorly soluble substances (< 1 mg/L), use WAF (Water Accommodated Fraction) approach. Report results as EC50/LC50 with 95% confidence intervals.",
    "chronicAquatic": "Daphnia 21-day reproduction (TG 211) at Annex VIII. Fish early life stage (TG 210) at Annex IX. For substances with log Kow > 3, consider bioaccumulation potential and long-term testing.",
    "biodeg":        "Ready biodegradability (TG 301 A-F) at Annex VII. If not readily biodegradable, simulation testing (TG 307/308/309) may be needed at Annex IX. The 10-day window criterion distinguishes 'readily' from 'inherently' biodegradable.",
    "bioaccumulation": "Fish bioconcentration (TG 305) at Annex IX if log Kow > 3. BCF > 2000 triggers PBT assessment. Dietary exposure method acceptable for highly hydrophobic substances. Can be waived if substance is rapidly biodegradable AND log Kow < 4.5."
  },
  waiverStrategies: {
    "substanceProperties": "Annex XI 1.3: Testing technically not feasible (e.g., substance reacts with water, highly volatile, unstable). Document the technical limitation and propose alternative assessment.",
    "exposureBased":       "Annex XI 3: Exposure-based waiver. Demonstrate negligible exposure for all life-cycle stages using ECETOC TRA or higher-tier models. Only applicable for Annex VIII-X endpoints. Requires documented exposure assessment.",
    "readAcross":          "Annex XI 1.5: Grouping and read-across. Requires: (1) structural similarity, (2) common mechanism/metabolic pathway, (3) consistent trend in the property, (4) adequate and reliable source data. RAAF (Read-Across Assessment Framework) compliance is essential.",
    "weightOfEvidence":    "Annex XI 1.2: Weight of evidence from multiple independent sources. Each source alone insufficient, but together they provide sufficient certainty. Document each source, its reliability (Klimisch score), and the overall assessment.",
    "qsar":                "Annex XI 1.3: QSAR predictions. Model must be validated (OECD QSAR validation principles), substance must fall within the applicability domain, and prediction must be adequate for classification/risk assessment. Document model identity, applicability domain, and reliability."
  },
  iuclidSections: {
    "1":"Substance identification","2":"Composition","3":"Manufacture and uses","4":"Physical-chemical properties",
    "5":"Environmental fate and pathways","6":"Ecotoxicological information","7":"Toxicological information",
    "8":"Analytical methods","9":"Effects on organisms in the environment","10":"Residues in food and feed",
    "11":"Guidance on safe use","12":"Assessment reports","13":"Literature search","14":"Information requirements"
  }
};

// ─── IUCLID XML TEMPLATES ────────────────────────────────────────────────
const IUCLID_XML_TEMPLATES = {
  substanceIdentity: (c) => `<?xml version="1.0" encoding="UTF-8"?>
<SubstanceRecord xmlns="http://iuclid6.echa.europa.eu/namespaces/SUBSTANCE/v3.0">
  <SubstanceIdentity>
    <ReferenceSubstance>
      <IUPACName>${c.iupac || c.name}</IUPACName>
      <CASNumber>${c.cas}</CASNumber>
      <ECNumber>${c.ecNumber || ''}</ECNumber>
      <MolecularFormula>${c.formula}</MolecularFormula>
      <MolecularWeight unit="g/mol">${c.mw}</MolecularWeight>
      <SMILES>${c.smiles || ''}</SMILES>
      <InChI>${c.inchi || ''}</InChI>
    </ReferenceSubstance>
    <SubstanceName>${c.name}</SubstanceName>
    <PublicName>${c.name}</PublicName>
    <SubstanceType>mono-constituent</SubstanceType>
  </SubstanceIdentity>
</SubstanceRecord>`,

  clpNotification: (c) => `<?xml version="1.0" encoding="UTF-8"?>
<CLPNotification xmlns="http://iuclid6.echa.europa.eu/namespaces/CLP/v2.0">
  <SubstanceIdentity>
    <CASNumber>${c.cas}</CASNumber>
    <SubstanceName>${c.name}</SubstanceName>
    <ECNumber>${c.ecNumber || ''}</ECNumber>
  </SubstanceIdentity>
  <Classification>
    <HarmonisedClassification>${c.harmonisedCLP ? 'Yes' : 'No'}</HarmonisedClassification>
    ${c.clpIndex ? `<IndexNumber>${c.clpIndex}</IndexNumber>` : ''}
    <HazardClasses>
${c.clp.map(cl => `      <HazardClass>${cl}</HazardClass>`).join('\n')}
    </HazardClasses>
    <HazardStatements>
${c.hStatements.map(h => `      <Statement code="${h}">${H_STATEMENTS[h] || h}</Statement>`).join('\n')}
    </HazardStatements>
    <PrecautionaryStatements>
${c.pStatements.map(p => `      <Statement code="${p}"/>`).join('\n')}
    </PrecautionaryStatements>
    <SignalWord>${c.signal}</SignalWord>
    <Pictograms>
${c.pictograms.map(p => `      <Pictogram code="${p}">${GHS_PICTOGRAMS[p]?.name || p}</Pictogram>`).join('\n')}
    </Pictograms>
  </Classification>
</CLPNotification>`,

  physChemEndpoint: (c) => {
    const pc = c.physChem;
    return `<?xml version="1.0" encoding="UTF-8"?>
<EndpointStudyRecord xmlns="http://iuclid6.echa.europa.eu/namespaces/ENDPOINT_STUDY_RECORD/v3.0"
  section="4" name="Physical and Chemical Properties">
  <AdministrativeData>
    <Endpoint>Physical-chemical properties</Endpoint>
    <StudyResultType>experimental study</StudyResultType>
    <Reliability>1 (reliable without restriction)</Reliability>
    <RationalReliability>GLP study, guideline compliant</RationalReliability>
  </AdministrativeData>
  <ResultsAndDiscussion>
    <MeltingPoint unit="°C">${pc.mp}</MeltingPoint>
    <BoilingPoint unit="°C">${pc.bp}</BoilingPoint>
    <Density unit="g/cm³">${pc.density}</Density>
    <VapourPressure unit="Pa" temperature="20°C">${pc.vp}</VapourPressure>
    <PartitionCoefficient type="log Kow">${pc.logP !== null ? pc.logP : 'not applicable'}</PartitionCoefficient>
    <WaterSolubility>${pc.solubility}</WaterSolubility>
    ${pc.flashPoint !== null ? `<FlashPoint unit="°C">${pc.flashPoint}</FlashPoint>` : ''}
    ${pc.autoIgnition !== null ? `<AutoIgnitionTemperature unit="°C">${pc.autoIgnition}</AutoIgnitionTemperature>` : ''}
    ${pc.ph ? `<pH>${pc.ph}</pH>` : ''}
  </ResultsAndDiscussion>
</EndpointStudyRecord>`;
  },

  csrSummary: (c) => {
    const band = TONNAGE_BANDS[c.tonnageBand];
    const dc = c.dossierCompleteness || {};
    const complete = Object.values(dc).filter(v => v === 'complete').length;
    const total = band ? band.endpoints.length : 0;
    return `<?xml version="1.0" encoding="UTF-8"?>
<ChemicalSafetyReport xmlns="http://iuclid6.echa.europa.eu/namespaces/CSR/v2.0">
  <SubstanceIdentity>
    <Name>${c.name}</Name>
    <CAS>${c.cas}</CAS>
    <EC>${c.ecNumber || ''}</EC>
    <TonnageBand>${band ? band.label : c.tonnageBand}</TonnageBand>
    <REACHRegistration>${c.reach || 'Pending'}</REACHRegistration>
  </SubstanceIdentity>
  <DossierCompleteness>
    <EndpointsRequired>${total}</EndpointsRequired>
    <EndpointsComplete>${complete}</EndpointsComplete>
    <CompletionPercentage>${total ? Math.round(complete/total*100) : 0}%</CompletionPercentage>
  </DossierCompleteness>
  <Classification>
    <HarmonisedCLP>${c.harmonisedCLP ? 'Yes — Index ' + (c.clpIndex || '') : 'Self-classification'}</HarmonisedCLP>
    <SignalWord>${c.signal}</SignalWord>
    <SVHC>${c.svhc ? 'Yes — Candidate List' : 'No'}</SVHC>
  </Classification>
  <ExposureAssessment required="${c.exposureAssessment ? 'Yes' : 'No'}">
    <!-- Exposure scenarios attached as Annex to eSDS -->
  </ExposureAssessment>
  <RiskCharacterisation>
    <!-- RCR values demonstrate safe use when OCs and RMMs are applied -->
  </RiskCharacterisation>
  <GeneratedBy>Three Worlds — Chemistry. Capital. Community.</GeneratedBy>
  <GeneratedDate>${new Date().toISOString().split('T')[0]}</GeneratedDate>
  <Disclaimer>AI-generated draft — must be reviewed by qualified regulatory professional before submission</Disclaimer>
</ChemicalSafetyReport>`;
  }
};

// ─── H2 DATA (kept from previous version) ────────────────────────────────
const H2_CATALYSTS = [
  {id:"ru-al2o3",name:"Ru/Al₂O₃",type:"Ruthenium",support:"Al₂O₃",loading:5,promoters:["K","Cs"],reaction:"NH₃ Cracking",tempRange:"400-600°C",pressure:"1-30 bar",conversion:0.92,selectivity:0.99,lifetime:15000,costPerKg:850,notes:"Industry standard for ammonia decomposition."},
  {id:"ru-ceo2",name:"Ru/CeO₂",type:"Ruthenium",support:"CeO₂",loading:3,promoters:["K"],reaction:"NH₃ Cracking",tempRange:"350-550°C",pressure:"1-20 bar",conversion:0.88,selectivity:0.99,lifetime:12000,costPerKg:720,notes:"Lower temperature activity due to CeO₂ support effect."},
  {id:"ni-al2o3",name:"Ni/Al₂O₃",type:"Nickel",support:"Al₂O₃",loading:15,promoters:["La","Ce"],reaction:"NH₃ Cracking",tempRange:"500-700°C",pressure:"1-30 bar",conversion:0.78,selectivity:0.97,lifetime:20000,costPerKg:45,notes:"Cost-effective alternative to Ru."},
  {id:"fe-k",name:"Fe-K/Al₂O₃",type:"Iron",support:"Al₂O₃",loading:20,promoters:["K","Al"],reaction:"NH₃ Cracking",tempRange:"550-750°C",pressure:"1-50 bar",conversion:0.65,selectivity:0.95,lifetime:25000,costPerKg:15,notes:"Lowest cost option."},
  {id:"ir-tio2",name:"Ir/TiO₂",type:"Iridium",support:"TiO₂",loading:2,promoters:[],reaction:"PEM Electrolysis",tempRange:"50-80°C",pressure:"1-30 bar",conversion:0.85,selectivity:0.99,lifetime:40000,costPerKg:3200,notes:"Standard PEM anode catalyst."},
  {id:"pt-c",name:"Pt/C",type:"Platinum",support:"Carbon",loading:0.5,promoters:[],reaction:"PEM Electrolysis",tempRange:"50-80°C",pressure:"1-30 bar",conversion:0.90,selectivity:0.99,lifetime:35000,costPerKg:2800,notes:"Standard PEM cathode catalyst."},
  {id:"ni-mo",name:"Ni-Mo/ZrO₂",type:"Nickel",support:"ZrO₂",loading:25,promoters:["Mo"],reaction:"Alkaline Electrolysis",tempRange:"60-90°C",pressure:"1-30 bar",conversion:0.82,selectivity:0.98,lifetime:50000,costPerKg:65,notes:"Non-PGM alkaline catalyst."},
  {id:"co-mo",name:"Co-Mo/Al₂O₃",type:"Cobalt",support:"Al₂O₃",loading:12,promoters:["Mo","K"],reaction:"NH₃ Cracking",tempRange:"500-650°C",pressure:"1-30 bar",conversion:0.72,selectivity:0.96,lifetime:18000,costPerKg:120,notes:"Emerging alternative."}
];

const EU_FUNDING_PROGRAMS = [
  {name:"EU Innovation Fund (Large Scale)",maxGrant:7500000,requirements:["GHG reduction >50%","Commercial scale","EU/EEA location","TRL 7+"],deadline:"2026-10-03"},
  {name:"EU Innovation Fund (Small Scale)",maxGrant:2500000,requirements:["GHG reduction >50%","CAPEX < €7.5M","EU/EEA location","TRL 6+"],deadline:"2026-06-15"},
  {name:"IPCEI Hydrogen",maxGrant:50000000,requirements:["Cross-border collaboration","First industrial deployment","EU member state","Significant innovation"],deadline:"Rolling"},
  {name:"Horizon Europe - Cluster 5",maxGrant:4000000,requirements:["R&D component","Consortium required","EU/Associated country","TRL 4-7"],deadline:"2026-09-18"},
  {name:"REPowerEU National Plans",maxGrant:15000000,requirements:["Aligned with national H2 strategy","EU member state","Renewable energy source","Job creation"],deadline:"Varies by country"},
  {name:"ETS Innovation Fund",maxGrant:10000000,requirements:["Innovative low-carbon tech","EU/EEA/UK location","Commercially viable","GHG avoidance"],deadline:"2026-10-03"}
];
