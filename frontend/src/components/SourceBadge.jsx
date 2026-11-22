import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export function SourceBadge({ source = 'mock' }) {
  const { t } = useApp();
  const key = source === 'live' ? 'badge.live' : source === 'simulated' ? 'badge.simulated' : 'badge.mock';
  return (
    <span className={`badge ${source}`} title={`Source: ${source}`}>
      {t(key)}
    </span>
  );
}
