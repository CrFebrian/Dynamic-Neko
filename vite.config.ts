import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 1420 harus sama dengan devUrl di src-tauri/tauri.conf.json.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: { target: 'es2022' },
});
