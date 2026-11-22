import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const users = new Map();
const tokens = new Map();
const TOKEN_TTL_MS = 24 * 3600 * 1000;

function nextId(prefix) {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const DEMO_EMAIL = 'demo@agrisense.in';

export function ensureDemoAccount() {
  if (users.has(DEMO_EMAIL)) return;
  const salt = randomBytes(16).toString('hex');
  users.set(DEMO_EMAIL, {
    id: nextId('usr'),
    email: DEMO_EMAIL,
    name: 'Demo Farmer',
    phone: '+91 90000 00000',
    passwordSalt: salt,
    passwordHash: hashPassword('demo1234', salt),
    preferredLanguage: 'en',
    region: 'ka',
    district: 'ka-mysuru',
    createdAt: new Date().toISOString(),
    farms: [{
      id: 'farm-1',
      label: 'Home Block',
      region: 'ka',
      district: 'ka-mysuru',
      area: 2.5,
      primaryCrop: 'ragi'
    }]
  });
}

export function register({ email, password, name, phone, region, district, preferredLanguage }) {
  const key = String(email || '').trim().toLowerCase();
  if (!key || !password) throw new Error('Email and password are required');
  if (users.has(key)) throw new Error('An account with this email already exists');
  const salt = randomBytes(16).toString('hex');
  const user = {
    id: nextId('usr'),
    email: key,
    name: name || 'Farmer',
    phone: phone || '',
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    preferredLanguage: preferredLanguage || 'en',
    region: region || 'ka',
    district: district || '',
    createdAt: new Date().toISOString(),
    farms: []
  };
  users.set(key, user);
  return issueToken(user);
}

export function login({ email, password }) {
  const key = String(email || '').trim().toLowerCase();
  const user = users.get(key);
  if (!user || !password || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error('Invalid email or password');
  }
  return issueToken(user);
}

function issueToken(user) {
  const token = randomBytes(24).toString('hex');
  tokens.set(token, { userId: user.id, expiresAt: Date.now() + TOKEN_TTL_MS });
  return { token, user: publicUser(user) };
}

export function authenticate(bearer) {
  if (!bearer || !bearer.startsWith('Bearer ')) return null;
  const token = bearer.slice(7);
  const rec = tokens.get(token);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    tokens.delete(token);
    return null;
  }
  for (const user of users.values()) {
    if (user.id === rec.userId) return user;
  }
  return null;
}

export function logout(token) {
  if (token && token.startsWith('Bearer ')) tokens.delete(token.slice(7));
}

function publicUser(user) {
  const { passwordHash, passwordSalt, ...rest } = user;
  return rest;
}

export function updateProfile(user, patch) {
  const allowed = ['name', 'phone', 'preferredLanguage', 'region', 'district'];
  for (const k of allowed) {
    if (patch[k] !== undefined) user[k] = patch[k];
  }
  return publicUser(user);
}

export function addFarm(user, farm) {
  const rec = {
    id: nextId('farm'),
    label: farm.label || 'Untitled farm',
    region: farm.region || '',
    district: farm.district || '',
    area: Number(farm.area) || 0,
    primaryCrop: farm.primaryCrop || ''
  };
  user.farms.push(rec);
  return rec;
}

export function removeFarm(user, farmId) {
  const idx = user.farms.findIndex((f) => f.id === farmId);
  if (idx === -1) return false;
  user.farms.splice(idx, 1);
  return true;
}

export function isDurable() {
  return false;
}

ensureDemoAccount();
