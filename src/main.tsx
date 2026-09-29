import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for PWA offline capabilities and installability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available for Learnora, auto-updating...');
  },
  onOfflineReady() {
    console.log('Learnora is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
