import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Card, PageHead } from '../components/StateViews.jsx';
import ListenButton from '../components/ListenButton.jsx';

const ROUTES = [
  ['nav.overview', '/'],
  ['nav.sensors', '/sensors'],
  ['nav.weather', '/weather'],
  ['nav.satellite', '/satellite'],
  ['nav.crops', '/crops'],
  ['nav.protection', '/protection'],
  ['nav.marketplace', '/marketplace'],
  ['nav.gov', '/gov'],
  ['nav.account', '/account']
];

const MOD_KEY = {
  'nav.overview': 'proj.modOverview',
  'nav.sensors': 'proj.modSensors',
  'nav.weather': 'proj.modWeather',
  'nav.satellite': 'proj.modSatellite',
  'nav.crops': 'proj.modCrops',
  'nav.protection': 'proj.modProtection',
  'nav.marketplace': 'proj.modMarketplace',
  'nav.gov': 'proj.modGov',
  'nav.account': 'proj.modAccount'
};

export default function Overview() {
  const { t } = useApp();
  const navigate = useNavigate();

  const prose = [
    t('proj.plain'),
    t('proj.plain2'),
    t('proj.dataVoice')
  ].join(' ');

  return (
    <div className="page">
      <PageHead
        kicker={t('app.name')}
        title={t('overview.title')}
        subtitle={t('proj.tag')}
        right={<ListenButton text={prose} />}
      />

      <Card kicker={t('group.monitor')} title={t('proj.about')}>
        <p className="proj-lead">{t('proj.plain')}</p>
        <p className="proj-lead mt-2">{t('proj.plain2')}</p>
        <p className="proj-lead mt-2">{t('proj.dataVoice')}</p>
      </Card>

      <Card className="mt-6" kicker={t('group.advise')} title={t('proj.whatsInside')}>
        <ol className="proj-mods">
          {ROUTES.map(([navKey, to], i) => (
            <li key={navKey} className="proj-mod">
              <button
                type="button"
                className="proj-mod-row"
                onClick={() => navigate(to)}
                aria-label={t(navKey)}
              >
                <span className="mono small proj-mod-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="proj-mod-body">
                  <span className="proj-mod-name">{t(navKey)}</span>
                  <span className="small">{t(MOD_KEY[navKey])}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid cols-2 mt-6">
        <Card kicker={t('group.monitor')} title={t('proj.dataTitle')}>
          <div className="metric-row">
            <span className="badge">LIVE</span>
            <span className="small">{t('proj.dataLive')}</span>
          </div>
          <div className="metric-row">
            <span className="badge">SIMULATED</span>
            <span className="small">{t('proj.dataSim')}</span>
          </div>
          <p className="small mt-2">{t('proj.dataSimNote')}</p>
        </Card>

        <Card kicker={t('group.connect')} title={t('proj.demoTitle')}>
          <p className="proj-lead">{t('proj.demoLine')}</p>
          <div className="zone-side-actions mt-2">
            <button type="button" className="btn ghost small" onClick={() => navigate('/account')}>
              {t('nav.account')}
            </button>
          </div>
          <p className="small mono mt-2">{t('proj.demoNote')}</p>
        </Card>
      </div>

      <p className="small mono mt-6">{`${t('app.name')} \u2014 ${t('app.tagline')}`}</p>
    </div>
  );
}
