import type { Idioma } from '@quiz/i18n';

/**
 * O caminho de uma página num idioma (`/faq` → `/en/faq`; `/` → `/en`). Sem framework: canonical,
 * hreflang, sitemap e redirecionamentos do servidor montam as URLs por aqui.
 */
export function caminhoNoIdioma(idioma: Idioma, caminho: string): string {
  return `/${idioma}${caminho === '/' ? '' : caminho}`;
}

/** O login, voltando depois para `caminho` no mesmo idioma. */
export function caminhoDoLogin(idioma: Idioma, caminho: string): string {
  return `${caminhoNoIdioma(idioma, '/entrar')}?de=${caminhoNoIdioma(idioma, caminho)}`;
}
