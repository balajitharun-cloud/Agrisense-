import React, { useMemo } from 'react';
import { KA_ZONE_SHAPES, KA_VIEWBOX } from '../lib/kaMap.js';

const NAME_KEY = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const RAMPS = {
  ndvi: [
    [0, [138, 90, 43]],
    [0.5, [224, 195, 65]],
    [1, [47, 125, 79]]
  ],
  soilMoisture: [
    [0, [232, 227, 208]],
    [0.5, [91, 138, 166]],
    [1, [34, 72, 92]]
  ],
  surfaceTemp: [
    [0, [242, 230, 184]],
    [0.5, [217, 123, 47]],
    [1, [168, 50, 31]]
  ]
};

function lerpColor(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      const f = (t - t0) / (t1 - t0);
      return c0.map((c, j) => Math.round(c + f * (c1[j] - c0[j])));
    }
  }
  return stops[stops.length - 1][1];
}

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

export default function DistrictMap({
  values = {},
  selectedDistrictId,
  onSelect,
  districtInfo = [],
  indexKey = 'ndvi',
  unit = ''
}) {
  const stops = RAMPS[indexKey] || RAMPS.ndvi;

  const infoByName = useMemo(() => {
    const m = {};
    for (const d of districtInfo) m[NAME_KEY(d.name)] = d;
    return m;
  }, [districtInfo]);

  const zoneAverages = useMemo(() => {
    const sums = {};
    for (const shape of KA_ZONE_SHAPES) {
      for (const d of shape.districts) {
        const info = infoByName[NAME_KEY(d.name)];
        if (!info) continue;
        const v = values[info.id];
        if (typeof v === 'number') {
          if (!sums[shape.zone]) sums[shape.zone] = { total: 0, count: 0 };
          sums[shape.zone].total += v;
          sums[shape.zone].count += 1;
        }
      }
    }
    const out = {};
    for (const z of Object.keys(sums)) out[z] = sums[z].total / Math.max(1, sums[z].count);
    return out;
  }, [values, infoByName]);

  const numeric = Object.values(values).filter((v) => typeof v === 'number');
  const vMin = numeric.length ? Math.min(...numeric) : 0;
  const vMax = numeric.length ? Math.max(...numeric) : 1;
  const span = Math.max(vMax - vMin, 0.0001);

  const colorFor = (districtName, zone) => {
    const info = infoByName[NAME_KEY(districtName)];
    const direct = info ? values[info.id] : undefined;
    const v = typeof direct === 'number' ? direct : zoneAverages[zone];
    if (typeof v !== 'number') return null;
    return rgb(lerpColor(stops, (v - vMin) / span));
  };

  const rampGradient = `linear-gradient(90deg, ${stops
    .map(([t, c]) => `${rgb(c)} ${Math.round(t * 100)}%`)
    .join(', ')})`;

  return (
    <figure className="soil-map">
      <svg viewBox={KA_VIEWBOX} role="group" aria-label="District soil index map" style={{ width: '100%', display: 'block' }}>
        {KA_ZONE_SHAPES.map((shape) => (
          <g key={shape.zone}>
            {shape.districts.map((d) => {
              const info = infoByName[NAME_KEY(d.name)];
              const id = info ? info.id : null;
              const fill = colorFor(d.name, shape.zone);
              const isSelected = id && selectedDistrictId === id;
              return (
                <polygon
                  key={d.name}
                  points={d.points}
                  fill={fill || 'var(--surface-2)'}
                  fillOpacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? 'var(--ink)' : 'var(--line-strong)'}
                  strokeWidth={isSelected ? 1.6 : 0.5}
                  style={id && onSelect ? { cursor: 'pointer' } : undefined}
                  onClick={id && onSelect ? () => onSelect(id) : undefined}
                >
                  <title>
                    {`${d.name}${id ? '' : ' (zonal average)'}${fill ? '' : ' — no data'}`}
                  </title>
                </polygon>
              );
            })}
          </g>
        ))}
      </svg>
      <figcaption className="soil-legend small mono">
        <span className="mono">{Number(vMin.toFixed(2))}</span>
        <span
          className="soil-legend-bar"
          style={{ background: rampGradient }}
          aria-hidden="true"
        />
        <span className="mono">{Number(vMax.toFixed(2))} {unit}</span>
      </figcaption>
    </figure>
  );
}
