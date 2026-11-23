import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { GateProvider } from './context/GateContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <AuthProvider>
        <GateProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GateProvider>
      </AuthProvider>
    </AppProvider>
  </React.StrictMode>
);
