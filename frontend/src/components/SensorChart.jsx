import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AXIS = { fontSize: 10, fontFamily: 'JetBrains Mono, monospace' };

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  fontSize: 12,
  padding: '6px 10px',
  color: 'var(--ink)'
};

export default function SensorChart({ data, dataKey, unit = '', name = '', height = 170 }) {
  const rows = (data || [])
    .filter((r) => r && r[dataKey] !== undefined && r[dataKey] !== null)
    .map((r) => ({
      label: new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r[dataKey]
    }));

  return (
    <div className="sensors-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--line-strong)" tickLine={false} minTickGap={28} />
          <YAxis
            tick={AXIS}
            stroke="var(--line-strong)"
            tickLine={false}
            width={44}
            domain={['auto', 'auto']}
            unit={unit === '%' ? '%' : ''}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'var(--ink-2)' }}
            formatter={(v) => [`${v}${unit === '%' ? '%' : ` ${unit}`}`.trim(), name || unit]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--alert)"
            strokeWidth={2}
            strokeDasharray=""
            dot={false}
            activeDot={{ r: 3, fill: 'var(--alert)', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="trend-legend small mono">
        <span className="legend-swatch sensors-line" /> {name || unit}
      </div>
    </div>
  );
}
