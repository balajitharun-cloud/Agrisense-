const BASE_URL = (import.meta.env && import.meta.env.BASE_URL) || '/';
const STATIC_ROOT = `${BASE_URL}static-api/`;

const CLIENT_FILTERED = new Set(['marketplace-listings', 'gov-announcements']);

const safeValue = (v) =>
  String(v)
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const safeDecode = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

function parsePairs(rawQuery) {
  return rawQuery
    ? rawQuery.split('&').filter(Boolean).map((pair) => {
        const eq = pair.indexOf('=');
        const key = eq === -1 ? pair : pair.slice(0, eq);
        const val = eq === -1 ? '' : pair.slice(eq + 1);
        return [key, val];
      })
    : [];
}

export function snapshotSlug(path) {
  const clean = path.startsWith('/api/') ? path.slice(4) : path;
  const qIndex = clean.indexOf('?');
  const pathname = qIndex === -1 ? clean : clean.slice(0, qIndex);
  const safePath = pathname.split('/').filter(Boolean).join('-');
  if (CLIENT_FILTERED.has(safePath)) return `${safePath}.json`;
  const rawQuery = qIndex === -1 ? '' : clean.slice(qIndex + 1);
  const pairs = parsePairs(rawQuery)
    .filter(([k, v]) => v !== '' && v !== 'all')
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  if (!pairs.length) return `${safePath}.json`;
  const tail = pairs.map(([k, v]) => `${k}-${safeValue(safeDecode(v))}`).join('--');
  return `${safePath}--${tail}.json`;
}

function filterListings(data, params) {
  const get = (k, dflt = '') => (params.has(k) ? params.get(k) : dflt);
  const category = get('category', 'all');
  const crop = get('crop', 'all');
  const q = get('q');
  let out = (data.listings || []).slice();
  if (category && category !== 'all') out = out.filter((l) => l.category === category);
  if (crop && crop !== 'all') {
    out = out.filter((l) => l.crop === crop || l.crop === null || l.crop === undefined);
  }
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((l) =>
      l.title.toLowerCase().includes(needle) ||
      l.seller.toLowerCase().includes(needle) ||
      l.location.toLowerCase().includes(needle)
    );
  }
  return { ...data, listings: out };
}

function filterAnnouncements(data, params) {
  const get = (k, dflt = '') => (params.has(k) ? params.get(k) : dflt);
  const region = get('region', 'all');
  const category = get('category', 'all');
  const level = get('level', 'all');
  let out = (data.announcements || []).slice();
  if (region && region !== 'all') out = out.filter((a) => a.region === null || a.region === region);
  if (category && category !== 'all') out = out.filter((a) => a.category === category);
  if (level && level !== 'all') out = out.filter((a) => a.level === level);
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return { ...data, announcements: out };
}

export function postProcessSnapshot(path, data) {
  const qIndex = path.indexOf('?');
  const rawQuery = qIndex === -1 ? '' : path.slice(qIndex + 1);
  const params = new URLSearchParams(rawQuery);
  const clean = path.startsWith('/api/') ? path.slice(4) : path;
  const safePath = clean.split('?')[0].split('/').filter(Boolean).join('-');
  if (safePath === 'marketplace-listings') return filterListings(data, params);
  if (safePath === 'gov-announcements') return filterAnnouncements(data, params);
  return data;
}

export async function fetchStaticSnapshot(path) {
  const res = await fetch(`${STATIC_ROOT}${snapshotSlug(path)}`, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw Object.assign(new Error(`No snapshot for ${path} (${res.status})`), { status: res.status });
  }
  return postProcessSnapshot(path, await res.json());
}
