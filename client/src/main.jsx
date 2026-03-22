import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ECOProvider } from './context/ECOContext';
import { SidebarProvider } from './context/SidebarContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ECOProvider>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </ECOProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
