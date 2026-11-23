import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const outDir = path.join(frontendRoot, 'public', 'static-api');

const SEASONS = ['kharif', 'rabi', 'summer'];
const WATER = ['low', 'medium', 'high'];
const POINTS = [12, 24, 48, 72];

const CLIENT_FILTERED = new Set(['marketplace-listings', 'gov-announcements']);

function snapshotSlug(pathname, params = {}) {
  const safePath = pathname.split('/').filter(Boolean).join('-');
  if (CLIENT_FILTERED.has(safePath)) return `${safePath}.json`;
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== 'all')
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  if (!pairs.length) return `${safePath}.json`;
  const tail = pairs.map(([k, v]) => `${k}-${v}`).join('--');
  return `${safePath}--${tail}.json`;
}

async function main() {
  const { createApiApp } = await import(path.join(repoRoot, 'backend', 'src', 'api.js'));
  const app = createApiApp({ serveFrontend: false, logging: false });
  const server = app.listen(0, '127.0.0.1');

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const targets = [];
  const add = (pathname, params = {}) => targets.push({ pathname, params });

  add('/meta');
  add('/regions');

  const regions = (await (await fetch(`${base}/api/regions`)).json()).regions;
  const districts = [];
  for (const region of regions) {
    add(`/regions/${region.id}/districts`);
    for (const d of region.districts) {
      const id = typeof d === 'string' ? d : d.id;
      districts.push({ regionId: region.id, districtId: id });
    }
  }

  const nodesData = await (await fetch(`${base}/api/sensors/nodes`)).json();
  add('/sensors/nodes');
  for (const node of nodesData.nodes) {
    add(`/sensors/${node.id}`);
    for (const points of POINTS) add(`/sensors/${node.id}/history`, { points });
  }

  for (const { regionId, districtId } of districts) {
    add('/weather', { regionId, districtId, lang: 'en' });
    add('/satellite/soil', { regionId, districtId, lang: 'en' });
    for (const season of SEASONS) {
      for (const water of WATER) {
        add('/crops/recommend', { regionId, districtId, season, water, lang: 'en' });
      }
    }
  }

  const pests = (await (await fetch(`${base}/api/pests?lang=en`)).json()).pests;
  add('/pests', { lang: 'en' });
  add('/pesticides');
  for (const pest of pests) add('/pesticides', { pestId: pest.id, lang: 'en' });

  add('/marketplace/listings');
  add('/marketplace/prices');
  add('/gov/announcements');

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  let written = 0;
  let bytes = 0;
  for (const { pathname, params } of targets) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${base}/api${pathname}${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      console.error(`skip  /api${pathname}${qs ? `?${qs}` : ''} -> ${res.status}`);
      continue;
    }
    const json = await res.json();
    if (json && typeof json === 'object' && 'source' in json) json.source = 'simulated';
    const body = JSON.stringify(json);
    await writeFile(path.join(outDir, snapshotSlug(pathname, params)), body);
    written += 1;
    bytes += body.length;
  }

  server.close();
  console.log(`snapshot-api: ${written} endpoints (~${Math.round(bytes / 1024)} kB) -> public/static-api/`);
}

main().catch((err) => {
  console.error('snapshot-api failed:', err);
  process.exit(1);
});
