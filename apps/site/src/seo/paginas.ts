import { IDIOMAS } from '@quiz/i18n';
import { caminhoNoIdioma } from '@/i18n/caminhos';
import { PAGINA as COMO_FUNCIONA } from '@/textos/como-funciona';
import { PAGINA as FAQ } from '@/textos/faq';
import { PAGINA as INICIO } from '@/textos/inicio';
import { PAGINA as PRIVACIDADE } from '@/textos/privacidade';
import { PAGINA as TAVERNA } from '@/textos/taverna';
import type { DadosDaPagina } from '@/textos/pagina';

/** As páginas públicas, na ordem do sitemap e do llms.txt. O resto do site fica atrás do login. */
export const PAGINAS_PUBLICAS: readonly DadosDaPagina[] = [
  INICIO,
  COMO_FUNCIONA,
  TAVERNA,
  PRIVACIDADE,
  FAQ,
];

const FECHADAS = ['/entrar', '/tutorial', '/lista-de-espera'] as const;

/** Caminhos que não interessam a buscadores: rotas da API e, em cada idioma, login e áreas com conta. */
export const CAMINHOS_FECHADOS: readonly string[] = [
  '/api/',
  ...IDIOMAS.flatMap((idioma) => FECHADAS.map((c) => caminhoNoIdioma(idioma, c))),
];
