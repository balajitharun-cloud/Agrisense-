import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import useLivePrices from '../lib/useLivePrices.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead, StatTile } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';
import ZoneMap from '../components/ZoneMap.jsx';

export default function Overview() {
  const { t, fmtNum, fmtCurrency, fmtDate } = useApp();
  const navigate = useNavigate();

  const nodes = useData('/sensors/nodes');
  const meta = useData('/meta');
  const defaultNodeId = nodes.data ? nodes.data.defaultNode : null;

  const sensor = useData(defaultNodeId ? `/sensors/${defaultNodeId}` : '/sensors', [defaultNodeId]);
  const weather = useData('/weather?regionId=ka&districtId=ka-mysuru&lang=en');
  const satellite = useData('/satellite/soil?regionId=ka&districtId=ka-mysuru&lang=en');
  const crops = useData('/crops/recommend?regionId=ka&districtId=ka-mysuru&season=kharif&water=medium&lang=en');
  const gov = useData('/gov/announcements');
  const prices = useData('/marketplace/prices');
  const pricesLive = useLivePrices(prices.data);

  const node = sensor.data && sensor.data.node;
  const reading = sensor.data && sensor.data.reading;
  const latestGov = gov.data && gov.data.announcements[0];
  const movers = pricesLive
    ? [...pricesLive.prices].filter((p) => p.change !== 0).slice(0, 3)
    : [];
  const zone = satellite.data ? satellite.data.zone : 'Southern Dry Zone';

  const prose = node && reading && weather.data
    ? `${node.name}. ${t('overview.temp')} ${fmtNum(reading.temperature, 1)} degrees. ${t('overview.humidity')} ${fmtNum(reading.humidity)} percent. ${weather.data.current.label}. ${crops.data ? `${t('overview.topCrops')}: ${crops.data.recommendations.slice(0, 3).map((c) => c.name).join(', ')}.` : ''}`
    : '';

  return (
    <div className="page">
      <PageHead
        kicker={t('app.name')}
        title={t('overview.title')}
        subtitle={t('overview.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <div className="grid cols-4">
        <StatTile
          label={t('overview.temp')}
          value={reading ? fmtNum(reading.temperature, 1) : '—'}
          unit={reading ? '°C' : ''}
          sub={node ? node.name : ''}
        />
        <StatTile label={t('overview.humidity')} value={reading ? fmtNum(reading.humidity) : '—'} unit="%" />
        <StatTile label={t('overview.soilMoisture')} value={reading ? fmtNum(reading.soilMoisture) : '—'} unit="%" />
        <StatTile
          label={t('overview.npk')}
          value={reading ? `${fmtNum(reading.soilN)} · ${fmtNum(reading.soilP)} · ${fmtNum(reading.soilK)}` : '—'}
        />
      </div>

      <div className="grid cols-2 mt-6">
        <Card
          kicker={t('sensors.title')}
          title={t('overview.node')}
          right={nodes.data && !nodes.loading ? <SourceBadge source="simulated" /> : null}
        >
          <DataState loading={sensor.loading} error={sensor.error} empty={!node}>
            {node && (
              <div>
                <div className="metric-row">
                  <span className="metric-name">{node.crop}</span>
                  <span className="badge">{node.status}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-name">{t('satellite.subtitle')}</span>
                  {satellite.data ? (
                    <span className="mono">
                      NDVI {fmtNum(satellite.data.indices.ndvi, 2)} · {fmtNum(satellite.data.indices.soilMoisture)}%
                      <SourceBadge source={satellite.data.source} />
                    </span>
                  ) : (
                    <span className="mono">—</span>
                  )}
                </div>
                <p className="small mt-2">{t('common.simNote')}</p>
              </div>
            )}
          </DataState>
        </Card>

        <Card
          kicker={t('weather.title')}
          title={t('overview.weather')}
          right={weather.data ? <SourceBadge source={weather.data.source} /> : null}
        >
          <DataState loading={weather.loading} error={weather.error}>
            {weather.data && (
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('common.season')}</th>
                      <th>{t('overview.temp')}</th>
                      <th>{t('weather.rain')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weather.data.forecast.slice(0, 7).map((d) => (
                      <tr key={d.date}>
                        <td>{fmtDate(d.date, { weekday: 'short', day: 'numeric' })}</td>
                        <td className="mono">{fmtNum(d.tMin, 0)}–{fmtNum(d.tMax, 0)} °C</td>
                        <td className="mono">{fmtNum(d.rain, 1)} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataState>
        </Card>
      </div>

      <div className="map-strip mt-6">
        <Card
          kicker={t('group.advise')}
          title={t('zone.mapTitle')}
          right={<button className="btn ghost small" onClick={() => navigate(`crops?zone=${encodeURIComponent(zone)}`)}>
            {t('zone.openInCrops')}
          </button>}
        >
          <div className="overview-map-row">
            <ZoneMap compact selectedZone={zone} onSelect={(z) => navigate(`crops?zone=${encodeURIComponent(z)}`)} title={t('zone.mapTitle')} />
            <div className="overview-map-side">
              <div className="mono small">{zone}</div>
              <p className="small">{t('zone.mapHint')}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid cols-3 mt-6">
        <Card
          kicker={t('crops.title')}
          title={t('overview.topCrops')}
          right={crops.data ? <SourceBadge source={crops.data.source} /> : null}
        >
          <DataState loading={crops.loading} error={crops.error}>
            {crops.data && (
              <ol>
                {crops.data.recommendations.slice(0, 3).map((c) => (
                  <li key={c.id} className="metric-row" style={{ listStyle: 'none' }}>
                    <span>{c.name}</span>
                    <span className="mono score-strip">score {c.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </DataState>
        </Card>

        <Card
          kicker={t('gov.title')}
          title={t('overview.advisory')}
          right={latestGov ? <SourceBadge source="mock" /> : null}
        >
          <DataState loading={gov.loading} error={gov.error}>
            {latestGov && (
              <div>
                <h3 className="mt-2" style={{ fontSize: 'var(--fs-4)' }}>{latestGov.title}</h3>
                <p className="small mt-2">{latestGov.body}</p>
                <p className="small mono mt-2">
                  {fmtDate(latestGov.date)} · {latestGov.source}
                </p>
              </div>
            )}
          </DataState>
        </Card>

        <Card
          kicker={t('marketplace.title')}
          title={t('overview.movers')}
          right={movers.length ? (
            <span className="badge-row">
              <span className="small mono live-note">
                <span className="live-dot" aria-hidden="true" /> LIVE
              </span>
              <SourceBadge source="mock" />
            </span>
          ) : null}
        >
          <DataState loading={prices.loading} error={prices.error} empty={movers.length === 0}>
            {movers.map((p) => (
              <div className="metric-row" key={p.id}>
                <span className="metric-name">
                  {p.commodity}
                  <div className="small">{p.market}</div>
                </span>
                <span className="mono">
                  {fmtCurrency(p.price)}{' '}
                  <span className={p.change >= 0 ? 'up' : 'down'}>
                    {p.change >= 0 ? '▲' : '▼'} {fmtCurrency(Math.abs(p.change))}
                  </span>
                </span>
              </div>
            ))}
          </DataState>
        </Card>
      </div>

      <p className="small mono mt-6">{meta.data ? `${t('app.name')} v${meta.data.version} — ${t('app.tagline')}` : ''}</p>
    </div>
  );
}
