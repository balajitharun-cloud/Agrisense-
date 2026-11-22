import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead, StatTile } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

export default function Weather() {
  const { t, fmtNum } = useApp();
  const { data, loading, error } = useData('/weather?regionId=ka&districtId=ka-mysuru&lang=en');

  const prose = data
    ? `${data.district.name}: ${t('overview.temp')} ${fmtNum(data.current.temperature, 1)}°C, ${data.current.label}. ${data.tips.map((tip) => tip.text).join(' ')}`
    : '';

  return (
    <div className="page">
      <PageHead
        kicker={t('group.monitor')}
        title={t('weather.title')}
        subtitle={t('weather.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <DataState loading={loading} error={error}>
        {data && (
          <>
            {data.fallbackReason ? (
              <div className="alert-row warn" style={{ marginBottom: 'var(--sp-5)' }}>
                <span className="badge simulated">{t('badge.simulated')}</span>
                {data.fallbackReason}
              </div>
            ) : null}

            <div className="grid cols-4">
              <StatTile label={t('overview.temp')} value={fmtNum(data.current.temperature, 1)} unit="°C" sub={data.current.label} />
              <StatTile label={t('overview.humidity')} value={fmtNum(data.current.humidity)} unit="%" />
              <StatTile label={t('weather.rain')} value={fmtNum(data.current.precipitation, 1)} unit="mm" />
              <StatTile label={t('weather.wind')} value={fmtNum(data.current.windSpeed, 1)} unit="km/h" />
            </div>

            <div className="grid cols-2 mt-6">
              <Card kicker={data.district.name} title={t('weather.forecast')} right={<SourceBadge source={data.source} />}>
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>{t('common.season')}</th>
                        <th>min/max °C</th>
                        <th>{t('weather.rain')} mm</th>
                        <th>%</th>
                        <th>{t('weather.et0')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.forecast.map((d) => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td className="mono">{fmtNum(d.tMin, 1)} – {fmtNum(d.tMax, 1)}</td>
                          <td className="mono">{fmtNum(d.rain, 1)}</td>
                          <td className="mono">{fmtNum(d.rainChance)}</td>
                          <td className="mono">{d.et0 !== undefined ? fmtNum(d.et0, 1) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title={t('weather.tips')} right={<SourceBadge source={data.source} />}>
                <div className="form-grid">
                  {data.tips.map((tip, i) => (
                    <div className="metric-row" key={i}>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                  {data.tips.length === 0 && <p className="small">—</p>}
                </div>
              </Card>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
