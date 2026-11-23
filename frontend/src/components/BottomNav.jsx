import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CloudSun, ListTree, Leaf, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const PRIMARY = [
  { to: '/', icon: Home, key: 'overview.title' },
  { to: '/sensors', icon: CloudSun, key: 'nav.sensors' },
  { to: '/weather', icon: CloudSun, key: 'nav.weather' },
  { to: '/crops', icon: Leaf, key: 'nav.crops' }
];

export default function BottomNav({ onMore }) {
  const { t } = useApp();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {PRIMARY.map(({ to, icon: Icon, key }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Icon size={20} aria-hidden="true" />
          <span>{t(key) || to}</span>
        </NavLink>
      ))}
      <button type="button" className="bottom-nav-item" onClick={onMore}>
        <Menu size={20} aria-hidden="true" />
        <span>{t('nav.more')}</span>
      </button>
    </nav>
  );
}
