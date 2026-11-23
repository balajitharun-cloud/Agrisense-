import React, { useCallback, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Splash from './components/Splash.jsx';
import AuthGate from './components/AuthGate.jsx';
import { useGate } from './context/GateContext.jsx';
import Overview from './pages/Overview.jsx';
import Sensors from './pages/Sensors.jsx';
import Weather from './pages/Weather.jsx';
import Satellite from './pages/Satellite.jsx';
import Crops from './pages/Crops.jsx';
import Protection from './pages/Protection.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Gov from './pages/Gov.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  const { session } = useGate();
  const [introDone, setIntroDone] = useState(false);
  const done = useCallback(() => setIntroDone(true), []);

  return (
    <>
      {!introDone && <Splash onDone={done} />}
      {introDone && !session && <AuthGate />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/satellite" element={<Satellite />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/protection" element={<Protection />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/gov" element={<Gov />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </>
  );
}
