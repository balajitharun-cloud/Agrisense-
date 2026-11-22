import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { browserSpeak, browserStop, fetchVoiceStatus, serverSpeak } from '../lib/speech.js';

let audioEl = null;

function stopAudio() {
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
}

export default function ListenButton({ text, className = '' }) {
  const { t, lang } = useApp();
  const [playing, setPlaying] = useState(false);
  const [ttsConfigured, setTtsConfigured] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchVoiceStatus().then((s) => {
      if (mounted.current) setTtsConfigured(Boolean(s && s.configured));
    });
    return () => {
      mounted.current = false;
      browserStop();
      stopAudio();
    };
  }, []);

  const onStop = () => {
    setPlaying(false);
    browserStop();
    stopAudio();
  };

  const onPlay = async () => {
    if (playing) {
      onStop();
      return;
    }
    setPlaying(true);
    try {
      if (ttsConfigured) {
        stopAudio();
        audioEl = new Audio(await serverSpeak(text, lang));
        audioEl.onended = () => setPlaying(false);
        await audioEl.play();
        return;
      }
      browserSpeak(text, lang);
    } catch {
      browserSpeak(text, lang);
    } finally {
      if (!ttsConfigured) setPlaying(false);
    }
  };

  return (
    <button className={`btn small listen-btn ${className}`} onClick={onPlay} aria-pressed={playing}>
      {playing ? (
        <>
          <span aria-hidden="true">■</span> {t('common.stop')}
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 1.5v9l8-4.5z" fill="currentColor" />
          </svg>
          {t('common.listen')}
        </>
      )}
    </button>
  );
}
