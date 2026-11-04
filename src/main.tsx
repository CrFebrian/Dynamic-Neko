import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { currentView } from './app/view.ts';
import { installErrorLog } from './lib/errorLog.ts';
import { SettingsApp } from './settings/SettingsApp.tsx';
import './styles/island.css';
import './styles/tabs.css';
import './styles/settings.css';

const el = document.getElementById('root');
if (!el) throw new Error('Elemen #root tidak ditemukan');

const settings = currentView() === 'settings';
installErrorLog(settings ? 'settings' : 'island');
document.documentElement.classList.toggle('sv', settings);
if (settings) document.title = 'Pengaturan Yomi Island';

createRoot(el).render(<StrictMode>{settings ? <SettingsApp /> : <App />}</StrictMode>);
