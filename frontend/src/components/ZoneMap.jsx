import React from 'react';
import { KA_ZONE_SHAPES, KA_VIEWBOX } from '../lib/kaMap.js';
import { useApp } from '../context/AppContext.jsx';

const FILL_ORDER = [
  'var(--ok)', 'var(--accent)', 'var(--clay)', 'var(--primary)', 'var(--warn)',
  'var(--accent)', 'var(--ok)', 'var(--warn)', 'var(--primary)', 'var(--clay)'
];

export default function ZoneMap({ selectedZone, onSelect, compact = false, title }) {
  const { t } = useApp();
  return (
    <figure className="zone-map" style={compact ? { margin: 0 } : undefined}>
      <svg
        viewBox={KA_VIEWBOX}
        role="group"
        aria-label={title || t('zone.mapTitle')}
        style={{ width: '100%', display: 'block' }}
      >
        {KA_ZONE_SHAPES.map((shape, i) => {
          const isSelected = selectedZone === shape.zone;
          return (
            <g
              key={shape.zone}
              onClick={onSelect ? () => onSelect(shape.zone) : undefined}
              className={onSelect ? 'zone-hit' : undefined}
            >
              {shape.districts.map((d) => (
                <polygon
                  key={d.name}
                  points={d.points}
                  fill={FILL_ORDER[i % FILL_ORDER.length]}
                  fillOpacity={isSelected ? 0.92 : 0.45}
                  stroke={isSelected ? 'var(--accent)' : 'var(--line-strong)'}
                  strokeWidth={isSelected ? 1.4 : 0.5}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                >
                  <title>{`${d.name} — ${shape.short} Zone`}</title>
                </polygon>
              ))}
              {onSelect && (
                <polygon
                  points={shape.districts[0].points}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={shape.zone}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(shape.zone); } }}
                />
              )}
              <text
                x={shape.label[0]}
                y={shape.label[1]}
                textAnchor="middle"
                className="zone-label mono"
                fontSize={compact ? 6.5 : 7.5}
                stroke="var(--surface)"
                strokeWidth={compact ? 2 : 2.6}
                paintOrder="stroke"
                style={{ fontWeight: 600 }}
              >
                {shape.short}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="small zone-note">{t('zone.mapNote')}</figcaption>
    </figure>
  );
}
