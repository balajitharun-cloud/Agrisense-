import assert from 'node:assert';
import { createServer } from 'node:http';
import { createApiApp } from '../src/api.js';

let passed = 0;
let failed = 0;
const failures = [];

function it(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok   ${name}`);
    })
    .catch((err) => {
      failed += 1;
      failures.push({ name, err });
      console.log(`  FAIL ${name}: ${err && err.message}`);
    });
}

const app = createApiApp({ serveFrontend: false, logging: false });
const server = createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const prefix = `http://127.0.0.1:${server.address().port}`;

async function get(path, opts = {}) {
  const res = await fetch(`${prefix}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function post(path, data, opts = {}) {
  const res = await fetch(`${prefix}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
    body: JSON.stringify(data)
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

await it('health returns ok + uptime', async () => {
  const r = await get('/health');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.status, 'ok');
  assert.strictEqual(typeof r.body.uptime, 'number');
});

await it('meta lists 10 languages', async () => {
  const r = await get('/api/meta');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.languages.length, 10);
  assert.ok(r.body.integrations);
});

await it('regions returns states with districts', async () => {
  const r = await get('/api/regions');
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.regions.length >= 10);
  assert.ok(r.body.regions.find((s) => s.id === 'ka'));
});

await it('region districts returns list', async () => {
  const r = await get('/api/regions/ka/districts');
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.districts.some((d) => d.id === 'ka-mysuru'));
});

await it('crop recommend ranks crops with rationale', async () => {
  const r = await get('/api/crops/recommend?regionId=ka&districtId=ka-mysuru&season=kharif&water=medium&lang=en');
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.recommendations.length >= 3);
  assert.ok(r.body.recommendations[0].rationale.length >= 4);
  assert.strictEqual(typeof r.body.summary, 'string');
});

await it('pests lists at least 6', async () => {
  const r = await get('/api/pests');
  assert.ok(r.body.pests.length >= 6, `got ${r.body.pests.length}`);
});

await it('pesticides filtered by pestId gives formula/dosage/PHI', async () => {
  const r = await get('/api/pesticides?pestId=fall-armyworm');
  assert.ok(r.body.pesticides.length >= 2);
  const p = r.body.pesticides[0];
  assert.ok(p.formula && p.dosePerAcre && typeof p.phi === 'number');
});

await it('pesticides/:id returns one product', async () => {
  const r = await get('/api/pesticides/emamectin-benzoate-5sg');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.pesticide.id, 'emamectin-benzoate-5sg');
  assert.ok(r.body.pesticide.disclaimer);
});

await it('sensors/nodes: >=4 nodes with defaultNode', async () => {
  const r = await get('/api/sensors/nodes');
  assert.ok(r.body.nodes.length >= 4);
  assert.ok(r.body.defaultNode);
});

await it('sensors/:nodeId gives readings + alerts + thresholds', async () => {
  const r = await get('/api/sensors/node-block-a-ragi');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.source, 'simulated');
  const keys = Object.keys(r.body.reading);
  assert.ok(keys.includes('temperature') && keys.includes('soilN') && keys.includes('soilK'));
  assert.ok(Array.isArray(r.body.alerts));
  assert.ok(r.body.thresholds.temperature);
});

await it('sensors history respects points', async () => {
  const r = await get('/api/sensors/node-block-a-ragi/history?points=12');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.history.length, 12);
});

await it('sensors 404 on unknown node', async () => {
  const r = await get('/api/sensors/nope');
  assert.strictEqual(r.status, 404);
});

await it('weather gives current + 7 day + tips', async () => {
  const r = await get('/api/weather?regionId=ka&districtId=ka-mysuru&lang=en');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.forecast.length, 7);
  assert.strictEqual(r.body.current.temperature !== undefined, true);
  assert.strictEqual(r.body.current.label !== undefined, true);
  assert.ok(Array.isArray(r.body.tips));
  assert.ok(['live', 'simulated'].includes(r.body.source));
});

