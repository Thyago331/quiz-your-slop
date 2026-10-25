import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { MENSAGENS } from '@quiz/i18n';
import { routing } from './routing';

// As mensagens da interface compartilhada (as mesmas do Jogo desktop) também ficam à mão do
// next-intl; os textos das páginas são objetos tipados por idioma em src/textos.
export default getRequestConfig(async ({ requestLocale }) => {
  const pedido = await requestLocale;
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale;
  return { locale, messages: MENSAGENS[locale] };
});
