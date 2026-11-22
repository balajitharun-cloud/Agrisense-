import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translateKey } from '../i18n/strings.js';

const STORAGE_LANG = 'agrisense-lang';
const STORAGE_THEME = 'agrisense-theme';
const FALLBACK_LOCALE = 'en-IN';

function readStored(key, allowed, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => readStored(STORAGE_LANG, LANGUAGES.map((l) => l.code), 'en'));
  const [theme, setThemeState] = useState(() => readStored(STORAGE_THEME, ['light', 'dark'], 'light'));

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_LANG, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(STORAGE_THEME, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    const locale = meta.locale || FALLBACK_LOCALE;
    return {
      lang,
      setLang,
      theme,
      toggleTheme,
      locale,
      languages: LANGUAGES,
      t: (key) => translateKey(lang, key),
      fmtNum: (v, digits = 0) => {
        if (typeof v !== 'number' || Number.isNaN(v)) return '—';
        return new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
      },
      fmtCurrency: (v) => {
        if (typeof v !== 'number') return '—';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
      },
      fmtDate: (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        return new Intl.DateTimeFormat(locale, opts).format(d);
      }
    };
  }, [lang, theme, setLang, toggleTheme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
