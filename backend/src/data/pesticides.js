export const PESTS = [
  {
    id: 'fall-armyworm',
    name: 'Fall Armyworm',
    localName: { kn: 'ಬೀಳು ಸೈನಿಕ ಹುಳು', hi: 'फॉल आर्मीवर्म' },
    crops: ['maize', 'sorghum', 'ragi'],
    severity: 'high',
    stage: 'Whorl and early vegetative',
    symptoms: 'Irregular window-pane feeding on leaves and moist sawdust-like frass inside the whorl; plants look ragged within days of moth flights.'
  },
  {
    id: 'pink-bollworm',
    name: 'Pink Bollworm',
    localName: { kn: 'ಗುಲಾಬಿ ಹುಳು', hi: 'गुलाबी बॉलवर्म' },
    crops: ['cotton'],
    severity: 'high',
    stage: 'Squaring to boll formation',
    symptoms: 'Rosetted flowers, interlocule feeding with stained lint, exit holes in green bolls; larvae pink with dark head.'
  },
  {
    id: 'brown-planthopper',
    name: 'Brown Planthopper',
    localName: { kn: 'ಕಂದು ಜೀರುಂಡೆ', hi: 'भूरी पाथोफ़ीडिया' },
    crops: ['paddy'],
    severity: 'high',
    stage: 'Tillering to grain filling',
    symptoms: 'Hopper burn — circular patches of yellowing then drying plants; honeydew and sooty mould at the base of clumps.'
  },
  {
    id: 'rice-stem-borer',
    name: 'Yellow Stem Borer',
    localName: { kn: 'ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು', hi: 'पीला तना छेदक' },
    crops: ['paddy'],
    severity: 'medium',
    stage: 'Tillering and panicle initiation',
    symptoms: 'Dead hearts in young tillers, white ear-heads later; hollow stems with a single exit hole when pulled apart.'
  },
  {
    id: 'aphids',
    name: 'Aphids',
    localName: { kn: 'ಮೋಸಿಕೆ ಹೇನು', hi: 'माहू (चेपा कीट)' },
    crops: ['chickpea', 'tomato', 'groundnut', 'onion'],
    severity: 'medium',
    stage: 'Vegetative and flowering',
    symptoms: 'Clusters on shoots and flower buds; sticky honeydew, curled leaves, stunted heads and ants moving on the plant.'
  },
  {
    id: 'whitefly',
    name: 'Whitefly',
    localName: { kn: 'ಬಿಳಿ ನೊಣ', hi: 'सफ़ेद मक्खी' },
    crops: ['tomato', 'cotton', 'pigeonpea'],
    severity: 'high',
    stage: 'All vegetative stages',
    symptoms: 'Tiny white insects streaking off when the plant is disturbed; yellowing leaves and yellow-mosaic virus spread by nymphs.'
  },
  {
    id: 'fruit-fly',
    name: 'Fruit Fly (melon fly)',
    localName: { kn: 'ಹಣ್ಣಿನ ಈಗ', hi: 'फल मक्खी' },
    crops: ['tomato', 'onion', 'coconut', 'cashew', 'maize'],
    severity: 'medium',
    stage: 'Fruiting to harvest',
    symptoms: 'Oviposition punctures and soft, sunken spots on young fruit; fruit drops prematurely or rots from inside.'
  },
  {
    id: 'red-spider-mite',
    name: 'Red Spider Mite',
    localName: { kn: 'ಕೆಂಪು ಜೇಡ ಹುಳು', hi: 'लाल मकड़ी घुन' },
    crops: ['tomato', 'groundnut', 'cotton', 'chickpea'],
    severity: 'medium',
    stage: 'Dry, hot weather — vegetative',
    symptoms: 'Fine webbing on leaf undersides, bronze speckling then bronzed leaves; mites visible as moving red dust.'
  }
];

