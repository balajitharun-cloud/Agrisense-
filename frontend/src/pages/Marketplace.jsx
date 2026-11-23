import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useData } from '../lib/useData.js';
import useLivePrices from '../lib/useLivePrices.js';
import { SourceBadge } from '../components/SourceBadge.jsx';
import { Card, DataState, PageHead } from '../components/StateViews.jsx';

export default function Marketplace() {
  const { t, fmtCurrency, fmtNum } = useApp();
  const [tab, setTab] = useState('listings');
  const [category, setCategory] = useState('all');
  const [crop, setCrop] = useState('all');
  const [q, setQ] = useState('');

  const listingsQ = useData(
    `/marketplace/listings?category=${category}&crop=${crop}&q=${encodeURIComponent(q)}`,
    [category, crop, q]
  );
  const pricesQ = useData('/marketplace/prices');
  const live = useLivePrices(pricesQ.data);

  return (
    <div className="page">
      <PageHead
        kicker={t('group.connect')}
        title={t('marketplace.title')}
        subtitle={t('marketplace.subtitle')}
        right={<SourceBadge source={tab === 'listings' ? (listingsQ.data ? 'mock' : null) : (pricesQ.data ? 'mock' : null)} />}
      />

      <div className="tabs" role="tablist" aria-label="Marketplace sections">
        <button role="tab" aria-selected={tab === 'listings'} onClick={() => setTab('listings')}>
          {t('marketplace.inputs')}
        </button>
        <button role="tab" aria-selected={tab === 'prices'} onClick={() => setTab('prices')}>
          {t('marketplace.prices')}
        </button>
      </div>

      <div className="mt-6" />

      {tab === 'listings' && (
        <DataState loading={listingsQ.loading} error={listingsQ.error} empty={listingsQ.data && listingsQ.data.listings.length === 0}>
          {listingsQ.data && (
            <>
              <Card>
                <div className="filters">
                  <label className="field">
                    <span className="small">{t('common.filter')}</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                      <option value="all">{t('common.all')}</option>
                      {listingsQ.data.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="small">{t('marketplace.commodity')}</span>
                    <input
                      type="text"
                      placeholder="ragi, paddy, maize…"
                      value={crop === 'all' ? '' : crop}
                      onChange={(e) => setCrop(e.target.value || 'all')}
                      aria-label="Crop filter"
                    />
                  </label>
                  <label className="field" style={{ flex: 1, minWidth: 180 }}>
                    <span className="small">{t('common.search')}</span>
                    <input type="text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings" />
                  </label>
                </div>
              </Card>

              <div className="mt-6" />

              <Card>
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('nav.marketplace')}</th>
                        <th>{t('marketplace.category')}</th>
                        <th>{t('marketplace.price')}</th>
                        <th>{t('sensors.unit')}</th>
                        <th>{t('marketplace.seller')}</th>
                        <th>{t('marketplace.location')}</th>
                        <th>{t('marketplace.rating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listingsQ.data.listings.map((l) => (
                        <tr key={l.id}>
                          <td className="mono">{l.id}</td>
                          <td>{l.title}</td>
                          <td>{l.category}</td>
                          <td className="mono">{fmtCurrency(l.price)}</td>
                          <td className="mono">{l.unit}</td>
                          <td className="small">{l.seller}</td>
                          <td className="small">{l.location}</td>
                          <td className="mono">{fmtNum(l.rating, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </DataState>
      )}

      {tab === 'prices' && (
        <DataState loading={pricesQ.loading} error={pricesQ.error}>
          {pricesQ.data && (
            <Card
              right={
                <span className="badge-row">
                  <span className="small mono live-note">
                    <span className="live-dot" aria-hidden="true" /> LIVE · {t('common.updated')}{' '}
                    {live
                      ? live.updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '—'}
                  </span>
                  <SourceBadge source={pricesQ.data.source} />
                </span>
              }
            >
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('marketplace.commodity')}</th>
                      <th>{t('marketplace.variety')}</th>
                      <th>{t('marketplace.market')}</th>
                      <th>{t('sensors.unit')}</th>
                      <th>{t('marketplace.price')}</th>
                      <th>{t('marketplace.change')}</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(live ? live.prices : []).map((p) => (
                      <tr key={p.id}>
                        <td>{p.commodity}</td>
                        <td className="small">{p.variety}</td>
                        <td className="small">
                          {p.url ? (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="gov-link">
                              {p.market} {'↗'}
                            </a>
                          ) : (
                            p.market
                          )}
                        </td>
                        <td className="mono">{p.unit}</td>
                        <td className="mono">{fmtCurrency(p.price)}</td>
                        <td className="mono">
                          <span className={p.change >= 0 ? 'up' : 'down'}>
                            {p.change >= 0 ? '▲' : '▼'} {fmtCurrency(Math.abs(p.change))}
                          </span>
                        </td>
                        <td className="mono">
                          <span className={p.change >= 0 ? 'up' : 'down'}>
                            {p.changePct >= 0 ? '+' : ''}{fmtNum(p.changePct, 1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </DataState>
      )}
    </div>
  );
}
