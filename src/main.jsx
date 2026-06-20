import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ImmersionProvider } from './i18n/ImmersionProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImmersionProvider>
      <App />
    </ImmersionProvider>
  </StrictMode>
);
