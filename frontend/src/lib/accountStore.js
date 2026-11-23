const DB_KEY = 'agrisense-db';
const SESSION_KEY = 'agrisense-session';
const ADMIN_KEY = 'agrisense-admin';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'agrisense-admin';

function hasStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

function readJSON(key, fallback) {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

function removeKey(key) {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function fallbackHash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const a = (h1 >>> 0).toString(16).padStart(8, '0');
  const b = (h2 >>> 0).toString(16).padStart(8, '0');
  const c = (Math.imul(h1 ^ h2, 668265261) >>> 0).toString(16).padStart(8, '0');
  const d = (Math.imul(h2 ^ (h1 + 0x9e3779b9 | 0), 2246822519) >>> 0).toString(16).padStart(8, '0');
  return `f_${a}${b}${c}${d}`;
}

async function hashPassword(password, salt) {
  const encoded = `${salt}::${password}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encodedBytes = new TextEncoder().encode(encoded);
    const digest = await window.crypto.subtle.digest('SHA-256', encodedBytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return fallbackHash(encoded);
}

function newSalt() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return fallbackHash(String(Math.random()) + String(Date.now())).replace('f_', '');
}

export function listAccounts() {
  return readJSON(DB_KEY, []);
}

function saveAccounts(list) {
  writeJSON(DB_KEY, list);
}

export function findAccount(email) {
  const key = String(email || '').trim().toLowerCase();
  return listAccounts().find((a) => a.email === key) || null;
}

function publicUser(a) {
  return {
    email: a.email,
    name: a.name,
    phone: a.phone || '',
    region: a.region || 'ka',
    district: a.district || '',
    preferredLanguage: a.preferredLanguage || '',
    createdAt: a.createdAt,
    farms: a.farms || []
  };
}

export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

export async function createAccount({ name, email, phone, password, preferredLanguage }) {
  if (!hasStorage()) throw new Error('Storage unavailable');
  const clean = String(name || '').trim();
  const key = String(email || '').trim().toLowerCase();
  if (clean.length < 2) throw new Error('Please enter your name (2+ characters).');
  if (!validEmail(key)) throw new Error('Please enter a valid email address.');
  if (String(password || '').length < 6) throw new Error('Password needs at least 6 characters.');
  if (findAccount(key)) throw new Error('An account with this email already exists. Sign in instead.');
  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  const record = {
    email: key,
    name: clean,
    phone: String(phone || '').trim(),
    salt,
    hash,
    region: 'ka',
    district: '',
    preferredLanguage: preferredLanguage || '',
    createdAt: new Date().toISOString(),
    farms: []
  };
  saveAccounts([...listAccounts(), record]);
  return startSession(key);
}

export async function verifyAccount(email, password) {
  const account = findAccount(email);
  if (!account) throw new Error('No account found for this email. Create one first.');
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) throw new Error('Wrong password. Try again.');
  return startSession(account.email);
}

export function adminCredentials() {
  const envUser = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_ADMIN_USER : null;
  const envPass = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_ADMIN_PASSWORD : null;
  return { user: envUser || ADMIN_USER, password: envPass || ADMIN_PASSWORD };
}

export function unlockAdmin(username, password) {
  const creds = adminCredentials();
  if (String(username || '').trim() !== creds.user || password !== creds.password) {
    throw new Error('Wrong admin username or password.');
  }
  if (hasStorage()) {
    try {
      window.localStorage.setItem(ADMIN_KEY, '1');
    } catch {
      /* ignore */
    }
  }
  return startAdminSession();
}

export function startAdminSession() {
  const session = { kind: 'admin', name: 'Administrator', email: 'admin@agrisense.in' };
  writeJSON(SESSION_KEY, session);
  return session;
}

function startSession(email) {
  const account = findAccount(email);
  if (!account) throw new Error('Account missing');
  const session = { kind: 'user', user: publicUser(account) };
  writeJSON(SESSION_KEY, session);
  return session;
}

export function getSession() {
  const stored = readJSON(SESSION_KEY, null);
  if (!stored) return null;
  if (stored.kind === 'admin') {
    let flag = null;
    if (hasStorage()) {
      try {
        flag = window.localStorage.getItem(ADMIN_KEY);
      } catch {
        flag = null;
      }
    }
    if (flag !== '1') {
      removeKey(SESSION_KEY);
      return null;
    }
    return stored;
  }
  if (stored.kind === 'user' && stored.user) {
    const fresh = findAccount(stored.user.email);
    return fresh ? { kind: 'user', user: publicUser(fresh) } : stored;
  }
  return stored;
}

export function endSession() {
  removeKey(SESSION_KEY);
  removeKey(ADMIN_KEY);
}

export function updateAccount(email, patch) {
  const accounts = listAccounts();
  const i = accounts.findIndex((a) => a.email === email);
  if (i === -1) return null;
  const next = { ...accounts[i], ...patch };
  accounts[i] = next;
  saveAccounts(accounts);
  return publicUser(next);
}

export function addFarm(email, farm) {
  const accounts = listAccounts();
  const i = accounts.findIndex((a) => a.email === email);
  if (i === -1) return null;
  const record = {
    id: `farm-${Date.now()}`,
    label: String(farm.label || 'Farm').trim(),
    region: farm.region || 'ka',
    district: farm.district || '',
    area: farm.area || '',
    primaryCrop: farm.primaryCrop || ''
  };
  const farms = [...(accounts[i].farms || []), record];
  accounts[i] = { ...accounts[i], farms };
  saveAccounts(accounts);
  return record;
}

export function removeFarm(email, farmId) {
  const accounts = listAccounts();
  const i = accounts.findIndex((a) => a.email === email);
  if (i === -1) return null;
  const farms = (accounts[i].farms || []).filter((f) => f.id !== farmId);
  accounts[i] = { ...accounts[i], farms };
  saveAccounts(accounts);
  return publicUser(accounts[i]);
}
