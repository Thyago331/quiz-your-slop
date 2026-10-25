import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // O next-intl importa `next/server` sem extensão: passando pelo Vite, a importação resolve.
    server: { deps: { inline: ['next-intl'] } },
  },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
