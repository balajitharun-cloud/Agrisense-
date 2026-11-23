import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext.jsx';

const AXIS = { fontSize: 10, fontFamily: 'JetBrains Mono, monospace' };

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  fontSize: 12,
  padding: '6px 10px',
  color: 'var(--ink)'
};

export default function TrendChart({ crop }) {
  const { t } = useApp();
  const data = [
    ...crop.history.map((h) => ({ label: String(h.year), index: h.productionIndex, kind: 'past' })),
    ...crop.forecast.map((f, i) => ({
      label: String(f.year),
      index: i === 0 ? crop.history[crop.history.length - 1].productionIndex : undefined,
      projIndex: f.productionIndex,
      kind: 'future'
    }))
  ];

  return (
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--line-strong)" tickLine={false} />
          <YAxis tick={AXIS} stroke="var(--line-strong)" tickLine={false} domain={['dataMin - 8', 'dataMax + 8']} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [v, name === 'index' ? t('zone.pastLabel') : t('zone.projected')]} labelStyle={{ color: 'var(--ink-2)' }} />
          <Area type="monotone" dataKey="index" stroke="var(--primary)" strokeWidth={2} fill="url(#trendfill)" connectNulls dot={{ r: 2.5, fill: 'var(--primary)', strokeWidth: 0 }} />
          <Area type="monotone" dataKey="projIndex" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" fill="none" connectNulls dot={{ r: 2.5, fill: 'var(--accent)', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="trend-legend small mono">
        <span className="legend-swatch past" /> {t('zone.pastLabel')}
        <span className="legend-swatch future" /> {t('zone.projected')}
      </div>
    </div>
  );
}
