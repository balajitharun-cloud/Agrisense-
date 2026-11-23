export const ANNOUNCEMENTS = [
  {
    id: 'g1',
    title: 'PM-KISAN 17th instalment release schedule announced',
    body: 'Eligible landholding farmer families will receive the 17th instalment of ₹2,000 under PM-KISAN as per the release calendar issued by the Ministry of Agriculture. Ensure Aadhaar-linked bank details are current.',
    level: 'central',
    region: null,
    district: null,
    category: 'scheme',
    daysAgo: 15,
    url: 'https://pmkisan.gov.in',
    source: 'Ministry of Agriculture & Farmers Welfare'
  },
  {
    id: 'g2',
    title: 'Rabi sowing window extended for ragi in southern dry zone',
    body: 'With residual soil moisture holding above critical levels, the sowing window for ragi has been extended by 10 days in Bengaluru Rural and Kolar. Use certified seed and compensate plant population where germination failed.',
    level: 'state',
    region: 'ka',
    district: null,
    category: 'advisory',
    daysAgo: 3,
    url: 'https://raitamitra.karnataka.gov.in',
    source: 'Dept. of Agriculture, Government of Karnataka'
  },
  {
    id: 'g3',
    title: 'Pink bollworm warning — compulsory pheromone trap installation',
    body: 'Cotton growers in Dharwad and Haveri must install a minimum of 5 pheromone traps per hectare and report weekly catches to the village level worker. Trap monitors are available free of cost at Raitha Samparka Kendras.',
    level: 'district',
    region: 'ka',
    district: 'ka-dharwad',
    category: 'advisory',
    daysAgo: 24,
    url: 'https://raitamitra.karnataka.gov.in',
    source: 'Joint Director of Agriculture, Dharwad'
  },
  {
    id: 'g4',
    title: 'Soil Health Cards second-cycle distribution begins',
    body: 'Second-cycle Soil Health Cards with 12-parameter analysis are being distributed through Raitha Samparka Kendras. Carry your Aadhaar and land record (RTC/Pahani) to collect the card.',
    level: 'state',
    region: 'ka',
    district: null,
    category: 'scheme',
    daysAgo: 8,
    url: 'https://soilhealth.dac.gov.in',
    source: 'Dept. of Agriculture, Government of Karnataka'
  },
  {
    id: 'g5',
    title: 'Minimum Support Prices for rabi marketing season notified',
    body: 'Cabinet Committee on Economic Affairs has approved MSPs for the coming rabi marketing season. Wheat MSP is revised upward again; collect procurement-centre details from your district FCI office.',
    level: 'central',
    region: null,
    district: null,
    category: 'price',
    daysAgo: 18,
    url: 'https://agrimahiti.karnataka.gov.in',
    source: 'CCEA / Ministry of Finance'
  },
  {
    id: 'g6',
    title: 'Mysuru: canal water release schedule for sugar cane blocks',
    body: 'Water Resources Department will release water to Mysuru and Mandya cane blocks in the notified rotation. Fields not in the rotation must not draw water; violations attract penalties.',
    level: 'district',
    region: 'ka',
    district: 'ka-mysuru',
    category: 'advisory',
    daysAgo: 2,
    url: 'https://raitamitra.karnataka.gov.in',
    source: 'Cauvery Neeravari Nigam / District Administration'
  },
  {
    id: 'g7',
    title: 'Free crop insurance enrolment under PMFBY until 31 October',
    body: 'Enrolment for Pradhan Mantri Fasal Bima Yojana closes on 31 October for the notified kharif crops. Enrol through your bank, CSC, or the PMFBY portal; a nominal premium share applies.',
    level: 'central',
    region: null,
    district: null,
    category: 'insurance',
    daysAgo: 5,
    url: 'https://nfsm.gov.in',
    source: 'Ministry of Agriculture (PMFBY)'
  },
  {
    id: 'g8',
    title: 'Belagavi: tomato leaf-miner and blight alert after unseasonal rain',
    body: 'Recent unseasonal showers have raised humidity. Tomato growers should scout for leaf-miner mines and early blight lesions weekly and remove affected leaves. Spray only from the CIB&RC-approved list.',
    level: 'district',
    region: 'ka',
    district: 'ka-belagavi',
    category: 'advisory',
    daysAgo: 0,
    url: 'https://pmkisan.gov.in',
    source: 'Dept. of Horticulture, Belagavi'
  },
  {
    id: 'g9',
    title: 'Interest subvention scheme for crop loans extended',
    body: 'Short-term crop loans up to ₹3 lakh at effective 4% interest (with prompt repayment subvention) continue this year. Distinguish between interest subvention and the KCC (Kisan Credit Card) facility.',
    level: 'central',
    region: null,
    district: null,
    category: 'finance',
    daysAgo: 12,
    url: 'https://raitamitra.karnataka.gov.in',
    source: 'Dept. of Financial Services'
  },
  {
    id: 'g10',
    title: 'Chitradurga: sunflower and jowar — mid-season drought contingency plan',
    body: 'In deficient rainfall pockets, take up protective irrigation on alternate furrows and thin plant population instead of complete crop failure. Fodder options for thinning include bajra napier and sorghum.',
    level: 'district',
    region: 'ka',
    district: 'ka-chitradurga',
    category: 'advisory',
    daysAgo: 1,
    url: 'https://agrimahiti.karnataka.gov.in',
    source: 'District Agriculture Officer, Chitradurga'
  }
];

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

function withDates(list) {
  return list.map((a) => ({ ...a, date: isoDaysAgo(a.daysAgo) }));
}

export function listAnnouncements({ region, category, level } = {}) {
  let out = withDates(ANNOUNCEMENTS);
  if (region && region !== 'all') out = out.filter((a) => a.region === null || a.region === region);
  if (category && category !== 'all') out = out.filter((a) => a.category === category);
  if (level && level !== 'all') out = out.filter((a) => a.level === level);
  return [...out].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function latestAnnouncement(region) {
  const list = listAnnouncements({ region });
  return list[0] || null;
}
