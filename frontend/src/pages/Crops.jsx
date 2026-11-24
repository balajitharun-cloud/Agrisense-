import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { apiPost } from '../lib/api.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import ListenButton from "../components/ListenButton.jsx";
import ZoneMap from '../components/ZoneMap.jsx';
import TrendChart from '../components/TrendChart.jsx';

const VERDICT_ICON = { rising: TrendingUp, stable: Minus, watch: TrendingDown };

export default function Crops() {
  const { t, fmtNum } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState({
    regionId: 'ka',
    districtId: params.get('district') || 'ka-mysuru',
    season: params.get('season') || 'kharif',
    water: params.get('water') || 'medium'
  });
  const [zone, setZone] = useState(params.get('zone') || 'Southern Dry Zone');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [adv, setAdv] = useState(null);
  const [advBusy, setAdvBusy] = useState(false);

  const regionsQ = useData('/regions');
  const kaDistrictsQ = useData('/regions/ka/districts');
  const allKaDistricts = kaDistrictsQ.data ? kaDistrictsQ.data.districts : [];

  const zones = useMemo(() => {
    const map = {};
    for (const d of allKaDistricts) {
      map[d.zone] = map[d.zone] === undefined ? [d.id] : [...map[d.zone], d.id];
    }
    return map;
  }, [allKaDistricts]);

  const trendsQ = useData(
    `/crops/zone-trends?regionId=ka&zone=${encodeURIComponent(zone)}&season=${state.season}&lang=en`,
    [zone, state.season]
  );

  const districts = useMemo(() => {
    if (!regionsQ.data) return [];
    const region = regionsQ.data.regions.find((r) => r.id === state.regionId);
    return region ? region.districts : [];
  }, [regionsQ.data, state.regionId]);

  const districtsQ = useData(`/regions/${state.regionId}/districts`, [state.regionId]);
  const districtObjs = districtsQ.data ? districtsQ.data.districts : [];
  const kaNamed = useMemo(() => Object.fromEntries(allKaDistricts.map((d) => [d.id, d.name])), [allKaDistricts]);
  const districtName = (districtObjs.find((d) => d.id === state.districtId) || {}).name
    || kaNamed[state.districtId]
    || state.districtId.replace(/^ka-/, '').replace(/-/g, ' ');

  const rec = useData(
    `/crops/recommend?regionId=${state.regionId}&districtId=${state.districtId}&season=${state.season}&water=${state.water}&lang=en`,
    [state.regionId, state.districtId, state.season, state.water]
  );

  const zoneDistrictIds = zones[zone] || [];
  const crops = trendsQ.data && trendsQ.data.crops ? trendsQ.data.crops : [];
  const focus = crops.find((c) => c.id === selectedCrop) || crops[0] || null;

  const prose = trendsQ.data && crops.length
    ? `Top crops in ${zone}: ${crops.slice(0, 3).map((c) => c.name).join(', ')}. ${focus ? `${focus.name}: ${focus.verdictReason}` : ''}`
    : '';

  function localAdvisory() {
    const r = rec.data;
    if (!r) return null;
    const lead = r.recommendations && r.recommendations[0];
    if (!lead) return r.summary || null;
    const waterRation = (lead.rationale.find((x) => x.key === 'water') || {}).text;
    const marketRation = (lead.rationale.find((x) => x.key === 'market') || {}).text;
    const parts = [
      r.summary,
      waterRation ? `${waterRation}.` : '',
      marketRation ? `${marketRation}.` : '',
      lead.waterOk === false ? 'Water availability is tight: irrigate at dawn and mulch to hold soil moisture.' : (lead.yieldHint ? lead.yieldHint + '.' : '')
    ].filter(Boolean);
    return parts.join(' ').slice(0, 900);
  }

  async function writeAdvisory() {
    if (advBusy) return;
    setAdvBusy(true);
    try {
      const res = await apiPost('/ai/advisory', {
        regionId: state.regionId,
        districtId: state.districtId,
        zone,
        season: state.season,
        water: state.water,
        lang: 'en'
      });
      if (res && res.advisory) setAdv({ text: res.advisory, source: res.source });
    } catch {
      const text = localAdvisory();
      if (text) setAdv({ text, source: 'simulated' });
    } finally {
      setAdvBusy(false);
    }
  }

  function setSeason(season) {
    setState({ ...state, season });
    setSelectedCrop(null);
  }
  function pickZone(z) {
    setZone(z);
    setSelectedCrop(null);
    const ids = zones[z] || [];
    setParams({});
    if (ids.length) setState({ ...state, regionId: 'ka', districtId: ids[0] });
  }

  return (
    <div className="page">
      <PageHead
        kicker={t('group.advise')}
        title={t('crops.title')}
        subtitle={t('crops.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <DataState loading={kaDistrictsQ.loading} error={kaDistrictsQ.error}>
        {allKaDistricts.length > 0 && (
          <div className="zone-grid">
            <Card className="zone-map-card" kicker={t('group.advise')} title={t('zone.mapTitle')}>
              <ZoneMap
                selectedZone={zone}
                onSelect={pickZone}
                title={t('zone.mapTitle')}
              />
            </Card>
            <Card className="zone-side-card" kicker={zone} title={trendsQ.data && trendsQ.data.description}>
              <div className="zone-meta mono small">
                {trendsQ.data ? `${trendsQ.data.seasonWindow}` : ''}
                {' · '}{zoneDistrictIds.length} {t('common.districts') || 'districts'}
              </div>
              <div className="zone-side-actions">
                <button
                  className="btn ghost small"
                  onClick={() => navigate(`/sensors?zone=${encodeURIComponent(zone)}`)}
                >
                  {t('zone.viewSensors')}
                </button>
              </div>
              <div className="zone-district-list">
                {zoneDistrictIds.map((id) => (
                  <button
                    key={id}
                    className={`zone-chip ${state.districtId === id ? 'active' : ''}`}
                    onClick={() => { setState({ ...state, regionId: 'ka', districtId: id }); setParams({}); }}
                  >
                    {kaNamed[id] || id.replace(/^ka-/, '').replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </DataState>

      <div className="mt-6" />

      <DataState loading={trendsQ.loading} error={trendsQ.error}>
        {crops.length > 0 && (
          <Card
            title={t('zone.top10')}
            kicker={zone}
            right={<SourceBadge source={trendsQ.data.source} />}
          >
            <div className="table-scroll">
              <table className="data zone-crop-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('common.crop')}</th>
                    <th className="num">{t('zone.areaShare')}</th>
                    <th className="num">{t('zone.sixYearDelta')}</th>
                    <th>{t('zone.verdict')}</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((c) => {
                    const Icon = VERDICT_ICON[c.verdict] || Minus;
                    return (
                      <tr
                        key={c.id}
                        className={focus && focus.id === c.id ? 'active-row' : ''}
                        onClick={() => setSelectedCrop(c.id)}
                      >
                        <td className="mono">{c.rank}</td>
                        <td>{c.name}</td>
                        <td className="mono">{fmtNum(c.areaShare)}%</td>
                        <td className="mono">
                          <span className="trend-delta">
                            <Icon size={13} aria-hidden="true" style={{ flex: 'none' }} />
                            {c.slopePct >= 0 ? '+' : ''}{fmtNum(c.slopePct)}%
                          </span>
                        </td>
                        <td><span className={`badge sev ${c.verdict === 'rising' ? 'low' : c.verdict === 'stable' ? 'medium' : 'high'}`}>{t(`zone.${c.verdict}`)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </DataState>

      <div className="mt-6" />

      <DataState loading={trendsQ.loading} error={trendsQ.error}>
        {focus && (
          <Card
            kicker={t('zone.trendsTitle')}
            title={focus.name}
            right={<span className={`badge sev ${focus.verdict === 'rising' ? 'low' : focus.verdict === 'stable' ? 'medium' : 'high'}`}>{t(`zone.${focus.verdict}`)}</span>}
          >
            <TrendChart crop={focus} />
            <div className="trend-phases">
              <div className="trend-phase">
                <h3 className="small mono">{t('zone.past')}</h3>
                <p className="small">{focus.verdictReason}</p>
              </div>
              <div className="trend-phase">
                <h3 className="small mono">{t('zone.current')}</h3>
                <p className="small">
                  <span className="mono">{t('zone.priceIndex')}: {fmtNum(focus.current.priceIndex)}</span> ·{' '}
                  <span className="mono">{t('zone.yieldSignal')}: {fmtNum(focus.current.yieldSignal)}</span> ·{' '}
                  <span className="mono">{t('common.season')}: {state.season}</span>
                </p>
                <p className="small">{focus.note}</p>
              </div>
              <div className="trend-phase">
                <h3 className="small mono">{t('zone.future')}</h3>
                <p className="small">{focus.outlook}</p>
              </div>
            </div>
          </Card>
        )}
      </DataState>

      <div className="mt-6" />

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
              {(regionsQ.data ? regionsQ.data.regions : []).filter((r) => r.id === 'ka').map((r) => (
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
                <option key={d} value={d}>{kaNamed[d] || d.replace(/^[a-z]{2}-/, '').replace(/-/g, ' ')}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('common.season')}</span>
            <select value={state.season} onChange={(e) => setSeason(e.target.value)}>
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

      <div className="mt-6" />

      <Card
        kicker="AI"
        title={t('ai.advisoryTitle')}
        right={adv ? <SourceBadge source={adv.source} /> : null}
      >
        {!adv && !advBusy && (
          <p className="small">{t('ai.advisoryEmpty')}</p>
        )}
        {advBusy && <p className="small mono">{t('ai.advisoryWriting')}</p>}
        {adv && !advBusy && (
          <>
            <p>{adv.text}</p>
            <p className="small mt-2" style={{ color: 'var(--ink-2)' }}>{t('ai.advisoryNote')}</p>
            <div className="mt-2">
              <ListenButton text={adv.text} />
            </div>
          </>
        )}
        <div className="mt-4">
          <button className="btn small" type="button" disabled={advBusy} onClick={writeAdvisory}>
            {t('ai.advisoryBtn')}
          </button>
        </div>
      </Card>
    </div>
  );
}
