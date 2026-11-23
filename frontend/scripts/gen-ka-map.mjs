import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', 'src', 'lib', 'kaMap.js');
const SRC_URL = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/karnataka.geojson';

const DISTRICT_ZONES = {
  'Dakshina Kannada': 'Coastal Zone',
  Udupi: 'Coastal Zone',
  'Uttara Kannada': 'Coastal Zone',
  Shivamogga: 'Hilly Zone',
  Chikkamagaluru: 'Hilly Zone',
  Kodagu: 'Hilly Zone',
  Bidar: 'North Eastern Transition Zone',
  Kalaburagi: 'North Eastern Dry Zone',
  Yadgir: 'North Eastern Dry Zone',
  Raichur: 'North Eastern Dry Zone',
  Koppal: 'North Eastern Dry Zone',
  Belagavi: 'Northern Transition Zone',
  Dharwad: 'Northern Transition Zone',
  Vijayapura: 'Northern Dry Zone',
  Bagalkote: 'Northern Dry Zone',
  Gadag: 'Northern Dry Zone',
  Haveri: 'Northern Dry Zone',
  Chitradurga: 'Central Dry Zone',
  Ballari: 'Central Dry Zone',
  Davanagere: 'Central Dry Zone',
  'Bengaluru Rural': 'Eastern Dry Zone',
  'Bengaluru Urban': 'Eastern Dry Zone',
  Kolar: 'Eastern Dry Zone',
  Chikkaballapura: 'Eastern Dry Zone',
  Ramanagara: 'Eastern Dry Zone',
  Mysuru: 'Southern Dry Zone',
  Tumakuru: 'Southern Dry Zone',
  Mandya: 'Southern Dry Zone',
  Chamarajanagara: 'Southern Dry Zone',
  Hassan: 'Southern Transition Zone'
};

const ZONE_SHORT = {
  'Coastal Zone': 'Coastal',
  'Hilly Zone': 'Hilly',
  'North Eastern Transition Zone': 'N-East Transition',
  'North Eastern Dry Zone': 'N-East Dry',
  'Northern Transition Zone': 'Northern Transition',
  'Northern Dry Zone': 'Northern Dry',
  'Central Dry Zone': 'Central Dry',
  'Eastern Dry Zone': 'Eastern Dry',
  'Southern Dry Zone': 'Southern Dry',
  'Southern Transition Zone': 'S-Transition'
};

const geo = await (await fetch(SRC_URL)).json();

const ringsFor = (feature) => {
  const g = feature.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.map((p) => p[0]);
};

const all = [];
for (const f of geo.features) {
  const name = f.properties.district;
  const zone = DISTRICT_ZONES[name];
  if (!zone) throw new Error(`unmapped district: ${name}`);
  for (const r of ringsFor(f)) all.push({ name, zone, ring: r });
}

let minLng = 180;
let maxLng = -180;
let minLat = 90;
let maxLat = -90;
for (const d of all) {
  for (const [lng, lat] of d.ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
}

const PAD = 14;
const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const wGeo = (maxLng - minLng) * cosLat;
const hGeo = maxLat - minLat;
const W = 280;
const H = Math.round((W * hGeo) / wGeo);
const sx = (W - 2 * PAD) / wGeo;

const px = (lng) => PAD + (lng - minLng) * cosLat * sx;
const py = (lat) => PAD + (maxLat - lat) * sx;

const svgArea = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length - 1; i += 1) a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  return Math.abs(a / 2);
};

const centroid = (pts) => {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const cross = pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    a += cross;
    cx += (pts[i][0] + pts[i + 1][0]) * cross;
    cy += (pts[i][1] + pts[i + 1][1]) * cross;
  }
  a /= 2;
  return [Math.round((cx / (6 * a)) * 10) / 10, Math.round((cy / (6 * a)) * 10) / 10];
};

const simplify = (ring) => {
  const pts = ring.map(([lng, lat]) => [px(lng), py(lat)]);
  const out = [pts[0]];
  const minStep = 1.4;
  let last = pts[0];
  for (let i = 1; i < pts.length - 1; i += 1) {
    const dx = pts[i][0] - last[0];
    const dy = pts[i][1] - last[1];
    if (dx * dx + dy * dy >= minStep * minStep) {
      out.push(pts[i]);
      last = pts[i];
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const zones = new Map();
for (const d of all) {
  const pts = simplify(d.ring);
  const area = svgArea(pts);
  if (area < 3) continue;
  if (!zones.has(d.zone)) zones.set(d.zone, { zone: d.zone, short: ZONE_SHORT[d.zone], districts: [] });
  zones.get(d.zone).districts.push({ name: d.name, points: pts.map((p) => `${Math.round(p[0] * 10) / 10},${Math.round(p[1] * 10) / 10}`).join(' '), area });
}

const result = [...zones.values()].sort((a, b) => a.zone.localeCompare(b.zone)).map((z) => {
  const biggest = [...z.districts].sort((a, b) => b.area - a.area)[0];
  const [lx, ly] = centroid(biggest.points.split(' ').map((s) => s.split(',').map(Number)));
  const { zone, short, districts } = z;
  return { zone, short, label: [lx, Math.round(ly * 10) / 10], districts: districts.map(({ name, points }) => ({ name, points })) };
});

let total = 0;
for (const z of result) for (const d of z.districts) total += d.points.length;
if (result.length !== 10) throw new Error(`expected 10 zones, got ${result.length}`);
const got = result.flatMap((z) => z.districts.map((d) => d.name)).sort();
const missing = Object.keys(DISTRICT_ZONES).filter((n) => !got.includes(n));
if (missing.length) console.log('MISSING:', missing.join(', '));
if (new Set(got).size !== 30) throw new Error('expected 30 districts, got ' + new Set(got).size);

const body = `export const KA_VIEWBOX = '0 0 ${W} ${H}';

export const KA_ZONE_SHAPES = ${JSON.stringify(result, null, 2)};

export const KA_OUTLINE_NOTE =
  'Simplified from district boundaries of Karnataka (census 2011 mapping). Zone groupings indicative of state agro-climatic classification.';
`;

await writeFile(OUT, body);
console.log(`gen-ka-map: 10 zones / 30 districts, viewBox ${W}x${H}, path data ~${Math.round(total / 1024)} kB -> src/lib/kaMap.js`);
