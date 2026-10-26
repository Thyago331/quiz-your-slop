import { expect, test } from '@playwright/test';

// O smoke do deploy (spec §11) contra PRODUCTION_URL: saúde, a inicial, o SEO apontando para o
// domínio certo (SITE_URL) e o login indo ao GitHub com o escopo mínimo e o callback deste domínio
// (AUTH_URL e a OAuth App de produção). Não autentica: para na porta do GitHub.
const ORIGEM = process.env.PRODUCTION_URL!.replace(/\/+$/, '');

test('o site está saudável e serve a inicial', async ({ page, request }) => {
  const saude = await request.get('/api/health');
  expect(saude.status()).toBe(200);
  expect(await saude.json()).toMatchObject({ status: 'ok' });

  const resposta = await page.goto('/pt');
  expect(resposta?.status()).toBe(200);
  await expect(page).toHaveTitle(/Quiz your slop/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('sitemap.xml e robots.txt apontam para o domínio de produção', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(`<loc>${ORIGEM}/pt</loc>`);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${ORIGEM}/sitemap.xml`);
});

test('entrar leva ao authorize do GitHub com o escopo mínimo', async ({ page }) => {
  await page.goto('/pt/entrar');
  const indoAoGithub = page.waitForRequest(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
  await page.getByRole('menuitem', { name: 'Entrar com GitHub' }).click();
  const authorize = new URL((await indoAoGithub).url());
  expect(authorize.searchParams.get('scope')).toBe('read:user user:email');
  expect(authorize.searchParams.get('redirect_uri')).toBe(`${ORIGEM}/api/auth/callback/github`);
  expect(authorize.searchParams.get('client_id')).toBeTruthy();
});
