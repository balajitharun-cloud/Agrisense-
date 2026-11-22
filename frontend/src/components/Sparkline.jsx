import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext.jsx';

export default function Sparkline({ data, dataKey, unit = '', height = 160 }) {
  const { fmtNum } = useApp();
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--r-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem'
            }}
            labelFormatter={(i) => (data[i] && data[i].recordedAt ? new Date(data[i].recordedAt).toLocaleString() : '')}
            formatter={(v) => [`${fmtNum(v, 1)} ${unit}`.trim(), '']}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--primary)"
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
