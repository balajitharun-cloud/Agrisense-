import { fetchJson } from './http.js';

const TEXT_PROMPT = [
  'You are an agronomy advisor for smallholder farmers in Karnataka, India.',
  'You are given the farmer\u2019s context (district, agro-zone, season, water availability) and the top-ranked crop recommendations from a rule engine.',
  'Write one short field advisory of at most 130 words addressed to the farmer.',
  'Use plain sentences free of markdown, bullets or headings. Cover: which crop to prioritise and why, one concrete field action for this week, and one caution tied to water or weather.',
  'If the language code is not en, write wholly in that language (hi=Hindi, kn=Kannada, ta=Tamil, te=Telugu, ml=Malayalam, mr=Marathi, bn=Bengali, gu=Gujarati, pa=Punjabi).'
].join(' ');

const VISION_PROMPT = [
  'You are a plant-protection expert for Indian farmers. You are shown a photo taken in a field.',
  'Decide which pest or disease is most likely visible. Answer ONLY with a JSON object, no surrounding text or code fences:',
  '{"pest":"<pest name in English>","confidence":<0 to 1>,"severity":"low|medium|high|unknown","symptoms":"<what is visible in the photo, one sentence>","action":"<one concrete next step for the farmer, one sentence>"}',
  'If the photo is unclear or shows no pest, set pest to "Uncertain" and confidence to 0.3 or lower.'
].join(' ');

export function aiStatus() {
  if (process.env.MISTRAL_API_KEY) {
    return {
      provider: 'mistral',
      visionModel: process.env.AI_VISION_MODEL || 'pixtral-12b-2409',
      textModel: process.env.AI_TEXT_MODEL || 'mistral-small-latest'
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      visionModel: process.env.AI_VISION_MODEL || 'gpt-4o-mini',
      textModel: process.env.AI_TEXT_MODEL || 'gpt-4o-mini'
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      visionModel: process.env.AI_VISION_MODEL || 'gemini-1.5-flash',
      textModel: process.env.AI_TEXT_MODEL || 'gemini-1.5-flash'
    };
  }
  return { provider: null, visionModel: null, textModel: null };
}

export function aiConfigured() {
  return Boolean(aiStatus().provider);
}

function aiError(detail, code) {
  return Object.assign(new Error(detail), { code });
}

function postOptions(key, body) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key ? { authorization: `Bearer ${key}` } : {})
    },
    body: JSON.stringify(body)
  };
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  if (m[2].length > 5_500_000) return null;
  return { mime: m[1], data: m[2] };
}

function contentToText(content) {
  if (Array.isArray(content)) {
    return content.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('\n');
  }
  return typeof content === 'string' ? content : '';
}

