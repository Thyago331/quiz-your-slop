import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O Tauri serve este frontend; porta fixa para o `devUrl` do Tauri.
export default defineConfig({
  plugins: [react()],
  server: { port: 1420, strictPort: true },
  // Nada vira data: URI (fontes pequenas viravam): a CSP do Tauri só aceita arquivos do próprio app.
  build: { assetsInlineLimit: 0 },
  clearScreen: false,
});
