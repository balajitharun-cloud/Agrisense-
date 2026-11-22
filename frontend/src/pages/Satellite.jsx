import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';

export default function Satellite() {
  const { t, fmtNum } = useApp();
  const { data, loading, error } = useData('/satellite/soil?regionId=ka&districtId=ka-mysuru&lang=en');

  return (
    <div className="page">
      <PageHead
        kicker={t('group.monitor')}
        title={t('satellite.title')}
        subtitle={t('satellite.subtitle')}
        right={data ? <SourceBadge source={data.source} /> : null}
      />

      <DataState loading={loading} error={error}>
        {data && (
          <>
            {data.note && (
              <div className="alert-row warn" style={{ marginBottom: 'var(--sp-5)' }}>
                {data.note}
              </div>
            )}
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
          </>
        )}
      </DataState>
    </div>
  );
}
