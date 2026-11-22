import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

export default function Gov() {
  const { t, fmtDate } = useApp();
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');

  const regionsQ = useData('/regions');
  const q = useData(`/gov/announcements?region=${region}&category=${category}&level=${level}`, [region, category, level]);

  const list = q.data ? q.data.announcements : [];
  const prose = q.data && list.length
    ? `${t('gov.title')}. ${list[0].title}. ${list[0].body}`
    : '';

  return (
    <div className="page">
      <PageHead
        kicker={t('group.connect')}
        title={t('gov.title')}
        subtitle={t('gov.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <Card>
        <div className="filters">
          <label className="field">
            <span className="small">{t('common.region')}</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region filter">
              <option value="all">{t('common.all')}</option>
              {(regionsQ.data ? regionsQ.data.regions : []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('gov.category')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category filter">
              <option value="all">{t('common.all')}</option>
              {['advisory', 'scheme', 'price', 'insurance', 'finance'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small">{t('gov.level')}</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level filter">
              <option value="all">{t('common.all')}</option>
              <option value="central">{t('gov.central')}</option>
              <option value="state">{t('gov.state')}</option>
              <option value="district">{t('gov.district')}</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="mt-6" />

      <DataState loading={q.loading} error={q.error} empty={list.length === 0}>
        {q.data && (
          <div className="grid">
            {list.map((a) => (
              <Card key={a.id} title={a.title} right={<span className="badge">{a.level}</span>}>
                <p className="small mt-2">{a.body}</p>
                <p className="small mono mt-2">
                  {fmtDate(a.date)} · {a.source}
                </p>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}
