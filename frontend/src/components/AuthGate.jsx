import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useGate } from '../context/GateContext.jsx';
import {
  createAccount,
  verifyAccount,
  unlockAdmin,
  validEmail
} from '../lib/accountStore.js';
import { Moon, Sun, Leaf } from 'lucide-react';

export default function AuthGate({ embedded = false }) {
  const { t, lang, setLang, theme, toggleTheme, languages } = useApp();
  const { enter } = useGate();

  const [tab, setTab] = useState('create');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setA = (k) => (e) => setAdminForm({ ...adminForm, [k]: e.target.value });

  async function submitAccount(e) {
    e.preventDefault();
    setErr('');
    const creating = tab === 'create';
    if (creating && form.name.trim().length < 2) return setErr(t('gate.errName'));
    if (!validEmail(form.email)) return setErr(t('gate.errEmail'));
    if (form.password.length < 6) return setErr(t('gate.errPass'));
    if (creating && form.password !== form.confirm) return setErr(t('gate.errMatch'));
    setBusy(true);
    try {
      const session = creating
        ? await createAccount({ name: form.name, email: form.email, phone: form.phone, password: form.password, preferredLanguage: lang })
        : await verifyAccount(form.email, form.password);
      enter(session);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAdmin(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const session = unlockAdmin(adminForm.username, adminForm.password);
      enter(session);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <div className="gate-card">
      <div className="gate-brand">
        <Leaf size={20} aria-hidden="true" />
        <span className="gate-brand-name">{t('app.name')}</span>
      </div>
      <h1 className="gate-title">{t(tab === 'admin' ? 'gate.adminTitle' : 'gate.welcome')}</h1>
      <p className="small gate-intro">{tab === 'admin' ? t('gate.adminNote') : t('gate.intro')}</p>

      <div className="seg-row gate-tabs" role="tablist" aria-label={t('gate.tabs')}>
        {[
          ['create', t('gate.tabCreate')],
          ['signin', t('gate.tabSignin')],
          ['admin', t('gate.tabAdmin')]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`seg-btn${tab === key ? ' active' : ''}`}
            onClick={() => {
              setTab(key);
              setErr('');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'admin' ? (
        <form className="gate-form" onSubmit={submitAdmin}>
          <label className="field">
            <span className="small">{t('gate.adminUser')}</span>
            <input
              type="text"
              value={adminForm.username}
              onChange={setA('username')}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span className="small">{t('account.password')}</span>
            <input
              type="password"
              value={adminForm.password}
              onChange={setA('password')}
              autoComplete="current-password"
              required
            />
          </label>
          {err ? <p className="form-err small" role="alert">{err}</p> : null}
          <button type="submit" className="btn primary gate-submit" disabled={busy}>
            {busy ? '…' : t('gate.adminBtn')}
          </button>
        </form>
      ) : (
        <form className="gate-form" onSubmit={submitAccount}>
          {tab === 'create' ? (
            <label className="field">
              <span className="small">{t('account.name')}</span>
              <input type="text" value={form.name} onChange={setF('name')} autoComplete="name" required />
            </label>
          ) : null}
          <label className="field">
            <span className="small">{t('account.email')}</span>
            <input
              type="email"
              value={form.email}
              onChange={setF('email')}
              autoComplete="username"
              required
            />
          </label>
          {tab === 'create' ? (
            <label className="field">
              <span className="small">{t('account.phone')}</span>
              <input type="tel" value={form.phone} onChange={setF('phone')} autoComplete="tel" />
            </label>
          ) : null}
          <label className="field">
            <span className="small">{t('account.password')}</span>
            <input
              type="password"
              value={form.password}
              onChange={setF('password')}
              autoComplete={tab === 'create' ? 'new-password' : 'current-password'}
              required
            />
          </label>
          {tab === 'create' ? (
            <label className="field">
              <span className="small">{t('gate.confirm')}</span>
              <input
                type="password"
                value={form.confirm}
                onChange={setF('confirm')}
                autoComplete="new-password"
                required
              />
            </label>
          ) : null}
          {err ? <p className="form-err small" role="alert">{err}</p> : null}
          <button type="submit" className="btn primary gate-submit" disabled={busy}>
            {busy ? '…' : tab === 'create' ? t('gate.createBtn') : t('gate.signinBtn')}
          </button>
        </form>
      )}

      <p className="small mono gate-note">{tab === 'admin' ? t('gate.adminLocal') : t('gate.localNote')}</p>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="gate">
      <div className="gate-bar">
        <div className="select-wrap">
          <select aria-label={t('account.language')} value={lang} onChange={(e) => setLang(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
        </div>
        <div className="spacer" />
        <button type="button" className="btn ghost small" onClick={toggleTheme} aria-label={theme === 'light' ? t('theme.dark') : t('theme.light')}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span className="hide-sm">{theme === 'light' ? t('theme.dark') : t('theme.light')}</span>
        </button>
      </div>
      {body}
    </div>
  );
}