await it('weather defaults to region district when districtId omitted', async () => {
  const r = await get('/api/weather?regionId=ka&lang=en');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.forecast.length, 7);
  assert.strictEqual(r.body.current.temperature !== undefined, true);
});

await it('satellite/soil: returns ndvi, moisture, surfaceTemp + explanation', async () => {
  const r = await get('/api/satellite/soil?regionId=ka&districtId=ka-kalaburagi&lang=en');
  assert.strictEqual(r.status, 200);
  const got = ['ndvi', 'soilMoisture', 'surfaceTemp'];
  assert.deepStrictEqual(Object.keys(r.body.indices), got);
  assert.ok(r.body.explanation.length === 3);
  assert.ok(r.body.explanation[0].meaning.length > 20);
  assert.ok(r.body.explanation[0].advice.length > 20);
});

await it('satellite/soil defaults to region district when districtId omitted', async () => {
  const r = await get('/api/satellite/soil?regionId=ka&lang=en');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.indices.ndvi !== undefined, true);
});

await it('marketplace/listings: 12+ and filterable', async () => {
  const r = await get('/api/marketplace/listings');
  assert.ok(r.body.listings.length >= 12, `got ${r.body.listings.length}`);
  const r2 = await get('/api/marketplace/listings?category=seeds');
  assert.ok(r2.body.listings.every((l) => l.category === 'seeds'));
  const r3 = await get('/api/marketplace/listings?q=ragi');
  assert.ok(r3.body.listings.some((l) => l.title.includes('Ragi')));
});

await it('marketplace/prices: 8+ with day change', async () => {
  const r = await get('/api/marketplace/prices');
  assert.ok(r.body.prices.length >= 8);
  const p = r.body.prices[0];
  assert.ok(['quintal', 'kg', 'bag', '1000 nuts'].includes(p.unit));
  assert.strictEqual(typeof p.change, 'number');
});

await it('gov/announcements: 8+, filterable by level', async () => {
  const r = await get('/api/gov/announcements');
  assert.ok(r.body.announcements.length >= 8);
  const r2 = await get('/api/gov/announcements?level=district');
  assert.ok(r2.body.announcements.every((a) => a.level === 'district'));
  const r3 = await get('/api/gov/announcements?region=ka&category=advisory');
  const has = r3.body.announcements.length;
  assert.ok(has >= 1);
});

await it('voice/status reflects unset key', async () => {
  const r = await get('/api/voice/status');
  assert.strictEqual(r.body.configured, false);
});

await it('voice/tts returns 501 when unconfigured', async () => {
  const r = await post('/api/voice/tts', { text: 'hello' });
  assert.strictEqual(r.status, 501);
});

await it('translate returns dictionary engine with fallback flag', async () => {
  const r = await post('/api/translate', { text: 'delay spraying rain expected within 36 hours', lang: 'hi' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.engine, 'dictionary');
  assert.ok(r.body.translated.length > 0);
});

await it('auth: register -> token', async () => {
  const r = await post('/api/auth/register', {
    email: `smoke-${Date.now()}@test.in`, password: 'test1234', name: 'Smoke Tester'
  });
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.token);
  globalThis.__smokeToken = r.body.token;
  globalThis.__smokeEmail = `smoke-${Date.now() - 1}@test.in`;
});

await it('account/me requires auth (401 unauthenticated)', async () => {
  const r = await get('/api/account/me');
  assert.strictEqual(r.status, 401);
});

