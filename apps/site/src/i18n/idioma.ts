import 'server-only';
import { getLocale } from 'next-intl/server';
import { IDIOMA_PADRAO, ehIdioma, type Idioma } from '@quiz/i18n';

/** O idioma desta requisição, como o proxy o resolveu pelo prefixo da URL. */
export async function idiomaDaRequisicao(): Promise<Idioma> {
  const locale = await getLocale();
  return ehIdioma(locale) ? locale : IDIOMA_PADRAO;
}
