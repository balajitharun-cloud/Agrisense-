import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AlertTriangle } from 'lucide-react';

export function Loading() {
  const { t } = useApp();
  return (
    <div className="state-view" role="status">
      <div className="spinner" aria-hidden="true" />
      <span className="small">{t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({ message }) {
  const { t } = useApp();
  return (
    <div className="state-view error-box" role="alert">
      <AlertTriangle size={22} aria-hidden="true" />
      <span>{message || t('common.error')}</span>
    </div>
  );
}

export function EmptyState({ message }) {
  const { t } = useApp();
  return (
    <div className="state-view empty-box">
      <span>{message || t('common.empty')}</span>
    </div>
  );
}

export function Card({ kicker, title, right, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || right || kicker) && (
        <div className="card-head">
          <div>
            {kicker ? <div className="card-kicker">{kicker}</div> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function PageHead({ kicker, title, subtitle, right }) {
  return (
    <div className="page-head">
      <div className="page-head-row">
        <div>
          <div className="kicker">{kicker}</div>
          <h1>{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <hr className="rule" />
    </div>
  );
}

export function StatTile({ label, value, unit, sub }) {
  return (
    <div className="card stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function DataState({ loading, error, empty, children }) {
  const { t } = useApp();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error.status === 0 ? `${t('common.error')} ${error.message}` : undefined} />;
  if (empty) return <EmptyState />;
  return children || null;
}
