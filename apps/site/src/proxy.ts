import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * O idioma da URL (spec §12): `/` e caminhos sem prefixo redirecionam para o idioma do cookie
 * NEXT_LOCALE, senão do Accept-Language, senão `pt`. Abrir uma URL com prefixo atualiza o cookie.
 */
export default createMiddleware(routing);

export const config = {
  // Fora: API (inclusive o login do Auth.js), arquivos do Next e tudo com extensão (llms.txt,
  // sitemap.xml, robots.txt, imagens).
  matcher: '/((?!api|_next|.*\\..*).*)',
};
