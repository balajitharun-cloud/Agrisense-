import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { apiGet } from '../lib/api.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import DistrictMap from '../components/DistrictMap.jsx';

const FALLBACK_LABELS = { ndvi: 'NDVI', soilMoisture: 'Soil moisture', surfaceTemp: 'Surface temp' };

export default function Satellite() {
  const { t, fmtNum } = useApp();
  const [districtId, setDistrictId] = useState('ka-mysuru');
  const [indexKey, setIndexKey] = useState('ndvi');
  const [soilByDistrict, setSoilByDistrict] = useState({});

  const kaDistrictsQ = useData('/regions/ka/districts');
  const kaDistricts = kaDistrictsQ.data ? kaDistrictsQ.data.districts : [];

  const detail = useData(`/satellite/soil?regionId=ka&districtId=${districtId}&lang=en`, [districtId]);
  const data = detail.data;

  useEffect(() => {
    if (!kaDistricts.length) return undefined;
    let alive = true;
    (async () => {
      const results = await Promise.all(
        kaDistricts.map((dd) =>
          apiGet(`/satellite/soil?regionId=ka&districtId=${dd.id}&lang=en`).catch(() => null)
        )
      );
      if (!alive) return;
      const map = {};
      kaDistricts.forEach((dd, i) => {
        if (results[i] && results[i].indices) map[dd.id] = results[i];
      });
      setSoilByDistrict(map);
    })();
    return () => {
      alive = false;
    };
  }, [kaDistricts]);

  const indexList = data && data.explanation ? data.explanation : [];

  const values = useMemo(() => {
    const out = {};
    for (const dd of kaDistricts) {
      const s = soilByDistrict[dd.id];
      const v = s && s.indices ? s.indices[indexKey] : undefined;
      if (typeof v === 'number') out[dd.id] = v;
    }
    return out;
  }, [kaDistricts, soilByDistrict, indexKey]);

  const unitOf = (key) => {
    const idx = indexList.find((i) => i.key === key);
    return idx ? idx.unit : '';
  };

  return (
    <div className="page">
      <PageHead
        kicker={t('group.monitor')}
        title={t('satellite.title')}
        subtitle={t('satellite.subtitle')}
        right={data ? <SourceBadge source={data.source} /> : null}
      />

      <Card className="loc-bar">
        <div className="filters">
          <label className="field">
            <span className="small">{t('common.district')}</span>
            <select value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
              {kaDistricts.map((dd) => (
                <option key={dd.id} value={dd.id}>{dd.name}</option>
              ))}
            </select>
          </label>
          <div className="seg-row" role="group" aria-label={t('sat.map')}>
            {['ndvi', 'soilMoisture', 'surfaceTemp'].map((key) => (
              <button
                key={key}
                className={`seg-btn${indexKey === key ? ' active' : ''}`}
                onClick={() => setIndexKey(key)}
                aria-pressed={indexKey === key}
              >
                {indexList.find((i) => i.key === key)?.label || FALLBACK_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid cols-3 mt-6 sat-map-grid">
        <Card className="sat-map-card" kicker={t('satellite.title')} title={t('sat.map')}>
          <DataState loading={detail.loading} error={detail.error}>
            <DistrictMap
              values={values}
              selectedDistrictId={districtId}
              onSelect={setDistrictId}
              districtInfo={kaDistricts}
              indexKey={indexKey}
              unit={unitOf(indexKey)}
            />
            <p className="small mt-2">{t('sat.ramp')}</p>
          </DataState>
        </Card>

        <div className="sat-expl">
          <DataState loading={detail.loading} error={detail.error}>
            {data && data.note && (
              <div className="alert-row warn">
                {data.note}
              </div>
            )}
            {data && (
              <div className="grid cols-2">
                {data.explanation.map((idx) => (
                  <Card
                    key={idx.key}
                    kicker={idx.unit}
                    title={idx.label}
                    right={<span className="badge">{idx.level}</span>}
                  >
                    <div className="stat-value mono" style={{ fontSize: 'var(--fs-5)' }}>
                      {fmtNum(idx.value, idx.key === 'ndvi' ? 2 : 0)}
                    </div>
                    <hr className="rule" />
                    <h3 style={{ fontSize: 'var(--fs-3)' }}>{t('satellite.meaning')}</h3>
                    <p className="small mt-2">{idx.meaning}</p>
                    <h3 className="mt-4" style={{ fontSize: 'var(--fs-3)' }}>{t('satellite.action')}</h3>
                    <p className="small mt-2">{idx.advice}</p>
                  </Card>
                ))}
              </div>
            )}
          </DataState>
        </div>
      </div>
    </div>
  );
}
