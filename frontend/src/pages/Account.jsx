import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useGate } from '../context/GateContext.jsx';
import { updateAccount, addFarm, removeFarm, unlockAdmin } from '../lib/accountStore.js';
import AuthGate from '../components/AuthGate.jsx';
import { Card, PageHead, DataState } from '../components/StateViews.jsx';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function Account() {
  const { t, languages } = useApp();
  const { session, enter, signOut } = useGate();

  const [profile, setProfile] = useState(session && session.user ? session.user : null);
  const [farm, setFarm] = useState({ label: '', district: '', area: '', primaryCrop: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!session) {
    return (
      <div className="page">
        <PageHead
          kicker={t('group.connect')}
          title={t('account.title')}
          subtitle={t('account.subtitle')}
        />
        <AuthGate embedded />
      </div>
    );
  }

  const isAdmin = session.kind === 'admin';
  const user = session.kind === 'user' ? session.user : null;

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = updateAccount(user.email, {
        name: profile.name,
        phone: profile.phone,
        region: profile.region || 'ka',
        district: profile.district || '',
        preferredLanguage: profile.preferredLanguage || ''
      });
      if (updated) enter({ kind: 'user', user: updated });
    } finally {
      setBusy(false);
    }
  }

  async function submitFarm(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const record = addFarm(user.email, { ...farm, region: 'ka' });
      if (record) {
        const updated = updateAccount(user.email, {});
        enter({ kind: 'user', user: updated });
        setFarm({ label: '', district: '', area: '', primaryCrop: '' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function dropFarm(farmId) {
    const updated = removeFarm(user.email, farmId);
    if (updated) enter({ kind: 'user', user: updated });
  }

  async function submitAdmin(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      enter(unlockAdmin(adminForm.username, adminForm.password));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const name = isAdmin ? session.name : user.name;

  return (
    <div className="page">
      <PageHead
        kicker={t('group.connect')}
        title={t('account.title')}
        subtitle={`${t('account.signedInAs')}: ${isAdmin ? session.email : user.email}`}
        right={
          <button type="button" className="btn ghost small" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            {t('account.logout')}
          </button>
        }
      />

      {isAdmin ? (
        <Card kicker={t('group.connect')} title={t('account.adminTitle')} className="mt-6">
          <div className="alert-row ok" role="status">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>{t('account.adminActive')}</span>
          </div>
          <p className="small mt-2">{t('account.adminHint')}</p>
        </Card>
      ) : (
        <div className="grid cols-2 mt-6">
          <Card title={t('account.profile')}>
            <form className="form-grid" onSubmit={saveProfile}>
              <div className="form-grid cols-2">
                <div className="field">
                  <label htmlFor="p-name">{t('account.name')}</label>
                  <input id="p-name" type="text" value={profile ? profile.name : ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="p-phone">{t('account.phone')}</label>
                  <input id="p-phone" type="tel" value={profile ? profile.phone || '' : ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-grid cols-2">
                <label className="field">
                  <span className="small">{t('common.region')}</span>
                  <input type="text" value="Karnataka" readOnly />
                </label>
                <label className="field">
                  <span className="small">{t('common.district')}</span>
                  <input type="text" value={profile ? profile.district || '' : ''} onChange={(e) => setProfile({ ...profile, district: e.target.value })} />
                </label>
              </div>
              <label className="field">
                <span className="small">{t('account.language')}</span>
                <select
                  value={profile ? profile.preferredLanguage || 'en' : 'en'}
                  onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.native}</option>
                  ))}
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
              <DataState loading={false} error={null} empty={!user.farms || user.farms.length === 0}>
                <div className="table-scroll">
                  <table className="data">
                    <tbody>
                      {(user.farms || []).map((f) => (
                        <tr key={f.id}>
                          <td>{f.label}</td>
                          <td className="small">{f.district || '—'}</td>
                          <td className="mono">{f.area ? `${f.area} ac` : '—'}</td>
                          <td className="small">{f.primaryCrop || '—'}</td>
                          <td>
                            <button type="button" className="btn ghost small" onClick={() => dropFarm(f.id)}>
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DataState>

              <form className="form-grid mt-4" onSubmit={submitFarm}>
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
                    <label htmlFor="f-district">{t('common.district')}</label>
                    <input id="f-district" type="text" value={farm.district} onChange={(e) => setFarm({ ...farm, district: e.target.value })} />
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

            <Card kicker={t('group.connect')} title={t('account.adminTitle')}>
              <p className="small">{t('account.adminHint')}</p>
              <form className="form-grid mt-2" onSubmit={submitAdmin}>
                <div className="form-grid cols-2">
                  <label className="field">
                    <span className="small">{t('gate.adminUser')}</span>
                    <input
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="small">{t('account.password')}</span>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                </div>
                {err ? <p className="form-err small" role="alert">{err}</p> : null}
                <div>
                  <button className="btn" type="submit" disabled={busy}>
                    <ShieldCheck size={16} aria-hidden="true" />
                    {t('gate.adminBtn')}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      <p className="small mono mt-6">{name} · {t('account.localNote')}</p>
    </div>
  );
}
