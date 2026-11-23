import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

export default function Protection() {
  const { t } = useApp();
  const [pestId, setPestId] = useState(null);

  const pestsQ = useData('/pests?lang=en');
  const pestList = pestsQ.data ? pestsQ.data.pests : [];

  const pQuery = pestId ? `/pesticides?pestId=${pestId}&lang=en` : '/pesticides';
  const pQ = useData(pQuery, [pestId]);

  const selectedPest = pestList.find((p) => p.id === pestId);
  const prose = selectedPest
    ? `${selectedPest.name}: ${selectedPest.symptoms} ${t('protection.disclaimer')}`
    : `${t('protection.subtitle')}. ${t('protection.disclaimer')}`;

  return (
    <div className="page">
      <PageHead
        kicker={t('group.advise')}
        title={t('protection.title')}
        subtitle={t('protection.subtitle')}
        right={<ListenButton text={prose} />}
      />

      <div className="disclaimer" role="note">
        <AlertTriangle size={18} aria-hidden="true" style={{ flex: 'none', color: 'var(--warn-text)' }} />
        <span>{t('protection.disclaimer')}</span>
      </div>

      <DataState loading={pestsQ.loading} error={pestsQ.error}>
        <div className="grid cols-3 mt-6">
          {pestList.map((p) => (
            <Card
              key={p.id}
              title={p.name}
              right={<span className={`sev ${p.severity}`}>{p.severity}</span>}
              className={pestId === p.id ? 'active-card' : ''}
            >
              <p className="small">{p.symptoms}</p>
              <p className="small mt-2">
                <strong>{t('protection.affected')}: </strong>
                {p.crops.join(', ')}
              </p>
              <p className="small mono">{p.stage}</p>
              <button
                className="btn small mt-4"
                aria-pressed={pestId === p.id}
                onClick={() => setPestId(pestId === p.id ? null : p.id)}
              >
                {pestId === p.id ? t('common.filter') : t('protection.subtitle')}
              </button>
            </Card>
          ))}
        </div>
      </DataState>

      <div className="mt-6" />

      <DataState loading={pQ.loading} error={pQ.error}>
        {pQ.data && (
          <Card
            title={selectedPest ? `${selectedPest.name} — ${t('protection.dosage')}` : t('protection.title')}
            right={<SourceBadge source={pQ.data.source} />}
          >
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t('nav.protection')}</th>
                    <th>Formula</th>
                    <th>{t('protection.dosage')}</th>
                    <th>{t('protection.phi')}</th>
                    <th>{t('protection.toxicity')}</th>
                    <th>{t('protection.safety')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pQ.data.pesticides.map((p) => (
                    <tr key={p.id}>
                      <td>{p.product}<div className="small">{p.formulation}</div></td>
                      <td className="mono">{p.formula}</td>
                      <td className="mono">{p.dosePerAcre}</td>
                      <td className="mono">{p.phi} d</td>
                      <td className="small">{p.toxicityClass}</td>
                      <td className="small" style={{ maxWidth: 320 }}>{p.safety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </DataState>
    </div>
  );
}
