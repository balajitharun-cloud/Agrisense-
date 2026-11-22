import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, UserCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ onMenu }) {
  const { t, lang, setLang, theme, toggleTheme, languages } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="btn ghost menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="select-wrap">
        <select
          aria-label={t('account.language')}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </select>
      </div>
      <div className="spacer" />
      <button
        className="btn ghost"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        title={theme === 'light' ? 'Dark' : 'Light'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        <span className="hide-sm">{theme === 'light' ? 'Dark' : 'Light'}</span>
      </button>
      {user ? (
        <>
          <button
            className="btn ghost"
            onClick={() => navigate('/account')}
            title={user.email}
          >
            <UserCircle2 size={18} />
            <span className="hide-sm mono small">{user.name}</span>
          </button>
          <button
            className="btn small"
            onClick={async () => {
              await logout();
              navigate('/account');
            }}
          >
            <LogOut size={14} />
            {t('account.logout')}
          </button>
        </>
      ) : (
        <button className="btn primary small" onClick={() => navigate('/account')}>
          {t('account.login')}
        </button>
      )}
    </header>
  );
}
