import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getSession, endSession } from '../lib/accountStore.js';

const GateContext = createContext(null);

export function GateProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const enter = useCallback((next) => {
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    endSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, enter, signOut }), [session, enter, signOut]);

  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}

export function useGate() {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error('useGate must be used inside GateProvider');
  return ctx;
}
