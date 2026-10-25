import type { Idioma } from '@quiz/i18n';

/**
 * O caminho de uma página num idioma (`/faq` → `/en/faq`; `/` → `/en`). Sem framework: canonical,
 * hreflang, sitemap e redirecionamentos do servidor montam as URLs por aqui.
 */
export function caminhoNoIdioma(idioma: Idioma, caminho: string): string {
  return `/${idioma}${caminho === '/' ? '' : caminho}`;
}

/**
 * O login, voltando depois para `caminho` no mesmo idioma. O destino vai codificado: com `?` ou `&`
 * dentro, ele não se mistura à query do login (o Next decodifica ao entregar `searchParams`).
 */
export function caminhoDoLogin(idioma: Idioma, caminho: string): string {
  const de = encodeURIComponent(caminhoNoIdioma(idioma, caminho));
  return `${caminhoNoIdioma(idioma, '/entrar')}?de=${de}`;
}
