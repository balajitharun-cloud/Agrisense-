import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import SensorChart from '../components/SensorChart.jsx';

const METRIC_LABELS = {
  temperature: { key: 'overview.temp', unit: '°C' },
  humidity: { key: 'overview.humidity', unit: '%' },
  soilMoisture: { key: 'overview.soilMoisture', unit: '%' },
  soilN: { label: 'N', unit: 'kg/ha' },
  soilP: { label: 'P', unit: 'kg/ha' },
  soilK: { label: 'K', unit: 'kg/ha' }
};

const CHARTED = ['temperature', 'humidity', 'soilMoisture'];

export default function Sensors() {
  const { t, fmtNum, fmtDate } = useApp();
  const [params] = useSearchParams();
  const zoneParam = params.get('zone') || '';
  const [selected, setSelected] = useState(null);
  const [zoneFilter, setZoneFilter] = useState(null);
  const [chartPoints, setChartPoints] = useState(24);

  const nodesQ = useData('/sensors/nodes');
  const nodes = nodesQ.data ? nodesQ.data.nodes : [];

  const kaDistrictsQ = useData('/regions/ka/districts');
  const kaDistricts = kaDistrictsQ.data ? kaDistrictsQ.data.districts : [];

  const districtToZone = useMemo(
    () => Object.fromEntries(kaDistricts.map((dd) => [dd.id, dd.zone])),
    [kaDistricts]
  );
  const zoneList = useMemo(() => [...new Set(kaDistricts.map((dd) => dd.zone))], [kaDistricts]);

  const effectiveZone = zoneFilter === null ? zoneParam : zoneFilter;
  const filteredNodes = useMemo(() => {
    if (!effectiveZone) return nodes;
    return nodes.filter((n) => districtToZone[n.districtId] === effectiveZone);
  }, [nodes, effectiveZone, districtToZone]);

  const nodeId =
    selected && filteredNodes.some((n) => n.id === selected)
      ? selected
      : (filteredNodes[0] || {}).id || (nodesQ.data ? nodesQ.data.defaultNode : null);

  const detail = useData(nodeId ? `/sensors/${nodeId}` : '/sensors', [nodeId]);
  const history = useData(nodeId ? `/sensors/${nodeId}/history?points=${chartPoints}` : '/sensors', [nodeId, chartPoints]);

  const d = detail.data;
  const h = history.data ? history.data.history : [];

  return (
    <div className="page">
      <PageHead
        kicker={t('group.monitor')}
        title={t('sensors.title')}
        subtitle={t('sensors.subtitle')}
        right={<SourceBadge source="simulated" />}
      />

      <Card className="loc-bar">
        <div className="filters">
          <label className="field">
            <span className="small">{t('sensors.zone')}</span>
            <select
              value={effectiveZone}
              onChange={(e) => {
                setSelected(null);
                setZoneFilter(e.target.value);
              }}
            >
              <option value="">{t('sensors.allZones')}</option>
              {zoneList.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>
          {effectiveZone && <span className="badge">{effectiveZone}</span>}
        </div>
      </Card>

      <div className="split mt-6">
        <Card kicker={t('sensors.nodes')}>
          <DataState loading={nodesQ.loading} error={nodesQ.error} empty={filteredNodes.length === 0}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              {filteredNodes.map((n) => (
                <button
                  key={n.id}
                  className={`nav-item${n.id === nodeId ? ' active' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => setSelected(n.id)}
                >
                  <span>
                    <div>{n.name}</div>
                    <div className="small">{n.crop} · {n.status}</div>
                  </span>
                </button>
              ))}
            </div>
          </DataState>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', minWidth: 0 }}>
          <Card
            kicker={nodeId || ''}
            title={d ? d.node.name : t('sensors.readings')}
            right={<SourceBadge source="simulated" />}
          >
            <DataState loading={detail.loading} error={detail.error} empty={!d}>
              {d && (
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('sensors.metric')}</th>
                        <th>{t('sensors.min')}</th>
                        <th>{t('sensors.max')}</th>
                        <th>{t('sensors.unit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(d.thresholds).map(([key, th]) => {
                        const value = d.reading ? d.reading[key] : null;
                        const out = value !== null && (value < th.min || value > th.max);
                        const label = (METRIC_LABELS[key] && (METRIC_LABELS[key].key ? t(METRIC_LABELS[key].key) : METRIC_LABELS[key].label)) || key;
                        return (
                          <tr key={key}>
                            <td className="mono">{key}</td>
                            <td className="mono" style={{ color: out ? 'var(--alert)' : undefined }}>
                              {value === null ? '—' : fmtNum(value, key === 'temperature' ? 1 : 0)}
                            </td>
                            <td className="mono">{fmtNum(th.min)}</td>
                            <td className="mono">{fmtNum(th.max)}</td>
                            <td className="mono">{th.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </DataState>
          </Card>

          <Card title={t('sensors.alerts')}>
            <DataState loading={detail.loading} error={detail.error}>
              {d && d.alerts.length === 0 && <p className="small">{t('sensors.noAlerts')}</p>}
              {d && d.alerts.map((a, i) => (
                <div className={`alert-row${a.severity === 'warn' ? ' warn' : ''}`} key={i} style={{ marginBottom: 'var(--sp-2)' }}>
                  <span className="mono">{a.metric}: {fmtNum(a.value)} {a.unit}</span>
                  <span>{a.message}</span>
                </div>
              ))}
              {d && d.note && <p className="small mt-2">{d.note}</p>}
            </DataState>
          </Card>

          <Card
            title={t('sensors.history')}
            right={
              <label className="small" style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                {t('sensors.points')}
                <select
                  value={chartPoints}
                  onChange={(e) => setChartPoints(Number(e.target.value))}
                  aria-label="History points"
                >
                  {[12, 24, 48, 72].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            }
          >
            <DataState loading={history.loading} error={history.error} empty={h.length === 0}>
              <div className="sensors-charts">
                {CHARTED.map((key) => {
                  const label = (METRIC_LABELS[key] && (METRIC_LABELS[key].key ? t(METRIC_LABELS[key].key) : METRIC_LABELS[key].label)) || key;
                  const unit = METRIC_LABELS[key].unit;
                  const th = (d && d.thresholds && d.thresholds[key]) || {};
                  return (
                    <div className="sensor-chart-block" key={key}>
                      <div className="sensor-chart-head small">
                        <span>{label}</span>
                        <span className="mono">
                          {t('sensors.min')} {th.min !== undefined ? fmtNum(th.min) : '—'} · {t('sensors.max')} {th.max !== undefined ? fmtNum(th.max) : '—'} {unit}
                        </span>
                      </div>
                      <SensorChart data={h} dataKey={key} unit={unit} name={label} />
                      <div className="sensor-range mono small">
                        {fmtDate(h[0] ? h[0].recordedAt : null, { hour: '2-digit', minute: '2-digit' })} →{' '}
                        {fmtDate(h[h.length - 1] ? h[h.length - 1].recordedAt : null, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DataState>
          </Card>
        </div>
      </div>
    </div>
  );
}