await it('account/me with token returns profile', async () => {
  const r = await get('/api/account/me', { headers: { authorization: `Bearer ${globalThis.__smokeToken}` } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.user.name, 'Smoke Tester');
});

await it('patch /account/me updates preferredLanguage', async () => {
  const r0 = await fetch(`${prefix}/api/account/me`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${globalThis.__smokeToken}` },
    body: JSON.stringify({ preferredLanguage: 'kn' })
  });
  const body = await r0.json();
  assert.strictEqual(r0.status, 200);
  assert.strictEqual(body.user.preferredLanguage, 'kn');
});

await it('account/farms adds a farm', async () => {
  const r0 = await fetch(`${prefix}/api/account/farms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${globalThis.__smokeToken}` },
    body: JSON.stringify({ label: 'North Plot', region: 'ka', district: 'ka-kalaburagi', area: 3.2, primaryCrop: 'jowar' })
  });
  const body = await r0.json();
  assert.strictEqual(r0.status, 201);
  assert.ok(body.farm.id);
});

await it('auth: login with demo@agrisense.in / demo1234', async () => {
  const r = await post('/api/auth/login', { email: 'demo@agrisense.in', password: 'demo1234' });
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.token);
  assert.ok(r.body.user.farms.length >= 1);
});

await it('auth: login rejects bad password (401)', async () => {
  const r = await post('/api/auth/login', { email: 'demo@agrisense.in', password: 'wrong' });
  assert.strictEqual(r.status, 401);
});

await it('auth: logout + subsequent me is 401', async () => {
  const r = await post('/api/auth/logout', {}, { headers: { authorization: `Bearer ${globalThis.__smokeToken}` } });
  assert.strictEqual(r.status, 200);
  const me = await get('/api/account/me', { headers: { authorization: `Bearer ${globalThis.__smokeToken}` } });
  assert.strictEqual(me.status, 401);
});

await it('unknown /api route returns JSON 404', async () => {
  const r = await get('/api/does-not-exist');
  assert.strictEqual(r.status, 404);
  assert.ok(r.body.error);
});

await it('crops/zone-trends: lists karnataka zones when zone omitted', async () => {
  const r = await get('/api/crops/zone-trends?regionId=ka');
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.zones.length === 10, `got ${r.body.zones?.length} zones`);
  assert.ok(r.body.descriptions);
});

await it('crops/zone-trends: top-10 crops with past/current/future trend data', async () => {
  const r = await get('/api/crops/zone-trends?regionId=ka&zone=' + encodeURIComponent('Hilly Zone') + '&season=kharif&lang=en');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.crops.length, 10);
  const first = r.body.crops[0];
  assert.strictEqual(first.history.length, 6);
  assert.strictEqual(first.forecast.length, 3);
  assert.ok(['rising', 'stable', 'watch'].includes(first.verdict));
  assert.ok(first.verdictReason.length > 40);
  assert.ok(first.outlook.length > 40);
  assert.strictEqual(first.rank, 1);
});

await it('crops/zone-trends: 404 on unknown zone', async () => {
  const r = await get('/api/crops/zone-trends?regionId=ka&zone=Nope');
  assert.strictEqual(r.status, 404);
});

await it('ai/status reports provider or mock', async () => {
  const r = await get('/api/ai/status');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(typeof r.body.configured, 'boolean');
  if (!r.body.configured) assert.strictEqual(r.body.provider, null);
  assert.ok(['live', 'mock'].includes(r.body.source));
});

await it('ai/pest-identify degrades to 503 JSON without a provider key', async () => {
  const r = await post('/api/ai/pest-identify', { image: 'data:image/png;base64,AAAA' });
  assert.strictEqual(r.status, 503);
  assert.strictEqual(r.body.source, 'mock');
  assert.strictEqual(r.body.detail, 'ai_not_configured');
});

await it('ai/advisory composes a rule-based advisory without a key', async () => {
  const r = await post('/api/ai/advisory', { districtId: 'ka-mysuru', zone: 'Southern Dry Zone', season: 'kharif', water: 'medium', lang: 'en' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.source, 'simulated');
  assert.ok(r.body.advisory.length > 60, `advisory too short: ${(r.body.advisory || '').length}`);
});

await it('ai/pest-identify rejects a non-data-url image with 400', async () => {
  const r = await post('/api/ai/pest-identify', { image: 'not-a-data-url' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.detail, 'bad_image');
});

await new Promise((resolve) => server.close(resolve));

console.log('');
console.log(`smoke: ${passed} passed, ${failed} failed (of ${passed + failed})`);
if (failed > 0) {
  process.exit(1);
}
