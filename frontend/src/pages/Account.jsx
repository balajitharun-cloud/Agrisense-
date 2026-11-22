import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../lib/useData.js';
import { DataState, Card, PageHead } from '../components/StateViews.jsx';

export default function Account() {
  const { t } = useApp();
  const auth = useAuth();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [profile, setProfile] = useState(null);
  const [farm, setFarm] = useState({ label: '', region: 'ka', district: '', area: '', primaryCrop: '' });

  const regionsQ = useData('/regions');
  const regionList = regionsQ.data ? regionsQ.data.regions : [];

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submitAuth(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await auth.login(form.email, form.password);
      } else {
        await auth.register({ email: form.email, password: form.password, name: form.name, phone: form.phone });
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setMode('login');
    setForm({ ...form, email: 'demo@agrisense.in', password: 'demo1234' });
  }

  if (!auth.user) {
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <PageHead kicker={t('app.name')} title={t('account.title')} subtitle={t('account.subtitle')} />
        <Card>
          <form className="form-grid" onSubmit={submitAuth}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label htmlFor="acc-name">{t('account.name')}</label>
                  <input id="acc-name" type="text" value={form.name} onChange={setF('name')} required />
                </div>
                <div className="field">
                  <label htmlFor="acc-phone">{t('account.phone')}</label>
                  <input id="acc-phone" type="tel" value={form.phone} onChange={setF('phone')} />
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="acc-email">{t('account.email')}</label>
              <input id="acc-email" type="email" value={form.email} onChange={setF('email')} required autoComplete="username" />
            </div>
            <div className="field">
              <label htmlFor="acc-password">{t('account.password')}</label>
              <input
                id="acc-password"
                type="password"
                value={form.password}
                onChange={setF('password')}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {err && <span className="field err">{err}</span>}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? '…' : mode === 'login' ? t('account.login') : t('account.register')}
              </button>
              <button type="button" className="btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? t('account.register') : t('account.login')}
              </button>
              <button type="button" className="btn ghost" onClick={fillDemo}>
                {t('account.demo')}
              </button>
            </div>
          </form>
          <p className="small mt-4">{t('account.notDurable')}</p>
        </Card>
      </div>
    );
  }

  const user = profile || auth.user;

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await auth.updateProfile({
        name: user.name,
        phone: user.phone,
        region: user.region,
        district: user.district,
        preferredLanguage: user.preferredLanguage
      });
      setProfile(updated);
    } finally {
      setBusy(false);
    }
  }

  async function addFarm(e) {
    e.preventDefault();
    await auth.addFarm(farm);
    setFarm({ label: '', region: 'ka', district: '', area: '', primaryCrop: '' });
  }

  return (
    <div className="page">
      <PageHead
        kicker={t('group.connect')}
        title={t('account.title')}
        subtitle={`${t('account.signedInAs')}: ${user.email}`}
      />

      <div className="grid cols-2">
        <Card title={t('account.profile')}>
          <form className="form-grid" onSubmit={saveProfile}>
            <div className="form-grid cols-2">
              <div className="field">
                <label htmlFor="p-name">{t('account.name')}</label>
                <input id="p-name" type="text" value={user.name} onChange={(e) => setProfile({ ...user, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="p-phone">{t('account.phone')}</label>
                <input id="p-phone" type="tel" value={user.phone || ''} onChange={(e) => setProfile({ ...user, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-grid cols-2">
              <label className="field">
                <span className="small">{t('common.region')}</span>
                <select value={user.region || 'ka'} onChange={(e) => setProfile({ ...user, region: e.target.value })}>
                  {regionList.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="small">{t('common.district')}</span>
                <input type="text" value={user.district || ''} onChange={(e) => setProfile({ ...user, district: e.target.value })} />
              </label>
            </div>
            <label className="field">
              <span className="small">{t('account.language')}</span>
              <select value={user.preferredLanguage || 'en'} onChange={(e) => setProfile({ ...user, preferredLanguage: e.target.value })}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
            </label>
            <div>
              <button className="btn primary" type="submit" disabled={busy}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <Card title={t('account.farms')}>
            <DataState loading={!user.farms} error={null} empty={user.farms && user.farms.length === 0}>
              <div className="table-scroll">
                <table className="data">
                  <tbody>
                    {user.farms.map((f) => (
                      <tr key={f.id}>
                        <td>{f.label}</td>
                        <td className="small">{f.region} / {f.district}</td>
                        <td className="mono">{f.area} ac</td>
                        <td className="small">{f.primaryCrop}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>

            <form className="form-grid mt-4" onSubmit={addFarm}>
              <div className="form-grid cols-2">
                <div className="field">
                  <label htmlFor="f-label">{t('account.label')}</label>
                  <input id="f-label" type="text" value={farm.label} onChange={(e) => setFarm({ ...farm, label: e.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="f-area">{t('account.area')}</label>
                  <input id="f-area" type="number" step="0.1" min="0" value={farm.area} onChange={(e) => setFarm({ ...farm, area: e.target.value })} />
                </div>
              </div>
              <div className="form-grid cols-2">
                <div className="field">
                  <label htmlFor="f-region">{t('common.region')}</label>
                  <input id="f-region" type="text" value={farm.region} onChange={(e) => setFarm({ ...farm, region: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="f-crop">{t('account.crop')}</label>
                  <input id="f-crop" type="text" value={farm.primaryCrop} onChange={(e) => setFarm({ ...farm, primaryCrop: e.target.value })} />
                </div>
              </div>
              <div>
                <button className="btn" type="submit">{t('account.addFarm')}</button>
              </div>
            </form>
          </Card>

          <Card>
            <p className="small">{t('account.notDurable')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
