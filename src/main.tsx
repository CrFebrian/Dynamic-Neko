import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import './styles/island.css';
import './styles/tabs.css';

const el = document.getElementById('root');
if (!el) throw new Error('Elemen #root tidak ditemukan');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
