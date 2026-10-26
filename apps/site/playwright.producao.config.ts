import { defineConfig, devices } from '@playwright/test';

// O smoke do site no ar (spec §11): sem servidor local, sem mocks. Roda no workflow de deploy
// depois do /api/health e, à mão, com
//   PRODUCTION_URL=https://<domínio> pnpm --filter @quiz/site e2e:producao
const baseURL = process.env.PRODUCTION_URL?.replace(/\/+$/, '');
if (!baseURL) throw new Error('PRODUCTION_URL é a origem do site no ar, ex.: https://quiz.example');

export default defineConfig({
  testDir: './e2e',
  testMatch: /producao\.spec\.ts/,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
