import { Router } from 'express';
import { listRegions, listDistricts, findDistrict, findRegion, zoneSummary } from '../data/regions.js';
import { listPests, listPesticides, findPesticide } from '../data/pesticides.js';
import { listListings, listPrices, LISTING_CATEGORIES } from '../data/marketplace.js';
import { listAnnouncements } from '../data/gov.js';
import { readingHistory, nodeDetail, listNodes, defaultNode } from '../services/sensors.js';
import { getWeather } from '../services/weather.js';
import { getSoilSatellite } from '../services/satellite.js';
import { recommendCrops, listCrops } from '../services/crops.js';
import { zoneCropsTrend } from '../services/trends.js';
import { voiceStatus, synthesize } from '../services/voice.js';
import { translate } from '../services/translate.js';
import { aiStatus, aiConfigured, identifyPest, writeAdvisory } from '../services/ai.js';
import * as account from '../services/account.js';
import { authenticate } from '../services/account.js';

const LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bn', 'gu', 'pa'];

export function createRouter() {
  const router = Router();

  router.get('/meta', (req, res) => {
    res.json({
      app: 'AgriSense',
      tagline: 'Field intelligence, in real time',
      version: '1.0.0',
      languages: LANGS,
      integrations: {
        weather: process.env.OPENWEATHER_API_KEY ? 'openweathermap' : 'open-meteo',
        satellite: process.env.SENTINEL_HUB_CLIENT_ID ? 'sentinel-hub' : 'simulated',
        voice: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'browser',
        translate: process.env.TRANSLATE_API_KEY ? 'provider' : 'dictionary',
        marketplace: process.env.MARKETPLACE_API_BASE ? 'external' : 'in-memory',
        govFeed: process.env.GOV_FEED_URL ? 'external' : 'in-memory',
        ai: aiConfigured() ? `${aiStatus().provider} (${aiStatus().visionModel})` : 'rule-based fallback (set MISTRAL_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY)',
        accounts: 'in-memory (not durable — replace with a real database for production)'
      }
    });
  });

  router.get('/regions', (req, res) => {
    res.json({ regions: listRegions(), source: 'mock' });
  });

  router.get('/regions/:regionId/districts', (req, res) => {
    const districts = listDistricts(req.params.regionId);
    if (!findRegion(req.params.regionId)) return res.status(404).json({ error: 'Unknown region' });
    res.json({ region: req.params.regionId, districts, source: 'mock' });
  });

  router.get('/crops/recommend', (req, res) => {
    const { regionId = 'ka', districtId, season, water, lang = 'en' } = req.query;
    const district = findDistrict(regionId, districtId) || listDistricts(regionId)[0] || null;
    const result = recommendCrops({
      regionId,
      districtId: district ? district.id : undefined,
      zone: district && district.zone,
      season,
      water,
      lang
    });
    res.json({ ...result, source: 'mock' });
  });

  router.get('/crops', (req, res) => {
    res.json({ crops: listCrops(), source: 'mock' });
  });

  router.get('/crops/zone-trends', (req, res) => {
    const { regionId = 'ka', zone, season = 'kharif', lang = 'en' } = req.query;
    const data = zoneCropsTrend({ regionId, zone, season, lang });
    if (!data) return res.status(404).json({ error: 'Unknown zone for trends' });
    res.json({ ...data, source: 'mock' });
  });

  router.get('/pests', (req, res) => {
    const lang = req.query.lang || 'en';
    res.json({ pests: listPests(lang), source: 'mock' });
  });

  router.get('/pesticides', (req, res) => {
    const { pestId, cropId, lang = 'en' } = req.query;
    void lang;
    res.json({ pesticides: listPesticides({ pestId, cropId }), source: 'mock' });
  });

  router.get('/pesticides/:id', (req, res) => {
    const p = findPesticide(req.params.id);
    if (!p) return res.status(404).json({ error: 'Unknown product' });
    res.json({ pesticide: { ...p, disclaimer: 'Verify dosage and crop-stage against the current CIB&RC label with a licensed agronomist before purchase or use.' }, source: 'mock' });
  });

  router.get('/sensors/nodes', (req, res) => {
    res.json({ nodes: listNodes(), defaultNode: defaultNode().id, source: 'simulated' });
  });

  router.get('/sensors/:nodeId', (req, res) => {
    const detail = nodeDetail(req.params.nodeId, req.query.lang || 'en');
    if (!detail) return res.status(404).json({ error: 'Unknown sensor node' });
    res.json({ ...detail, source: 'simulated' });
  });

  router.get('/sensors/:nodeId/history', (req, res) => {
    const points = Math.min(Math.max(parseInt(req.query.points, 10) || 24, 6), 168);
    const history = readingHistory(req.params.nodeId, points);
    if (!history) return res.status(404).json({ error: 'Unknown sensor node' });
    res.json({ nodeId: req.params.nodeId, stepMinutes: 60, points: points, history, source: 'simulated' });
  });

  router.get('/weather', async (req, res, next) => {
    try {
      const { regionId = 'ka', districtId, lang = 'en' } = req.query;
      const data = await getWeather(regionId, districtId, lang);
      if (!data) return res.status(404).json({ error: 'Unknown district for weather' });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/satellite/soil', async (req, res, next) => {
    try {
      const { regionId = 'ka', districtId, lang = 'en' } = req.query;
      const data = await getSoilSatellite(regionId, districtId, lang);
      if (!data) return res.status(404).json({ error: 'Unknown district for satellite data' });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/marketplace/listings', (req, res) => {
    const { category, crop, q, lang = 'en' } = req.query;
    void lang;
    res.json({ categories: LISTING_CATEGORIES, listings: listListings({ category, crop, q }), source: 'mock' });
  });

  router.get('/marketplace/prices', (req, res) => {
    res.json({ prices: listPrices(), source: 'mock' });
  });

  router.get('/gov/announcements', (req, res) => {
    const { region, category, level, lang = 'en' } = req.query;
    void lang;
    res.json({ announcements: listAnnouncements({ region, category, level }), source: 'mock' });
  });

  router.get('/voice/status', (req, res) => {
    res.json({ ...voiceStatus(), source: 'mock' });
  });

  router.get('/ai/status', (req, res) => {
    const status = aiStatus();
    res.json({ configured: Boolean(status.provider), ...status, source: process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? 'live' : 'mock' });
  });

  router.post('/ai/pest-identify', async (req, res, next) => {
    try {
      const { image, crop, lang = 'en' } = req.body || {};
      if (!image) return res.status(400).json({ error: 'image data URL is required', source: 'mock' });
      const result = await identifyPest({ imageDataUrl: image, crop, lang });
      res.json({ ...result, source: 'live' });
    } catch (err) {
      if (err && ['ai_not_configured', 'ai_unavailable', 'ai_bad_response', 'bad_image'].includes(err.code)) {
        return res.status(err.code === 'bad_image' ? 400 : 503).json({ error: err.message, detail: err.code, source: 'mock' });
      }
      next(err);
    }
  });

  router.post('/ai/advisory', async (req, res, next) => {
    try {
      const { regionId = 'ka', districtId, zone, season, water, lang = 'en' } = req.body || {};
      const data = await writeAdvisory({ regionId, districtId, zone, season, water, lang, recommendCrops });
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/voice/tts', async (req, res, next) => {
    try {
      const { text, voiceId, lang } = req.body || {};
      if (!process.env.ELEVENLABS_API_KEY) {
        return res.status(501).json({ error: 'Voice synthesis is not configured on this server (set ELEVENLABS_API_KEY).' });
      }
      const audio = await synthesize({ text, voiceId, lang });
      if (!audio) return res.status(400).json({ error: 'text is required' });
      res.setHeader('content-type', 'audio/mpeg');
      res.send(audio);
    } catch (err) {
      next(err);
    }
  });

  router.post('/translate', (req, res) => {
    const { text, lang } = req.body || {};
    res.json(translate(text, lang || 'en'));
  });

  router.post('/auth/register', (req, res) => {
    try {
      res.status(201).json(account.register(req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/auth/login', (req, res) => {
    try {
      res.json(account.login(req.body || {}));
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  });

  router.post('/auth/logout', (req, res) => {
    account.logout(req.headers.authorization);
    res.json({ ok: true });
  });

  router.get('/account/me', (req, res) => {
    const user = authenticate(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user });
  });

  router.patch('/account/me', (req, res) => {
    const user = authenticate(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: account.updateProfile(user, req.body || {}) });
  });

  router.post('/account/farms', (req, res) => {
    const user = authenticate(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.status(201).json({ farm: account.addFarm(user, req.body || {}), user });
  });

  return router;
}
