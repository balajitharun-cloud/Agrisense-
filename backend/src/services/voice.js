import { httpFetch } from './http.js';

export function voiceStatus() {
  const configured = Boolean(process.env.ELEVENLABS_API_KEY);
  return {
    configured,
    provider: configured ? 'elevenlabs' : 'browser',
    model: process.env.ELEVENLABS_MODEL || (configured ? 'eleven_multilingual_v2' : null),
    voiceId: process.env.ELEVENLABS_VOICE_ID || (configured ? '21m00Tcm4TlvDq8ikWAM' : null),
    note: configured
      ? 'Server-side ElevenLabs TTS is available; the API key never leaves the server.'
      : 'No ELEVENLABS_API_KEY set. POST /voice/tts returns 501; the UI falls back to the browser Web Speech API.'
  };
}

export async function synthesize({ text, voiceId: requestedVoice, lang }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !text) return null;
  const voiceId = requestedVoice || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  void lang;
  const res = await httpFetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model })
  }, 20000);
  if (!res.ok) throw new Error(`ElevenLabs request failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