export const PESTICIDES = [
  {
    id: 'emamectin-benzoate-5sg',
    product: 'Emamectin Benzoate 5% SG',
    formula: 'C₅₆H₈₁NO₁₆ (benzoate salt)',
    formulation: 'Water-dispersible granule',
    dosePerAcre: '80–100 g in 200 L water',
    phi: 14,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['fall-armyworm', 'rice-stem-borer', 'pink-bollworm'],
    safety: 'Wear gloves, mask and full sleeves. Highly toxic to fish and bees — do not spray near water bodies or during bloom. Do not exceed two applications per season.'
  },
  {
    id: 'imidacloprid-178sl',
    product: 'Imidacloprid 17.8% SL',
    formula: 'C₉H₁₀ClN₅O₂',
    formulation: 'Soluble liquid concentrate',
    dosePerAcre: '60–120 ml in 200 L water',
    phi: 10,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['brown-planthopper', 'whitefly', 'aphids'],
    safety: 'Harmful to bees when wet spray contacts bloom — spray in the evening. Alternate with non-neonicotinoids to manage resistance.'
  },
  {
    id: 'chlorantraniliprole-185sc',
    product: 'Chlorantraniliprole 18.5% SC',
    formula: 'C₁₈H₁₄BrCl₂N₅O₂',
    formulation: 'Suspension concentrate',
    dosePerAcre: '60–80 ml in 200 L water',
    phi: 3,
    toxicityClass: 'Low hazard (Class U)',
    controls: ['pink-bollworm', 'rice-stem-borer', 'fall-armyworm'],
    safety: 'Safer for beneficial insects; still avoid spraying during active bee foraging. Observe the 3-day pre-harvest interval strictly.'
  },
  {
    id: 'profenofos-50ec',
    product: 'Profenofos 50% EC',
    formula: 'C₁₁H₁₅BrClO₃PS',
    formulation: 'Emulsifiable concentrate',
    dosePerAcre: '400–500 ml in 200 L water',
    phi: 14,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['brown-planthopper', 'aphids', 'whitefly', 'red-spider-mite'],
    safety: 'Organophosphate — never mix with other cholinesterase inhibitors. Keep at least 14 days between last spray and harvest.'
  },
  {
    id: 'acetamiprid-20sp',
    product: 'Acetamiprid 20% SP',
    formula: 'C₁₀H₁₁ClN₄',
    formulation: 'Soluble powder',
    dosePerAcre: '50–60 g in 200 L water',
    phi: 7,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['whitefly', 'aphids'],
    safety: 'Rotations: do not repeat within 15 days. Cover the leaf underside where whitefly nymphs sit.'
  },
  {
    id: 'carbendazim-50wp',
    product: 'Carbendazim 50% WP',
    formula: 'C₉H₉N₃O₂',
    formulation: 'Wettable powder',
    dosePerAcre: '200 g in 200 L water',
    phi: 15,
    toxicityClass: 'Low hazard (Class U)',
    controls: [],
    useType: 'Fungicide',
    safety: 'Systemic fungicide for wilt, blight and powdery mildew. Do not use more than three times a season on the same crop.'
  },
  {
    id: 'mancozeb-75wp',
    product: 'Mancozeb 75% WP',
    formula: 'C₄H₆MnN₂S₄·Zn',
    formulation: 'Wettable powder',
    dosePerAcre: '600–800 g in 200 L water',
    phi: 7,
    toxicityClass: 'Low hazard (Class U)',
    controls: [],
    useType: 'Fungicide',
    safety: 'Contact protectant — spray before infection events for best results. Avoid inhaling dust while mixing.'
  },
  {
    id: 'azadirachtin-1ec',
    product: 'Azadirachtin 1% EC (Neem)',
    formula: 'C₃₅H₄₄O₁₆',
    formulation: 'Emulsifiable concentrate',
    dosePerAcre: '500 ml in 200 L water',
    phi: 5,
    toxicityClass: 'Low hazard (Class III)',
    controls: ['fall-armyworm', 'aphids', 'whitefly', 'fruit-fly'],
    safety: 'Organic-friendly option; spray in the late evening to avoid UV breakdown. Compatible with biocontrol agents.'
  },
  {
    id: 'lambdacyhalothrin-5ec',
    product: 'Lambda-cyhalothrin 5% EC',
    formula: 'C₂₃H₁₉ClF₃NO₃',
    formulation: 'Emulsifiable concentrate',
    dosePerAcre: '80–100 ml in 200 L water',
    phi: 7,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['pink-bollworm', 'rice-stem-borer', 'aphids', 'fruit-fly'],
    safety: 'Very toxic to aquatic life — keep 15 m from ponds and streams. Use at most twice per crop cycle.'
  },
  {
    id: 'sulfoxaflor-240sc',
    product: 'Sulfoxaflor 24% SC',
    formula: 'C₁₀H₉F₃N₂OS',
    formulation: 'Suspension concentrate',
    dosePerAcre: '60–80 ml in 200 L water',
    phi: 7,
    toxicityClass: 'Moderately hazardous (Class II)',
    controls: ['brown-planthopper', 'whitefly'],
    safety: 'Check local label registration for your crop before use; bee-toxic — avoid daytime bloom sprays.'
  }
];

export function listPests(lang = 'en') {
  return PESTS.map((p) => ({
    id: p.id,
    name: p.name,
    localName: (p.localName && p.localName[lang]) || p.localName.en,
    crops: p.crops,
    severity: p.severity,
    stage: p.stage,
    symptoms: p.symptoms
  }));
}

export function listPesticides({ pestId, cropId } = {}) {
  let out = PESTICIDES;
  if (pestId) out = out.filter((p) => p.controls.includes(pestId));
  if (cropId) {
    const cropsSet = new Set([cropId]);
    out = out.filter((p) => {
      if (p.useType === 'Fungicide') return true;
      return p.controls.length > 0 && p.controls.some((c) => {
        const pest = PESTS.find((x) => x.id === c);
        return pest && pest.crops.some((c) => cropsSet.has(c));
      });
    });
  }
  return out.map(({ controls, ...rest }) => ({ ...rest, controlsCount: controls.length }));
}

export function findPesticide(id) {
  return PESTICIDES.find((p) => p.id === id) || null;
}

export function findPest(id) {
  return PESTS.find((p) => p.id === id) || null;
}
