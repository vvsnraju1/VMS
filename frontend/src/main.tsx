import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

// Ant Design enterprise theme configuration
const theme = {
  token: {
    colorPrimary: '#1e3a5f',
    colorSuccess: '#2e7d32',
    colorWarning: '#ed6c02',
    colorError: '#d32f2f',
    colorInfo: '#0288d1',
    borderRadius: 4,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#0d1b2a',
      siderBg: '#1b263b',
    },
    Menu: {
      darkItemBg: '#1b263b',
      darkSubMenuItemBg: '#0d1b2a',
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);

