const NODES = [
  {
    id: 'node-block-a-ragi',
    name: 'Block A – Ragi',
    crop: 'Finger millet (Ragi)',
    regionId: 'ka',
    districtId: 'ka-bengaluru-rural',
    status: 'online',
    installed: '2024-06-14',
    gateway: 'LoRa GW-01',
    thresholds: {
      temperature: { min: 18, max: 34, unit: '°C' },
      humidity: { min: 40, max: 85, unit: '%' },
      soilMoisture: { min: 25, max: 65, unit: '%' },
      soilN: { min: 180, max: 320, unit: 'kg/ha' },
      soilP: { min: 14, max: 45, unit: 'kg/ha' },
      soilK: { min: 120, max: 280, unit: 'kg/ha' }
    }
  },
  {
    id: 'node-b-paddy-mandya',
    name: 'Block B – Paddy Lowland',
    crop: 'Paddy (Sona Masuri)',
    regionId: 'ka',
    districtId: 'ka-mandya',
    status: 'online',
    installed: '2024-07-02',
    gateway: 'LoRa GW-02',
    thresholds: {
      temperature: { min: 20, max: 35, unit: '°C' },
      humidity: { min: 55, max: 95, unit: '%' },
      soilMoisture: { min: 45, max: 85, unit: '%' },
      soilN: { min: 200, max: 380, unit: 'kg/ha' },
      soilP: { min: 16, max: 50, unit: 'kg/ha' },
      soilK: { min: 140, max: 300, unit: 'kg/ha' }
    }
  },
  {
    id: 'node-c-cotton',
    name: 'Block C – Cotton Field',
    crop: 'Cotton (Bt hybrid)',
    regionId: 'ka',
    districtId: 'ka-dharwad',
    status: 'degraded',
    installed: '2023-11-20',
    gateway: 'LoRa GW-03',
    thresholds: {
      temperature: { min: 20, max: 36, unit: '°C' },
      humidity: { min: 40, max: 85, unit: '%' },
      soilMoisture: { min: 30, max: 70, unit: '%' },
      soilN: { min: 180, max: 340, unit: 'kg/ha' },
      soilP: { min: 14, max: 45, unit: 'kg/ha' },
      soilK: { min: 140, max: 300, unit: 'kg/ha' }
    }
  },
  {
    id: 'node-d-groundnut',
    name: 'Block D – Groundnut',
    crop: 'Groundnut (TMV-2)',
    regionId: 'ka',
    districtId: 'ka-chitradurga',
    status: 'online',
    installed: '2024-08-08',
    gateway: 'LoRa GW-04',
    thresholds: {
      temperature: { min: 21, max: 35, unit: '°C' },
      humidity: { min: 35, max: 80, unit: '%' },
      soilMoisture: { min: 22, max: 58, unit: '%' },
      soilN: { min: 150, max: 300, unit: 'kg/ha' },
      soilP: { min: 12, max: 40, unit: 'kg/ha' },
      soilK: { min: 110, max: 260, unit: 'kg/ha' }
    }
  },
  {
    id: 'node-e-tomato',
    name: 'Block E – Tomato Drip',
    crop: 'Tomato (Arka Rakshak)',
    regionId: 'ka',
    districtId: 'ka-kolar',
    status: 'offline',
    installed: '2024-09-01',
    gateway: 'LoRa GW-05',
    thresholds: {
      temperature: { min: 18, max: 32, unit: '°C' },
      humidity: { min: 45, max: 85, unit: '%' },
      soilMoisture: { min: 35, max: 70, unit: '%' },
      soilN: { min: 200, max: 360, unit: 'kg/ha' },
      soilP: { min: 18, max: 52, unit: 'kg/ha' },
      soilK: { min: 150, max: 320, unit: 'kg/ha' }
    }
  }
];

export function listNodes() {
  return NODES.map(({ thresholds, ...rest }) => ({
    ...rest,
    batteryPct: batteryPct(rest.id, rest.status),
    thresholdCount: Object.keys(thresholds).length
  }));
}

export function findNode(nodeId) {
  return NODES.find((n) => n.id === nodeId) || null;
}

