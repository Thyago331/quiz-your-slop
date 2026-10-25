import { defineRouting } from 'next-intl/routing';
import { IDIOMAS, IDIOMA_PADRAO } from '@quiz/i18n';

/** Um ano: a escolha de idioma vale entre visitas (o padrão do next-intl é só a sessão). */
const UM_ANO = 60 * 60 * 24 * 365;

/**
 * Todo caminho leva o idioma (`/pt/faq`, `/en/faq`, `/es/faq`), como no transito-analyzer: a raiz
 * e os caminhos sem prefixo redirecionam pelo cookie NEXT_LOCALE (o seletor PT · EN · ES), senão
 * pelo Accept-Language, senão português. Os caminhos depois do prefixo são os mesmos em todo
 * idioma. O hreflang sai dos metadados de cada página, não do cabeçalho Link do next-intl.
 */
export const routing = defineRouting({
  locales: IDIOMAS,
  defaultLocale: IDIOMA_PADRAO,
  localePrefix: 'always',
  alternateLinks: false,
  localeCookie: { maxAge: UM_ANO },
});
