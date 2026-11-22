const CROPS = [
  {
    id: 'ragi',
    name: 'Finger millet (Ragi)',
    season: ['kharif'],
    water: 'low',
    durationDays: 110,
    baseScore: 65,
    soilFit: ['red', 'gravelly', 'medium black'],
    yieldHint: '18–25 q/ha under rainfed conditions',
    notes: 'Hardy cereal for dry zones; strong demand for ragi flour in city markets.'
  },
  {
    id: 'jowar',
    name: 'Sorghum (Jowar)',
    season: ['rabi'],
    water: 'low',
    durationDays: 115,
    baseScore: 62,
    soilFit: ['black', 'medium black', 'shallow black'],
    yieldHint: '25–35 q/ha grain in rabi',
    notes: 'Reliable rabi cereal on black soils with residual moisture.'
  },
  {
    id: 'paddy',
    name: 'Paddy (Sona Masuri)',
    season: ['kharif'],
    water: 'high',
    durationDays: 135,
    baseScore: 60,
    soilFit: ['alluvial', 'clay loam'],
    yieldHint: '45–60 q/ha under canal or borewell irrigation',
    notes: 'Prefer canal-irrigated blocks; not suitable where borewell yield is weak.'
  },
  {
    id: 'maize',
    name: 'Maize (hybrid)',
    season: ['kharif', 'rabi'],
    water: 'medium',
    durationDays: 100,
    baseScore: 68,
    soilFit: ['red', 'black', 'medium black'],
    yieldHint: '55–75 q/ha with hybrid seed',
    notes: 'Feed and starch industry demand keeps prices firm; watch fall armyworm.'
  },
  {
    id: 'cotton',
    name: 'Cotton (Bt hybrid)',
    season: ['kharif'],
    water: 'medium',
    durationDays: 180,
    baseScore: 63,
    soilFit: ['black', 'deep black', 'medium black'],
    yieldHint: '20–28 q/ha seed cotton',
    notes: 'Long duration; needs pink bollworm discipline and timely protection.'
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    season: ['kharif', 'summer'],
    water: 'low',
    durationDays: 110,
    baseScore: 61,
    soilFit: ['red', 'sandy loam', 'gravelly'],
    yieldHint: '18–24 q/ha pods rainfed',
    notes: 'Good fit for drought-prone dry zones; peg formation needs light soils.'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    season: ['rabi', 'summer'],
    water: 'low',
    durationDays: 95,
    baseScore: 57,
    soilFit: ['black', 'red', 'medium black'],
    yieldHint: '12–18 q/ha',
    notes: 'Short duration oilseed that escapes late-season moisture stress.'
  },
  {
    id: 'pigeonpea',
    name: 'Pigeonpea (Tur Dal)',
    season: ['kharif'],
    water: 'low',
    durationDays: 160,
    baseScore: 59,
    soilFit: ['black', 'medium black', 'red'],
    yieldHint: '10–14 q/ha',
    notes: 'Fixes nitrogen and holds strong minimum-support-price demand.'
  },
  {
    id: 'tomato',
    name: 'Tomato (Arka series)',
    season: ['rabi', 'summer'],
    water: 'medium',
    durationDays: 120,
    baseScore: 55,
    soilFit: ['red', 'sandy loam', 'loam'],
    yieldHint: '35–45 t/ha under drip',
    notes: 'High value but volatile price swings; needs assured drip water.'
  },
  {
    id: 'onion',
    name: 'Onion (Bellary red)',
    season: ['rabi'],
    water: 'medium',
    durationDays: 110,
    baseScore: 58,
    soilFit: ['red', 'black', 'loam'],
    yieldHint: '25–32 t/ha',
    notes: 'Storage lets you time the market; avoid in high-rainfall zones.'
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    season: ['kharif'],
    water: 'high',
    durationDays: 330,
    baseScore: 54,
    soilFit: ['black', 'deep black', 'alluvial'],
    yieldHint: '90–120 t/ha with factory tie-up',
    notes: 'Only where canal water or a strong borewell is assured for 12 months.'
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Chana)',
    season: ['rabi'],
    water: 'low',
    durationDays: 100,
    baseScore: 60,
    soilFit: ['black', 'medium black', 'loam'],
    yieldHint: '12–18 q/ha on residual moisture',
    notes: 'Best rabi pulse on conserved moisture; protein demand keeps prices up.'
  },
  {
    id: 'coconut',
    name: 'Coconut',
    season: ['all'],
    water: 'high',
    durationDays: 365,
    baseScore: 52,
    soilFit: ['laterite', 'red', 'coastal alluvium'],
    yieldHint: '90–120 nuts per palm per year',
    notes: 'Perennial fit for coastal and hilly zones with reliable rainfall.'
  },
  {
    id: 'cashew',
    name: 'Cashew',
    season: ['all'],
    water: 'low',
    durationDays: 365,
    baseScore: 50,
    soilFit: ['laterite', 'gravelly', 'coastal alluvium'],
    yieldHint: '8–12 q/ha nuts at maturity',
    notes: 'Perennial fit for laterite uplands and hill slopes; slow to first yield.'
  }
];

