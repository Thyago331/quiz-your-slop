// A origem pública do site (spec §12): canonical, sitemap, JSON-LD e llms.txt partem daqui.
// Lida em tempo de execução (as páginas são renderizadas no servidor), então a mesma imagem Docker
// serve qualquer domínio.
export type Env = Record<string, string | undefined>;

export const NOME_DO_SITE = 'Quiz your slop';
export const LEMA = 'learn · gamification · unslop your code';
export const REPOSITORIO = 'https://github.com/Thyago331/quiz-your-slop';
const PADRAO = 'http://localhost:3000';

/** `SITE_URL` sem a barra do fim; sem ela, ou se não for http(s), o servidor de desenvolvimento. */
export function urlDoSite(env: Env = process.env): string {
  const bruta = env.SITE_URL?.trim().replace(/\/+$/, '');
  if (!bruta || !/^https?:\/\/[^/]/.test(bruta)) return PADRAO;
  return bruta;
}

/** URL absoluta de um caminho do site (`/faq` → `https://…/faq`; `/` → a origem com a barra). */
export function urlAbsoluta(caminho: string, env: Env = process.env): string {
  return urlDoSite(env) + (caminho === '/' ? '/' : caminho);
}
