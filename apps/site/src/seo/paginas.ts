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

/** Caminhos que não interessam a buscadores: login, áreas com conta e rotas da API. */
export const CAMINHOS_FECHADOS = ['/api/', '/entrar', '/tutorial', '/lista-de-espera'] as const;
