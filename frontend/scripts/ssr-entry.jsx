import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../src/App.jsx';
import { AppProvider } from '../src/context/AppContext.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { GateProvider } from '../src/context/GateContext.jsx';

const ROUTES = [
  '/',
  '/sensors',
  '/weather',
  '/satellite',
  '/crops',
  '/protection',
  '/marketplace',
  '/gov',
  '/account'
];

const failures = [];

for (const route of ROUTES) {
  try {
    const html = renderToString(
      <AppProvider>
        <AuthProvider>
          <GateProvider>
            <StaticRouter location={route}>
              <App />
            </StaticRouter>
          </GateProvider>
        </AuthProvider>
      </AppProvider>
    );
    if (!html || html.length < 200) {
      throw new Error(`Render output too small (${html ? html.length : 0} bytes)`);
    }
    if (/<{2,}|undefined|NaN></.test(html)) {
      throw new Error('Render output contains raw placeholders');
    }
    console.log(`ok   ${route}  (${html.length} bytes)`);
  } catch (err) {
    failures.push({ route, err });
    console.error(`FAIL ${route}: ${err && err.message}`);
  }
}

if (failures.length > 0) {
  console.error(`check:render — ${failures.length} of ${ROUTES.length} routes failed`);
  process.exit(1);
}
console.log('check:render — all 9 routes render cleanly');
