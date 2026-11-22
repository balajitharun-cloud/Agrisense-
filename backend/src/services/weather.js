import { findDistrict } from '../data/regions.js';
import { fetchJson } from './http.js';

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const WEATHER_CODES = [
  { code: 0, label: 'Clear sky' },
  { code: 1, label: 'Mainly clear' },
  { code: 2, label: 'Partly cloudy' },
  { code: 3, label: 'Overcast' },
  { code: 45, label: 'Fog' },
  { code: 51, label: 'Light drizzle' },
  { code: 61, label: 'Light rain' },
  { code: 63, label: 'Moderate rain' },
  { code: 65, label: 'Heavy rain' },
  { code: 80, label: 'Rain showers' },
  { code: 95, label: 'Thunderstorm' }
];

function codeLabel(code) {
  const c = WEATHER_CODES.find((w) => w.code === code) || WEATHER_CODES[0];
  return c.label;
}

function simulate(district, dayOffset, seedBase) {
  const seed = hashSeed(`${district.id}:${dayOffset}:${seedBase}`);
  const monthIndex = new Date().getMonth();
  const monsoon = monthIndex >= 5 && monthIndex <= 8;
  const tBase = monsoon ? 24 + rand(seed % 101) * 3 : 21 + rand(seed % 101) * 6;
  const tMax = tBase + 6 + rand(seed % 197) * 3;
  const tMin = tBase - 5 - rand(seed % 313) * 2;
  const rainChance = monsoon ? 55 + rand(seed % 523) * 40 : rand(seed % 727) * 30;
  const rain = rainChance > 60 ? Math.round(rand(seed % 839) * (monsoon ? 28 : 6) * 10) / 10 : 0;
  return {
    date: null,
    tMax: Math.round(tMax * 10) / 10,
    tMin: Math.round(tMin * 10) / 10,
    rain,
    rainChance: Math.round(rainChance),
    et0: Math.round((3 + rand(seed % 977) * 3) * 10) / 10,
    windMax: Math.round((6 + rand(seed % 11) * 10) * 10) / 10,
    humidity: Math.round(45 + rand(seed % 131) * (monsoon ? 40 : 25)),
    code: rain > 12 ? 65 : rain > 0 ? 61 : rand(seed % 19) > 0.6 ? 2 : 0,
    label: ''
  };
}