function parseJsonLoose(text) {
  if (!text) return null;
  let cleaned = text.replace(/```[a-z]*|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }
  const m = /\{[\s\S]*\}/.exec(cleaned);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
  return null;
}

async function visionComplete(dataUrl, prompt) {
  const status = aiStatus();
  const { mime, data } = parseDataUrl(dataUrl) || {};
  if (!mime) return null;
  if (status.provider === 'mistral') {
    const body = {
      model: status.visionModel,
      temperature: 0.2,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: dataUrl }
        ]
      }]
    };
    const out = await fetchJson('https://api.mistral.ai/v1/chat/completions', postOptions(process.env.MISTRAL_API_KEY, body), 30000);
    return { text: contentToText(out && out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content) };
  }
  if (status.provider === 'openai') {
    const body = {
      model: status.visionModel,
      temperature: 0.2,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }]
    };
    const out = await fetchJson('https://api.openai.com/v1/chat/completions', postOptions(process.env.OPENAI_API_KEY, body), 30000);
    return { text: contentToText(out && out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content) };
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.visionModel)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mime, data } }
      ]
    }]
  };
  const out = await fetchJson(url, postOptions(null, body), 30000);
  const parts = out && out.candidates && out.candidates[0] && out.candidates[0].content && out.candidates[0].content.parts;
  return { text: contentToText(parts) };
}

async function textComplete(prompt) {
  const status = aiStatus();
  if (status.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(status.textModel)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
    const out = await fetchJson(url, postOptions(null, { contents: [{ parts: [{ text: prompt }] }] }), 30000);
    const parts = out && out.candidates && out.candidates[0] && out.candidates[0].content && out.candidates[0].content.parts;
    return contentToText(parts);
  }
  const [base, key] = status.provider === 'mistral'
    ? ['https://api.mistral.ai/v1', process.env.MISTRAL_API_KEY]
    : ['https://api.openai.com/v1', process.env.OPENAI_API_KEY];
  const out = await fetchJson(`${base}/chat/completions`, postOptions(key, {
    model: status.textModel,
    temperature: 0.4,
    max_tokens: 380,
    messages: [{ role: 'user', content: prompt }]
  }), 30000);
  return contentToText(out && out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content);
}

function normalizeSeverity(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('high')) return 'high';
  if (v.includes('medium') || v.includes('moderate')) return 'medium';
  if (v.includes('low') || v.includes('mild')) return 'low';
  return 'unknown';
}

export async function identifyPest({ imageDataUrl, crop, lang = 'en' }) {
  if (!parseDataUrl(imageDataUrl)) {
    throw aiError('image must be a base64 data URL (data:image/...;base64,...)', 'bad_image');
  }
  if (!aiConfigured()) {
    throw aiError('No AI provider is configured on this server (set MISTRAL_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY).', 'ai_not_configured');
  }
  const cropLine = crop && crop !== 'all' ? ` The crop is ${String(crop).replace(/-/g, ' ')}.` : '';
  const langLine = lang && lang !== 'en' ? ` Write symptoms and action in language code ${lang} if possible; keep the pest name in English.` : '';
  const prompt = `${VISION_PROMPT}${cropLine}${langLine}`;
  let raw;
  try {
    raw = await visionComplete(imageDataUrl, prompt);
  } catch (err) {
    throw aiError(`Vision model unavailable: ${err && err.message}`, 'ai_unavailable');
  }
  const parsedJson = parseJsonLoose(raw && raw.text);
  if (!parsedJson || !parsedJson.pest) {
    throw aiError('The model did not return a usable identification.', 'ai_bad_response');
  }
  const confidence = typeof parsedJson.confidence === 'number' && parsedJson.confidence >= 0 && parsedJson.confidence <= 1
    ? parsedJson.confidence
    : 0.5;
  return {
    pest: String(parsedJson.pest).slice(0, 120),
    confidence,
    severity: normalizeSeverity(parsedJson.severity),
    symptoms: String(parsedJson.symptoms || '').slice(0, 400),
    action: String(parsedJson.action || '').slice(0, 400),
    lang
  };
}

export async function writeAdvisory(context) {
  const { regionId, districtId, zone, season, water, lang = 'en', recommendCrops } = context;
  const rec = recommendCrops({
    regionId: regionId || 'ka',
    districtId,
    zone,
    season,
    water,
    lang: 'en'
  });
  const composed = composedAdvisory(rec, { season, water, lang });
  if (!aiConfigured()) {
    return { ...composed, source: 'simulated', provider: null };
  }
  const factLines = [
    `District: ${districtId || 'unspecified'}`,
    `Agro-zone: ${zone || 'unspecified'}`,
    `Season: ${season || 'unspecified'}`,
    `Water availability: ${water || 'medium'}`,
    `Engine summary: ${rec.summary}`,
    'Ranked crops: ' + rec.recommendations.slice(0, 4).map((c) => {
      const water = c.waterOk ? 'water ok' : 'water stressed';
      return `${c.name} (score ${c.score}, ${water})`;
    }).join('; ')
  ].join('\n');
  const prompt = `${TEXT_PROMPT}\n\n${factLines}`;
  try {
    const text = (await textComplete(prompt) || '').trim().replace(/^["']+|["']+$/g, '');
    if (!text || text.length < 40) throw new Error('empty response');
    return { advisory: text.slice(0, 900), source: 'live', provider: aiStatus().provider, lang };
  } catch {
    return { ...composed, source: 'simulated', provider: null };
  }
}

function composedAdvisory(rec, { season, water, lang }) {
  const top = rec.recommendations.slice(0, 3);
  const lead = top[0];
  const sentences = [];
  if (lead) {
    sentences.push(`${lead.name} is your priority crop for ${season || 'this season'} \u2014 ${lead.notes}`);
    const waterRation = (lead.rationale.find((r) => r.key === 'water') || {}).text;
    if (waterRation) sentences.push(`${waterRation}.`);
    const marketRation = (lead.rationale.find((r) => r.key === 'market') || {}).text;
    if (marketRation) sentences.push(`${marketRation}.`);
    if (lead.waterOk === false) sentences.push('Water availability is tight: schedule irrigation strictly at dawn and mulch to hold soil moisture.');
    sentences.push(`Alternate option: ${top[1] ? top[1].name : 'consider changing season or water level for a better match'}.`);
  } else {
    sentences.push(rec.summary);
  }
  return { advisory: sentences.join(' ').slice(0, 900), lang, provider: null };
}
