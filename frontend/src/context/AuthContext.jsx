import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../lib/api.js';

const STORAGE_TOKEN = 'agrisense-token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(STORAGE_TOKEN);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback((nextToken) => {
    setToken(nextToken);
    try {
      if (nextToken) window.localStorage.setItem(STORAGE_TOKEN, nextToken);
      else window.localStorage.removeItem(STORAGE_TOKEN);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setReady(true);
      return undefined;
    }
    apiGet('/account/me', token)
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) {
          persist(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [token, persist]);

  const value = useMemo(() => ({
    token,
    user,
    ready,
    async login(email, password) {
      const data = await apiPost('/auth/login', { email, password });
      persist(data.token);
      setUser(data.user);
      return data.user;
    },
    async register(payload) {
      const data = await apiPost('/auth/register', payload);
      persist(data.token);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      try {
        await apiPost('/auth/logout', {});
      } catch {
        /* ignore */
      }
      persist(null);
      setUser(null);
    },
    async updateProfile(patch) {
      const data = await apiPatch('/account/me', patch, token);
      setUser(data.user);
      return data.user;
    },
    async addFarm(farm) {
      const data = await apiPost('/account/farms', farm, token);
      setUser(data.user);
      return data.farm;
    },
    async refresh() {
      const data = await apiGet('/account/me', token);
      setUser(data.user);
    }
  }), [token, user, ready, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
