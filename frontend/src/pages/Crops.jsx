import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

export default function Crops() {
  const { t, fmtNum } = useApp();
  const [state, setState] = useState({ regionId: 'ka', districtId: 'ka-mysuru', season: 'kharif', water: 'medium' });

  const regionsQ = useData('/regions');
  const districts = useMemo(() => {
    if (!regionsQ.data) return [];
    const region = regionsQ.data.regions.find((r) => r.id === state.regionId);
    return region ? region.districts : [];
  }, [regionsQ.data, state.regionId]);

  const districtsQ = useData(`/regions/${state.regionId}/districts`, [state.regionId]);
  const districtObjs = districtsQ.data ? districtsQ.data.districts : [];
  const districtName = (districtObjs.find((d) => d.id === state.districtId) || {}).name || '';

  const rec = useData(
    `/crops/recommend?regionId=${state.regionId}&districtId=${state.districtId}&season=${state.season}&water=${state.water}&lang=en`,
    [state.regionId, state.districtId, state.season, state.water]
  );

  const prose = rec.data ? `${rec.data.summary} ${rec.data.recommendations.slice(0, 3).map((c) => c.name).join(', ')}.` : '';

  return (
    <div className="page">
      <PageHead
        kicker={t('group.advise')}
        title={t('crops.title')}
        subtitle={t('crops.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <Card>
        <div className="filters">
          <label className="field">
            <span className="small">{t('common.region')}</span>
            <select
              value={state.regionId}
              onChange={(e) => {
                const regionId = e.target.value;
                const nextDistrict = (regionsQ.data.regions.find((r) => r.id === regionId).districts[0]);
                setState({ ...state, regionId, districtId: nextDistrict });
              }}
            >
              {(regionsQ.data ? regionsQ.data.regions : []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('common.district')}</span>
            <select
              value={state.districtId}
              onChange={(e) => setState({ ...state, districtId: e.target.value })}
            >
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('common.season')}</span>
            <select value={state.season} onChange={(e) => setState({ ...state, season: e.target.value })}>
              {['kharif', 'rabi', 'summer'].map((s) => (
                <option key={s} value={s}>{t(`crops.season.${s}`)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('crops.water')}</span>
            <select value={state.water} onChange={(e) => setState({ ...state, water: e.target.value })}>
              {['low', 'medium', 'high'].map((w) => (
                <option key={w} value={w}>{t(`crops.water.${w}`)}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="mt-6" />

      <DataState loading={rec.loading || districtsQ.loading} error={rec.error || districtsQ.error}>
        {rec.data && (
          <>
            <Card kicker={districtName || state.districtId} title={t('crops.summary')} right={<SourceBadge source={rec.data.source} />}>
              <p>{rec.data.summary}</p>
              <p className="small mono">{rec.data.zone}</p>
            </Card>

            <div className="grid cols-3 mt-6">
              {rec.data.recommendations.map((c) => (
                <Card key={c.id} title={c.name} right={<span className="badge">{c.score}</span>}>
                  <p className="small">{c.yieldHint}</p>
                  <h3 className="mt-4" style={{ fontSize: 'var(--fs-3)' }}>{t('crops.rationale')}</h3>
                  <div className="mt-2">
                    {c.rationale.map((r) => (
                      <div className="metric-row" key={r.key}>
                        <span className="metric-name">
                          {r.label}: {r.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="small mt-2">{c.notes}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
