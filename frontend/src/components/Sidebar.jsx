import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Radio, CloudSun, Satellite, Sprout,
  Shield, Store, Landmark, User
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const GROUPS = [
  {
    label: 'group.monitor',
    items: [
      { to: '/', key: 'nav.overview', Icon: LayoutDashboard },
      { to: '/sensors', key: 'nav.sensors', Icon: Radio },
      { to: '/weather', key: 'nav.weather', Icon: CloudSun },
      { to: '/satellite', key: 'nav.satellite', Icon: Satellite }
    ]
  },
  {
    label: 'group.advise',
    items: [
      { to: '/crops', key: 'nav.crops', Icon: Sprout },
      { to: '/protection', key: 'nav.protection', Icon: Shield }
    ]
  },
  {
    label: 'group.connect',
    items: [
      { to: '/marketplace', key: 'nav.marketplace', Icon: Store },
      { to: '/gov', key: 'nav.gov', Icon: Landmark },
      { to: '/account', key: 'nav.account', Icon: User }
    ]
  }
];

export default function Sidebar({ onNavigate, isDrawer = false }) {
  const { t } = useApp();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M9 24c4-10 10-14 15-15-1 6-3 13-9 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-name">{t('app.name')}</span>
          <div className="brand-sub">{t('app.tagline')}</div>
        </span>
      </div>
      {GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{t(group.label)}</div>
          {group.items.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onNavigate}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="nav-label-span">{t(key)}</span>
              {isDrawer && null}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
