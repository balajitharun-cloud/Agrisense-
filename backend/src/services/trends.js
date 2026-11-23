import { KA_ZONE_TOP_CROPS, listKaZones } from '../data/zonecrops.js';
import { ZONE_DESCRIPTIONS } from '../data/regions.js';

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

function round(v, d = 1) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

const CYCLE = new Date().getFullYear();

export function zoneCropsTrend({ regionId = 'ka', zone, season = 'kharif', lang = 'en' } = {}) {
  void lang; void regionId;
  if (!zone || !KA_ZONE_TOP_CROPS[zone]) {
    if (zone) return null;
    return { region: 'ka', zones: listKaZones(), descriptions: buildZoneDescriptions(), source: 'mock' };
  }

  const entries = KA_ZONE_TOP_CROPS[zone];
  const crops = entries.map((entry, rank) => {
    const history = [];
    const pastNoise = [0.8, 1.1, 0.7, 1.3, 0.9, 1.0].map((f, i) => f * rand(hashSeed(`${zone}:${entry.id}:${i}`)));
    const drift = (rand(hashSeed(`${zone}:${entry.id}:drift`)) * 22) - 8;
    for (let i = 0; i < 6; i += 1) {
      const year = CYCLE - 6 + i;
      const value = round(88 + drift * i + pastNoise[i] * 14, 1);
      history.push({ year, productionIndex: value });
    }

    const last = history[history.length - 1].productionIndex;
    const first = history[0].productionIndex;
    const slope = round(((last - first) / first) * 100, 1);

    const r2 = rand(hashSeed(`${zone}:${entry.id}:price:${CYCLE}`));
    const month = new Date().getMonth();
    const seasonal = ['kharif', 'rabi', 'summer'].includes(season)
      ? entry.season.includes(season) ? 1 : 0
      : 0.5;
    const priceIndex = round(90 + r2 * 26 + seasonal * 6, 0);
    const yieldSignal = round(96 + rand(hashSeed(`${zone}:${entry.id}:y:${CYCLE}`)) * 12, 0);

    const projection = [];
    const futureBase = last;
    const projDrift = slope / 100;
    for (let i = 1; i <= 3; i += 1) {
      const year = CYCLE + i - 1;
      const value = round(futureBase * (1 + projDrift * 0.6 * i), 1);
      projection.push({ year, productionIndex: value });
    }

    const verdictRaw = slope * 0.6 + (priceIndex - 100) * 0.25 + (yieldSignal - 100) * 0.25;
    const verdict = verdictRaw > 6 ? 'rising' : verdictRaw > -4 ? 'stable' : 'watch';
    const details = buildRationale({ entry, slope, priceIndex, yieldSignal, verdict, season });

    return {
      id: entry.id,
      name: entry.name,
      rank: rank + 1,
      areaShare: entry.areaShare,
      waterNeed: entry.waterNeed,
      durationDays: entry.durationDays,
      season: entry.season,
      note: entry.note,
      history,
      currentYear: CYCLE - 1,
      current: { priceIndex, yieldSignal, historyLast: last },
      forecast: projection,
      slopePct: slope,
      verdict,
      verdictReason: details.verdictReason,
      outlook: details.outlook
    };
  });

  return {
    region: 'ka',
    zone,
    description: ZONE_DESCRIPTIONS[zone] || '',
    season,
    seasonWindow: season === 'kharif'
      ? 'Jun–Oct (SW monsoon)'
      : season === 'rabi'
        ? 'Oct–Feb (residual moisture)'
        : 'Feb–May (summer irrigation)',
    crops,
    source: 'mock'
  };
}

function buildZoneDescriptions() {
  return Object.fromEntries(Object.entries(ZONE_DESCRIPTIONS).map(([z, d]) => [z, d]));
}

function buildRationale({ entry, slope, priceIndex, yieldSignal, verdict, season }) {
  const inSeason = entry.season.includes(season) || entry.season.includes('all');
  const past = slope > 8
    ? `Area and output have grown steadily over the last six seasons (+${slope}% index).`
    : slope > -2
      ? `Output has stayed broadly stable over six seasons (${slope >= 0 ? '+' : ''}${slope}% index).`
      : `Output has drifted down over six seasons (${slope}% index) — older plantings and weather swings.`;
  const current = `This season's price index sits at ${priceIndex} (2019 = 100) with yield signal ${yieldSignal}`;
  const cur2 = inSeason ? ` and ${entry.name} is in its main window.` : `; it is outside the main ${season} window, so plan as a follow-on crop if at all.`;
  const future = verdict === 'rising'
    ? `Projection: the next three seasons trend upward — expanding area is justified if irrigation and market linkage hold.`
    : verdict === 'stable'
      ? `Projection: the next three seasons hold near current levels — keep it in rotation for stability, don't expand on credit.`
      : `Projection: the next three seasons soften — treat as a maintenance crop, watch input costs and lock prices early.`;
  return { verdictReason: `${past} ${current}${cur2}`, outlook: future };
}