function buildTips(district, current, days, lang) {
  const tips = [];
  const tomorrow = days[1] || days[0];
  const dayAfterTomorrow = days[2] || tomorrow;
  const nextRain = days.findIndex((d) => (d.rain || 0) > 2);

  if (current.soilMoistureHint !== undefined && current.soilMoistureHint < 35) {
    tips.push({
      en: 'Soil moisture is running low in this district — irrigate before 9 am to cut evaporation losses.',
      hi: 'इस जिले में मिट्टी की नमी कम है — वाष्पीकरण कम करने के लिए सुबह 9 बजे से पहले सिंचाई करें।',
      kn: 'ಈ ಜಿಲ್ಲೆಯಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಕಡಿಮೆಯಾಗಿದೆ — ತೇವಾಂಶ ನಷ್ಟ ಕಡಿಮೆ ಮಾಡಲು ಬೆಳಗ್ಗೆ 9ಕ್ಕಿಂತ ಮೊದಲು ನೀರು ಹಾಯಿಸಿ।',
      ta: 'இந்த மாவட்டத்தில் மண் ஈரப்பதம் குறைவு — ஆவியாதலைக் குறைக்க காலை 9க்கு முன் பாசனம் செய்யுங்கள்.',
      te: 'ఈ జిల్లాలో నేల తేమ తక్కువగా ఉంది — ఆవిరి నష్టం తగ్గించడానికి ఉదయం 9 లోపు నీటిపారుదల చేయండి.'
    });
  }
  if ((current.precipitation || 0) > 0 || (tomorrow && (tomorrow.rain || 0) > 2)) {
    tips.push({
      en: 'Rain expected within 36 hours — delay spraying and fertiliser application until the sky clears.',
      hi: '36 घंटों के भीतर बारिश की संभावना — आसमान साफ होने तक छिड़काव और खाद देना टालें।',
      kn: '36 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ — ಆಕಾಶ ಸ್ವಚ್ಛವಾಗುವವರೆಗೆ ಸಿಂಪರಣೆ ಮತ್ತು ಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ತಡೆಹಿಡಿಯಿರಿ।',
      ta: '36 மணி நேரத்திற்குள் மழை எதிர்பார்க்கப்படுகிறது — வானம் தெளிவாகும் வரை தெளிப்பு மற்றும் உரமிடலை தாமதிக்கவும்.',
      te: '36 గంటల్లో వర్షం అవకాశం — ఆకాశం శుభ్రమయ్యే వరకు పిచికారీ మరియు ఎరువు వాడకం ఆలస్యం చేయండి.'
    });
  }
  if ((current.temperature || 24) >= 33) {
    tips.push({
      en: 'Heat stress likely today — mulch young plants and schedule harvest for early morning.',
      hi: 'आज गर्मी का दबाव संभव — कम उम्र के पौधों पर आवरण डालें और कटाई सुबह जल्दी करें।',
      kn: 'ಇಂದು ಶಾಖದ ಒತ್ತಡ ಸಾಧ್ಯತೆ — ತರುಣ ಸಸ್ಯಗಳಿಗೆ ಹೊದಿಕೆ ಹಾಕಿ, ಕೊಯ್ಲು ಬೆಳಗ್ಗೆ ಮಾಡಿ।',
      ta: 'இன்று வெப்பப் பாதிப்பு வாய்ப்பு — இளம் செடிகளுக்குத் பாதுகாப்பு அடுக்கிட்டு, அறுவடையை அதிகாலையில் செய்யுங்கள்.',
      te: 'ఈరోజు వేడి ఒత్తిడి సాధ్యం — యువ మొక్కలకు కప్పు ఏర్పాటు చేసి, పంట కోత ఉదయాన్నే చేయండి.'
    });
  }
  if ((current.windSpeed || 8) >= 18) {
    tips.push({
      en: 'Strong wind forecast — do not spray today; drift will carry pesticide off-target.',
      hi: 'आज तेज़ हवा का पूर्वानुमान — आज छिड़काव न करें; दवा गलत जगह जाएगी।',
      kn: 'ಬಲವಾದ ಗಾಳಿಯ ಮುನ್ಸೂಚನೆ — ಇಂದು ಸಿಂಪರಣೆ ಮಾಡಬೇಡಿ; ಔಷಧ ಗುರಿ ತಪ್ಪಿ ಹರಡುತ್ತದೆ.',
      ta: 'வலுவான காற்று முன்னறிவிப்பு — இன்று தெளிக்க வேண்டாம்; மருந்து விலகி பரவும்.',
      te: 'బలమైన గాలి సూచన — ఈరోజు పిచికారీ చేయవద్దు; మందు లక్ష్యం తప్పి పడుతుంది.'
    });
  }
  if (nextRain >= 4 || nextRain === -1) {
    tips.push({
      en: 'A mostly dry week ahead — good window for top dressing and for harvesting the standing crop in ' + district.name + '.'
    });
  }
  return tips.map((tip) => ({ text: tip[lang] && lang !== 'en' && tip[lang] ? tip[lang] : tip.en, lang: tip[lang] ? lang : 'en' }))
    .filter((t) => typeof t.text === 'string');
}

export async function getWeather(regionId, districtId, lang = 'en') {
  const district = findDistrict(regionId, districtId);
  if (!district) return null;
  const dayOffsetBase = 0;
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const s = simulate(district, i, dayOffsetBase);
    const d = new Date(Date.now() + i * 86400000);
    s.date = d.toISOString().slice(0, 10);
    s.label = codeLabel(s.code);
    days.push(s);
  }

  let source = 'simulated';
  let current;
  let daily = null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lng}` +
      '&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,weather_code' +
      '&forecast_days=7&timezone=auto';
    const data = await fetchJson(url, {}, 6000);
    const c = data.current;
    current = {
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      windSpeed: c.wind_speed_10m,
      code: c.weather_code,
      label: codeLabel(c.weather_code),
      observedAt: c.time
    };
    daily = data.daily.time.map((t, i) => ({
      date: t,
      tMax: data.daily.temperature_2m_max[i],
      tMin: data.daily.temperature_2m_min[i],
      rain: data.daily.precipitation_sum[i],
      rainChance: data.daily.precipitation_probability_max[i],
      et0: data.daily.et0_fao_evapotranspiration[i],
      windMax: data.daily.wind_speed_10m_max[i],
      code: data.daily.weather_code[i],
      label: codeLabel(data.daily.weather_code[i])
    }));
    source = 'live';
  } catch (err) {
    current = {
      temperature: (days[0].tMax + days[0].tMin) / 2,
      humidity: days[0].humidity,
      precipitation: days[0].rain,
      windSpeed: days[0].windMax,
      code: days[0].code,
      label: days[0].label,
      observedAt: new Date().toISOString()
    };
    current.soilMoistureHint = 30;
  }

  const forecast = daily || days;
  const tips = buildTips(district, current, forecast, lang);

  return {
    district: { id: district.id, name: district.name, lat: district.lat, lng: district.lng },
    current,
    forecast,
    tips,
    source,
    fallbackReason: source === 'simulated' ? 'Live weather could not be reached; showing a seasonal simulation for this district.' : undefined
  };
}
