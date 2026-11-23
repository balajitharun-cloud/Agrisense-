import React, { useMemo } from 'react';
import { KA_ZONE_SHAPES, KA_ZONE_SHORT, KA_VIEWBOX, KA_OUTLINE_NOTE } from '../lib/kaMap.js';

const FILL_ORDER = [
  'var(--primary)', 'var(--ok)', 'var(--accent)', 'var(--clay)', 'var(--warn)',
  'var(--primary)', 'var(--ok)', 'var(--accent)', 'var(--clay)', 'var(--warn)'
];

export default function ZoneMap({ selectedZone, onSelect, zoneDistricts = {}, compact = false, title }) {
  const selected = useMemo(() => selectedZone || null, [selectedZone]);

  return (
    <figure className="zone-map" style={{ margin: 0 }}>
      <svg
        viewBox={KA_VIEWBOX}
        role="group"
        aria-label={title || 'Karnataka agro-climatic zone map'}
        style={{ width: '100%', maxHeight: compact ? 300 : 460, display: 'block' }}
      >
        <defs>
          <pattern id="zone-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" strokeWidth="1" />
          </pattern>
        </defs>
        {KA_ZONE_SHAPES.map((shape, i) => {
          const isSelected = selected === shape.zone;
          const count = zoneDistricts[shape.zone] || 0;
          return (
            <g key={shape.zone}>
              <polygon
                points={shape.points}
                fill={isSelected ? 'var(--primary)' : FILL_ORDER[i % FILL_ORDER.length]}
                fillOpacity={isSelected ? 1 : 0.55}
                stroke={isSelected ? 'var(--accent)' : 'var(--line-strong)'}
                strokeWidth={isSelected ? 2.4 : 1.2}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              />
              {onSelect && (
                <polygon
                  points={shape.points}
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={shape.zone}
                  onClick={() => onSelect(shape.zone)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(shape.zone); } }}
                  className="zone-hit"
                />
              )}
              {count > 0 && (
                <text
                  x={shape.label[0]}
                  y={shape.label[1]}
                  textAnchor="middle"
                  className="zone-label mono"
                  fontSize={compact ? 7 : 9}
                >
                  {KA_ZONE_SHORT[shape.zone]}
                </text>
              )}
              {count > 1 && !compact && (
                <text x={shape.label[0]} y={shape.label[1] + 11} textAnchor="middle" className="zone-label mono" fontSize={7}>
                  {count} districts
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="small zone-note">{KA_OUTLINE_NOTE}</figcaption>
    </figure>
  );
}
