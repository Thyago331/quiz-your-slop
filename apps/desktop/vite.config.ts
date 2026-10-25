import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O Tauri serve este frontend; porta fixa para o `devUrl` do Tauri.
export default defineConfig({
  plugins: [react()],
  server: { port: 1420, strictPort: true },
  clearScreen: false,
});
