import { findDistrict, zoneSummary } from '../data/regions.js';
import { fetchJson } from './http.js';

const SENTINEL_TOKEN_URL = 'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';
const SENTINEL_STATS_URL = 'https://services.sentinel-hub.com/api/v1/statistics';

let tokenCache = { token: null, expiresAt: 0 };
const statsCache = new Map();

async function getSentinelToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;
  const res = await fetchJson(
    SENTINEL_TOKEN_URL,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.SENTINEL_HUB_CLIENT_ID,
        client_secret: process.env.SENTINEL_HUB_CLIENT_SECRET
      }).toString()
    },
    6000
  );
  if (!res || !res.access_token) throw new Error('sentinel-hub: no token');
  tokenCache = {
    token: res.access_token,
    expiresAt: Date.now() + (res.expires_in ? res.expires_in * 1000 : 3600000)
  };
  return tokenCache.token;
}

const SENTINEL_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "B11"],
    output: [
      { id: "NDVI", bands: 1, sampleType: "FLOAT32" },
      { id: "NDMI", bands: 1, sampleType: "FLOAT32" }
    ]
  };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11);
  return { NDVI: [ndvi], NDMI: [ndmi] };
}`;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function extractMean(intervalEntry, metric) {
  if (!intervalEntry || typeof intervalEntry !== 'object') return null;
  let node = intervalEntry[metric];
  if (!node) return null;
  const stats = node.stats && typeof node.stats === 'object' ? node.stats : node;
  if (typeof stats.mean === 'number') return stats.mean;
  const nested = Object.values(stats).find((v) => v && typeof v === 'object' && typeof v.mean === 'number');
  return nested ? nested.mean : null;
}

async function fetchSentinelStats(district, today) {
  const key = `${district.id}:${today}`;
  if (statsCache.has(key)) return statsCache.get(key);
  const token = await getSentinelToken();
  const half = 0.04;
  const from = new Date(Date.parse(today) - 30 * 86400000).toISOString().slice(0, 10);
  const input = {
    bounds: {
      bbox: {
        bbox: [district.lng - half, district.lat - half, district.lng + half, district.lat + half],
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.0/CRS84' }
      }
    },
    data: [
      {
        type: 'sentinel-2-l2a',
        dataFilter: { maxCloudCoverage: 40, mosaickingOrder: 'leastCC' }
      }
    ]
  };
  const payload = {
    input,
    aggregation: {
      timeRange: { from: `${from}T00:00:00Z`, to: `${today}T23:59:59Z` },
      aggregationInterval: { of: 'P10D' },
      aggregations: {
        ndvi: { bands: ['NDVI'], samples: 2500 },
        ndmi: { bands: ['NDMI'], samples: 2500 }
      }
    },
    processRequest: {
      input,
      evalscript: SENTINEL_EVALSCRIPT,
      output: { responses: [{ identifier: 'default', format: { type: 'application/json' } }] }
    }
  };
  const res = await fetchJson(
    SENTINEL_STATS_URL,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    },
    10000
  );
  const intervals = res && Array.isArray(res.data) ? res.data : [];
  let ndvi = null;
  let ndmi = null;
  for (let i = intervals.length - 1; i >= 0 && (ndvi === null || ndmi === null); i -= 1) {
    if (ndvi === null) ndvi = extractMean(intervals[i], 'ndvi');
    if (ndmi === null) ndmi = extractMean(intervals[i], 'ndmi');
  }
  const stats = { ndvi, ndmi };
  statsCache.set(key, stats);
  if (statsCache.size > 200) statsCache.delete(statsCache.keys().next().value);
  return stats;
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const INDEX_EXPLAIN = {
  ndvi: {
    en: 'Normalised Difference Vegetation Index. Canopy vigour from 0 (bare soil) to 1 (dense crop). Below 0.3 in a standing crop means poor vigour or thin stand.',
    hi: 'सामान्यीकृत वनस्पति सूचकांक। 0 (खेत में कुछ नहीं) से 1 (घनी फसल) तक। फसल में 0.3 से कम अर्थ है कमजोर वृद्धि या विरल पौधे।',
    kn: 'ಸಾಮಾನ್ಯೀಕೃತ ಸಸ್ಯ ಸೂಚ್ಯಂಕ. 0 (ಖಾಲಿ ಮಣ್ಣು) ದಿಂದ 1 (ದಟ್ಟ ಬೆಳೆ). ಬೆಳೆಯಲ್ಲಿ 0.3ಕ್ಕಿಂತ ಕಡಿಮೆ ಎಂದರೆ ದುರ್ಬಲ ಬೆಳವಣಿಗೆ.',
    ta: 'இயல்பாக்கப்பட்ட தாவர குறியீட்டெண். 0 (வறண்ட மண்) முதல் 1 (அடர்ந்த பயிர்). பயிரில் 0.3க்குக் கீழ் என்றால் பலவீனமான வளர்ச்சி.',
    te: 'సాధారణీకరించిన వృక్ష సూచిక. 0 (బోను నేల) నుండి 1 (దట్టమైన పంట). పంటలో 0.3 కంటే తక్కువ అంటే బలహీన పెరుగుదల.'
  },
  soilMoisture: {
    en: 'Satellite-derived surface soil moisture as a percentage of field capacity, 0–100. Below 30% means the root zone is drying and irrigation or mulching is due.',
    hi: 'सैटेलाइट से गणना की गई सतही मिट्टी की नमी, 0–100। 30% से कम का मतलब है कि जड़ क्षेत्र सूख रहा है।',
    kn: 'ಉಪಗ್ರಹದಿಂದ ಪಡೆದ ಮೇಲ್ಮೈ ಮಣ್ಣಿನ ತೇವಾಂಶ, 0–100. 30%ಕ್ಕಿಂತ ಕಡಿಮೆ ಎಂದರೆ ಬೇರು ಪ್ರದೇಶ ಒಣಗುತ್ತಿದೆ.',
    ta: 'செயற்கைக்கோள் அளவிட்ட மேற்பரப்பு மண் ஈரப்பதம், 0–100. 30%க்குக் கீழ் என்றால் வேர்ப்பகுதி காய்ந்து வருகிறது.',
    te: 'ఉపగ్రహ ఆధారిత ఉపరితల నేల తేమ, 0–100. 30% కంటే తక్కువ అంటే వేర్ల ప్రాంతం పొడిగించి ఉంది.'
  },
  surfaceTemp: {
    en: 'Land surface temperature in °C. Midday readings far above air temperature signal water stress.',
    hi: 'भूमि की सतह का तापमान (°C)। दोपहर का पढ़ाया हवा से बहुत ज़्यादा हो तो पानी के तनाव का संकेत है।',
    kn: 'ಭೂಮಿಯ ಮೇಲ್ಮೈ ತಾಪಮಾನ (°C). ಮಧ್ಯಾಹ್ನದ ಓದು ಗಾಳಿಯ ತಾಪಮಾನಕ್ಕಿಂತ ಹೆಚ್ಚಾದರೆ ನೀರಿನ ಒತ್ತಡದ ಸೂಚನೆ.',
    ta: 'நில மேற்பரப்பு வெப்பநிலை (°C). நண்பகல் அளவீடு காற்று வெப்பத்தை விட அதிகமானால் நீர் அழுத்தத்தின் அறிகுறி.',
    te: 'భూమి ఉపరితల ఉష్ణోగ్రత (°C). మధ్యాహ్నం అగాధం గాలి ఉష్ణోగ్రతకు అతిగా ఉంటే నీటి ఒత్తిడి సూచన.'
  }
};

const ADVICE = {
  ndvi: {
    en: {
      good: 'Canopy is dense and active. Keep the current nutrition schedule and scout for pests in the upper canopy.',
      medium: 'Canopy is patchy. Check for nitrogen deficiency and re-check plant population; a light top dressing of urea usually helps.',
      poor: 'Canopy vigour is low. Verify sowing density, check for pest or disease damage, and correct any waterlogging first.'
    },
    level(v) { return v >= 0.45 ? 'good' : v >= 0.3 ? 'medium' : 'poor'; }
  },
  soilMoisture: {
    en: {
      good: 'Profile is well supplied with water. No irrigation needed this week; watch drainage in low spots.',
      medium: 'Moisture is marginal. Plan one irrigation within 3–4 days and mulch between rows to slow the loss.',
      poor: 'Root zone is dry. Irrigate at first light tomorrow and add mulch; avoid fertiliser until moisture recovers.'
    },
    level(v) { return v >= 55 ? 'good' : v >= 32 ? 'medium' : 'poor'; }
  },
  surfaceTemp: {
    en: {
      good: 'Surface temperature is normal for the season.',
      medium: 'Surface is running warm. Mulch or intercrop will cut soil heat in the afternoons.',
      poor: 'Surface is very hot. Water stress is likely; irrigate and shade seedlings immediately.'
    },
    level(v) { return v <= 32 ? 'good' : v <= 38 ? 'medium' : 'poor'; }
  }
};

export async function getSoilSatellite(regionId, districtId, lang = 'en') {
  const district = findDistrict(regionId, districtId);
  if (!district) return null;
  const zone = zoneSummary(district);
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashSeed(`${district.id}:${today}`);
  const r1 = rand(seed % 733);
  const r2 = rand(seed % 911);
  const r3 = rand(seed % 517);

  const indices = {
    ndvi: Math.round((0.28 + r1 * 0.5) * 1000) / 1000,
    soilMoisture: Math.round((28 + r2 * 45)),
    surfaceTemp: Math.round(24 + r3 * 18)
  };

  let live = null;
  try {
    if (process.env.SENTINEL_HUB_CLIENT_ID && process.env.SENTINEL_HUB_CLIENT_SECRET) {
      live = await fetchSentinelStats(district, today);
    }
  } catch (err) {
    live = null;
  }

  if (live) {
    if (typeof live.ndvi === 'number') {
      indices.ndvi = Math.round(clamp(live.ndvi, -0.2, 0.95) * 1000) / 1000;
    }
    if (typeof live.ndmi === 'number') {
      indices.soilMoisture = Math.round(clamp(50 + live.ndmi * 60, 5, 95));
    }
    indices.surfaceTemp = Math.round(clamp(34 - (indices.soilMoisture - 50) * 0.14, 18, 44));
  }

  const explanation = Object.keys(INDEX_EXPLAIN).map((key) => {
    const level = ADVICE[key].level(indices[key]);
    return {
      key,
      label: {
        ndvi: 'NDVI (vegetation)',
        soilMoisture: 'Soil moisture index',
        surfaceTemp: 'Land surface temperature'
      }[key],
      value: indices[key],
      unit: key === 'ndvi' ? 'index 0–1' : key === 'soilMoisture' ? '% of capacity' : '°C',
      meaning: (INDEX_EXPLAIN[key][lang] && INDEX_EXPLAIN[key][lang]) || INDEX_EXPLAIN[key].en,
      meaningLang: INDEX_EXPLAIN[key][lang] ? lang : 'en',
      advice: (ADVICE[key].en[lang] && ADVICE[key].en[lang]) || ADVICE[key].en[level] || ADVICE[key].en.en,
      level
    };
  });

  const source = live ? 'live' : 'simulated';

  return {
    district: { id: district.id, name: district.name, lat: district.lat, lng: district.lng },
    zone: zone && zone.zone,
    date: today,
    indices,
    explanation,
    source,
    note: live === null
      ? 'Seeded district-level simulation with district hand guidance. Connect Sentinel Hub credentials for live 10 m imagery.'
      : 'NDVI and soil moisture derived from Sentinel Hub (Sentinel-2 L2A, latest low-cloud pass over this district); surface temperature is estimated from the live moisture signal.'
  };
}
