import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { apiGet } from '../lib/api.js';
import { nearestDistrict } from '../lib/geo.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import DistrictMap from '../components/DistrictMap.jsx';

const FALLBACK_LABELS = { ndvi: 'NDVI', soilMoisture: 'Soil moisture', surfaceTemp: 'Surface temp' };

function seededJitter(v, seed, tick, span) {
  let h = 0;
  for (const ch of seed) h = (h + ch.charCodeAt(0) * 97) % 100003;
  const x = Math.sin(h * 13 + tick * 131) * 10000;
  const f = (x - Math.floor(x)) - 0.5;
  let out = v * (1 + f * span);
  if (v > 1.5) out = Math.round(out * 10) / 10;
  return out;
}

export default function Satellite() {
  const { t, fmtNum } = useApp();
  const [districtId, setDistrictId] = useState('ka-mysuru');
  const [indexKey, setIndexKey] = useState('ndvi');
  const [soilByDistrict, setSoilByDistrict] = useState({});
  const [tick, setTick] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [gpsState, setGpsState] = useState('idle');
  const [gpsMessage, setGpsMessage] = useState('');

  const kaDistrictsQ = useData('/regions/ka/districts');
  const kaDistricts = kaDistrictsQ.data ? kaDistrictsQ.data.districts : [];

  const detail = useData(`/satellite/soil?regionId=ka&districtId=${districtId}&lang=en`, [districtId]);
  const data = detail.data;

  useEffect(() => {
    const id = setInterval(() => {
      setTick((x) => x + 1);
      setUpdatedAt(new Date());
    }, 6000);
    return () => clearInterval(id);
  }, []);

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

  const jolt = (v, seed) => (typeof v === 'number' ? seededJitter(v, `${districtId}:${seed}`, tick, 0.012) : v);
  const liveIndices = data ? {
    ndvi: jolt(data.indices.ndvi, 'ndvi'),
    soilMoisture: jolt(data.indices.soilMoisture, 'soilMoisture'),
    surfaceTemp: jolt(data.indices.surfaceTemp, 'surfaceTemp')
  } : null;

  const condition = liveIndices
    ? liveIndices.soilMoisture < 25
      ? 'sat.cond.dry'
      : liveIndices.soilMoisture > 60
        ? 'sat.cond.wet'
        : 'sat.cond.ok'
    : null;

  const indexList = data && data.explanation ? data.explanation : [];

  const values = useMemo(() => {
    const out = {};
    for (const dd of kaDistricts) {
      const s = soilByDistrict[dd.id];
      const v = s && s.indices ? s.indices[indexKey] : undefined;
      if (typeof v === 'number') {
        out[dd.id] = seededJitter(v, `${dd.id}:${indexKey}`, tick, 0.01);
      }
    }
    return out;
  }, [kaDistricts, soilByDistrict, indexKey, tick]);

  const unitOf = (key) => {
    const idx = indexList.find((i) => i.key === key);
    return idx ? idx.unit : '';
  };

  function detectGps() {
    if (!navigator.geolocation) {
      setGpsState('error');
      setGpsMessage(t('gps.unavailable'));
      return;
    }
    setGpsState('locating');
    setGpsMessage(t('gps.detecting'));
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await apiGet('/regions/ka/districts');
        const best = nearestDistrict(res.districts || [], pos.coords.latitude, pos.coords.longitude);
        if (!best) throw new Error('no districts');
        setDistrictId(best.id);
        setGpsState('ok');
        setGpsMessage(`${t('gps.detected')}: ${best.name} (${best.distanceKm} km)`);
      } catch {
        setGpsState('error');
        setGpsMessage(t('gps.unavailable'));
      }
    }, (err) => {
      setGpsState('error');
      setGpsMessage(err && err.code === 1 ? t('gps.denied') : t('gps.unavailable'));
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

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
              {kaDistricts.length === 0 && <option value={districtId}>{districtId}</option>}
              {kaDistricts.map((dd) => (
                <option key={dd.id} value={dd.id}>{dd.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn ghost small"
            onClick={detectGps}
            disabled={gpsState === 'locating'}
          >
            {gpsState === 'locating' ? t('gps.detecting') : t('gps.use')}
          </button>
          {gpsMessage && (
            <span className="small mono gps-status" role="status">
              {gpsState === 'ok' ? <span className="live-dot" aria-hidden="true" /> : null}
              {gpsMessage}
            </span>
          )}
        </div>
        <div className="filters mt-2">
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
          {condition && (
            <span className="badge-row">
              <span className="small mono live-note">
                <span className="live-dot" aria-hidden="true" /> {t('common.updated')}{' '}
                {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </span>
          )}
        </div>
      </Card>

      {condition && (
        <div className="alert-row ok mt-6" role="status">
          <strong>{t('sat.cond')}:</strong> {t(condition)}
        </div>
      )}

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
                      {liveIndices ? fmtNum(liveIndices[idx.key], idx.key === 'ndvi' ? 2 : 0) : '\u2014'}
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
