import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
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
  return (
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
  );
}