export function defaultNode() {
  return NODES.find((n) => n.status === 'online') || NODES[0];
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

function batteryPct(id, status) {
  const seed = hashSeed(id);
  if (status === 'offline') return rand(seed) * 8;
  const base = 55 + rand(seed % 977) * 44;
  return status === 'degraded' ? Math.max(12, base * 0.6) : Math.min(100, base);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function rainBoost(nodeId, dayIndex) {
  const seed = hashSeed(`${nodeId}:${dayIndex % 1000}`);
  const draw = rand(seed % 733);
  if (draw > 0.86) return 14 + rand(seed % 517) * 16;
  if (draw > 0.72) return 6 + rand(seed % 911) * 8;
  return 0;
}

export function readingAt(nodeId, atMs, node) {
  const n = node || findNode(nodeId);
  if (!n) return null;
  const seed = hashSeed(n.id);
  const d = new Date(atMs);
  const h = d.getHours() + d.getMinutes() / 60;
  const dayIndex = Math.floor(atMs / 86400000);
  const phase = ((h - 15 + 6) / 24) * Math.PI * 2;
  const diurnal = Math.sin(phase);

  const tempBase = 21 + rand(seed % 101) * 6;
  const temp = tempBase + 6.5 * diurnal + (rand(dayIndex % 313) - 0.5) * 2.4;

  const rhBase = 62 + rand(seed % 197) * 14;
  const humidity = clamp(rhBase - 18 * diurnal + (rand(dayIndex % 523) - 0.5) * 6, 18, 98);

  const rainToday = rainBoost(n.id, dayIndex);
  const rainYesterday = rainBoost(n.id, dayIndex - 1);
  const drain = clamp((diurnal + 1) * 0.25, 0, 0.6);
  const moistureBase = 34 + rand(seed % 719) * 22;
  const soilMoisture = clamp(moistureBase + rainToday + rainYesterday * 0.6 - drain * 6, 10, 92);

  const slowDay = Math.sin((dayIndex % 45) / 45 * Math.PI * 2 + rand(seed % 887));
  const soilN = 240 + slowDay * 40 + rand(dayIndex % 1013) * 8;
  const soilP = 28 + slowDay * 9 + (rand(dayIndex % 727) - 0.5) * 3;
  const soilK = 195 + slowDay * 35 + (rand(dayIndex % 1031) - 0.5) * 10;

  return {
    temperature: round1(temp),
    humidity: Math.round(humidity),
    soilMoisture: Math.round(soilMoisture),
    soilN: Math.round(clamp(soilN, 80, 420)),
    soilP: Math.round(clamp(soilP, 6, 60)),
    soilK: Math.round(clamp(soilK, 70, 360)),
    recordedAt: d.toISOString()
  };
}

export function readingHistory(nodeId, points = 24, stepMinutes = 60) {
  const n = findNode(nodeId);
  if (!n) return null;
  const now = Date.now();
  const series = [];
  for (let i = points - 1; i >= 0; i -= 1) {
    const t = now - i * stepMinutes * 60000;
    series.push(readingAt(nodeId, t, n));
  }
  if (n.status === 'offline') {
    for (let i = Math.floor(series.length * 0.6); i < series.length; i += 1) {
      series[i] = null;
    }
  }
  return series.filter(Boolean);
}

export function evaluateAlerts(node, reading) {
  const labels = {
    temperature: 'Air temperature',
    humidity: 'Relative humidity',
    soilMoisture: 'Soil moisture',
    soilN: 'Soil nitrogen (N)',
    soilP: 'Soil phosphorus (P)',
    soilK: 'Soil potassium (K)'
  };
  const alerts = [];
  for (const key of Object.keys(node.thresholds)) {
    const th = node.thresholds[key];
    const value = reading[key];
    if (typeof value !== 'number') continue;
    if (value < th.min) {
      const t = labels[key];
      alerts.push({ metric: t, metricKey: key, value, unit: th.unit, severity: 'alert', message: `${t} is below the minimum of ${th.min} ${th.unit}` });
    } else if (value > th.max) {
      const t = labels[key];
      alerts.push({ metric: t, metricKey: key, value, unit: th.unit, severity: 'alert', message: `${t} is above the maximum of ${th.max} ${th.unit}` });
    } else if (key === 'soilMoisture' && value < th.min + (th.max - th.min) * 0.15) {
      const t = labels[key];
      alerts.push({ metric: t, metricKey: key, value, unit: th.unit, severity: 'warn', message: `${t} is approaching the lower threshold of ${th.min} ${th.unit}` });
    }
  }
  return alerts;
}

export function nodeDetail(nodeId, lang = 'en') {
  const node = findNode(nodeId);
  if (!node) return null;
  const reading = node.status === 'offline' ? null : readingAt(nodeId, Date.now(), node);
  const alerts = reading ? evaluateAlerts(node, reading) : [];
  return {
    node: {
      id: node.id,
      name: node.name,
      crop: node.crop,
      regionId: node.regionId,
      districtId: node.districtId,
      status: node.status,
      installed: node.installed,
      gateway: node.gateway,
      batteryPct: batteryPct(node.id, node.status),
      lastSeen: node.status === 'offline' ? new Date(Date.now() - 6 * 3600000).toISOString() : new Date(Date.now() - 90 * 1000).toISOString()
    },
    thresholds: node.thresholds,
    reading,
    alerts,
    note: node.status === 'offline'
      ? 'Node is not reporting. Values shown are from the last known good window; check gateway power and SIM data.'
      : 'Simulated telemetry from a diurnal model matched to this node’s crop and district. Values carry source: "simulated".'
  };
}