const GRADE_SIGNALS = {
  ragi: 'Steady; annual Fair-Price-Shop procurement supports the floor.',
  jowar: 'Flat; feed demand rises in summer.',
  paddy: 'MSP-led; miller demand strong after January.',
  maize: 'Firm; poultry feed demand rising.',
  cotton: 'Volatile; track kapas arrivals daily.',
  groundnut: 'Firm on oilseed demand stocks.',
  sunflower: 'Softening; large edible-oil imports.',
  pigeonpea: 'Strong; import gap keeps dal prices high.',
  tomato: 'Volatile; swings of ₹15/kg within a fortnight are common.',
  onion: 'Volatile; storage timing decides the margin.',
  sugarcane: 'Contracted to mills; FRP fixed annually.',
  chickpea: 'Firm; festive demand in Q4.',
  coconut: 'Steady; copra procurement window offered quarterly.',
  cashew: 'Firm; export grading demand.'
};

const WATER_RANK = { low: 1, medium: 2, high: 3 };

export function recommendCrops({ regionId, districtId, zone, season, water, lang = 'en' }) {
  const waterCap = WATER_RANK[water] || 2;
  const seasonId = season || 'kharif';
  const scored = CROPS.filter((c) => c.season.includes(seasonId) || c.season.includes('all'))
    .map((c) => {
      let score = c.baseScore;
      const waterOk = WATER_RANK[c.water] <= waterCap;
      if (waterOk) score += 14; else score -= 26;
      if (zone && c.soilFit.some((s) => zone.toLowerCase().includes(s.split(' ')[0]))) score += 8;
      const rationale = [];
      rationale.push({
        key: 'water',
        label: 'Water need',
        text: waterOk
          ? `Needs ${c.water} water — within your ${water} availability`
          : `Needs ${c.water} water — exceeds your ${water} availability`
      });
      rationale.push({ key: 'soil', label: 'Soil fit', text: `Suits ${c.soilFit.join(', ')} soils` });
      rationale.push({ key: 'duration', label: 'Duration', text: `About ${c.durationDays} days to harvest` });
      rationale.push({ key: 'market', label: 'Market signal', text: GRADE_SIGNALS[c.id] });
      return {
        id: c.id,
        name: c.name,
        season: c.season,
        waterNeed: c.water,
        durationDays: c.durationDays,
        yieldHint: c.yieldHint,
        notes: c.notes,
        score: Math.round(score),
        waterOk,
        rationale
      };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  return {
    query: { regionId, districtId, zone, season: seasonId, water: water || 'medium', lang },
    zone: zone || null,
    summary: top.length
      ? `${top[0].name} is the leading option for ${seasonId} in this zone given ${water || 'medium'} water availability, with ${top[1] ? top[1].name : 'no alternative'} as a hedge.`
      : 'No strong match for this combination; try increasing water availability or changing season.',
    recommendations: scored.slice(0, 8),
    top: top.map((t) => t.id)
  };
}

export function listCrops() {
  return CROPS.map(({ id, name, season, water, durationDays }) => ({ id, name, season, water, durationDays }));
}
