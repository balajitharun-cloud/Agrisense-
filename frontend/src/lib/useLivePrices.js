import { useEffect, useMemo, useState } from 'react';

function seeded(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function driftRow(p, tick) {
  const seed = p.id.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) * 97 + tick * 131 + p.price;
  const step = (seeded(seed) - 0.5) * 2;
  const wobble = Math.sin(tick * 0.7 + seed) * 0.25;
  const pct = (step + wobble) * 0.003;
  const price = Math.max(1, Math.round(p.price * (1 + pct)));
  const prevPrice = tick === 0 ? p.prevPrice : p.price;
  const change = price - prevPrice;
  const ref = prevPrice || price;
  return { ...p, price, change, changePct: (change / ref) * 100 };
}

export default function useLivePrices(data, intervalMs = 6000) {
  const [tick, setTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTick((x) => x + 1);
      setUpdatedAt(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return useMemo(() => {
    if (!data || !Array.isArray(data.prices)) return null;
    return { prices: data.prices.map((p) => driftRow(p, tick)), updatedAt };
  }, [data, tick, updatedAt]);
}
