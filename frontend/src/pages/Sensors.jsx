import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import Sparkline from '../components/Sparkline.jsx';

const METRIC_LABELS = {
  temperature: { key: 'overview.temp', unit: '°C' },
  humidity: { key: 'overview.humidity', unit: '%' },
  soilMoisture: { key: 'overview.soilMoisture', unit: '%' },
  soilN: { label: 'N', unit: 'kg/ha' },
  soilP: { label: 'P', unit: 'kg/ha' },
  soilK: { label: 'K', unit: 'kg/ha' }
};

export default function Sensors() {
  const { t, fmtNum, fmtDate } = useApp();
  const [selected, setSelected] = useState(null);
  const [chartPoints, setChartPoints] = useState(24);

  const nodesQ = useData('/sensors/nodes');
  const nodes = nodesQ.data ? nodesQ.data.nodes : [];
  const nodeId = selected || (nodesQ.data ? nodesQ.data.defaultNode : null);

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

      <div className="split">
        <Card kicker={t('sensors.nodes')}>
          <DataState loading={nodesQ.loading} error={nodesQ.error}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              {nodes.map((n) => (
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
                        <th>{t('sensors.readings')}</th>
                        <th>min</th>
                        <th>max</th>
                        <th>unit</th>
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
                points
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
              <div className="table-scroll">
                <table className="data">
                  <tbody>
                    {[
                      { key: 'temperature', label: t('overview.temp'), unit: '°C' },
                      { key: 'humidity', label: t('overview.humidity'), unit: '%' },
                      { key: 'soilMoisture', label: t('overview.soilMoisture'), unit: '%' }
                    ].map((row) => (
                      <tr key={row.key}>
                        <td style={{ minWidth: 120 }}>{row.label}</td>
                        <td style={{ minWidth: 260 }}>
                          <Sparkline data={h} dataKey={row.key} unit={row.unit} />
                        </td>
                        <td className="mono small">
                          {fmtDate(h[0] ? h[0].recordedAt : null, { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {fmtDate(h[h.length - 1] ? h[h.length - 1].recordedAt : null, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </Card>
        </div>
      </div>
    </div>
  );
}
