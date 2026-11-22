let statusCache = null;

export async function fetchVoiceStatus() {
  if (statusCache) return statusCache;
  try {
    const res = await fetch('/api/voice/status');
    statusCache = await res.json();
  } catch {
    statusCache = { configured: false, provider: 'browser' };
  }
  return statusCache;
}

export function browserSpeak(text, langCode = 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const langTag = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN' }[langCode] || 'en-IN';
  utter.lang = langTag;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === langTag) || voices.find((v) => v.lang.startsWith(langCode));
  if (match) utter.voice = match;
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
  return true;
}

export function browserStop() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

export async function serverSpeak(text, langCode) {
  const res = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, lang: langCode })
  });
  if (!res.ok) throw new Error(`TTS unavailable (${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
