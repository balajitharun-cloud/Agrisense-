import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import BottomNav from './BottomNav.jsx';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main-col">
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <Outlet />
        <BottomNav onMore={() => setDrawerOpen(true)} />
      </div>
      {drawerOpen && (
        <>
          <button
            className="scrim"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="drawer" role="dialog" aria-label="Navigation">
            <Sidebar onNavigate={() => setDrawerOpen(false)} isDrawer />
          </div>
        </>
      )}
    </div>
  );
}
