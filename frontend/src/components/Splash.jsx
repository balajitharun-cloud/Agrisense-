import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Splash({ onDone, duration = 2600 }) {
  const { t } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(onDone, reduced ? 700 : duration);
    return () => clearTimeout(id);
  }, [onDone, duration]);

  return (
    <div className="splash" role="status" aria-label={t('app.name')}>
      <div className="splash-inner">
        <svg className="splash-logo" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
          <circle className="splash-ring" cx="48" cy="48" r="44" fill="none" strokeWidth="2" />
          <path
            className="splash-stem"
            d="M48 78 C48 58 48 48 48 34"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="splash-leaf"
            d="M48 46 C48 30 60 22 74 22 C74 38 62 46 48 46 Z"
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            className="splash-leaf splash-leaf-2"
            d="M48 58 C48 46 38 40 26 40 C26 52 36 58 48 58 Z"
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path className="splash-soil" d="M30 82 H66" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        <div className="splash-wordmark">{t('app.name')}</div>
        <div className="splash-tagline">{t('splash.tagline')}</div>
        <div className="splash-status mono small">{t('splash.loading')}</div>
      </div>
      <button type="button" className="btn ghost small splash-skip" onClick={onDone}>
        {t('splash.skip')}
      </button>
    </div>
  );
}
