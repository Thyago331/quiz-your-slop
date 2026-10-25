import { IDIOMAS, ehIdioma, type Idioma } from '@quiz/jogo';

export { IDIOMAS, ehIdioma, type Idioma };

/** Sem escolha nem preferência que sirva, o Jogo fala português. */
export const IDIOMA_PADRAO: Idioma = 'pt';

/** Um valor por idioma; o tipo obriga os três. */
export type PorIdioma<T> = Readonly<Record<Idioma, T>>;

/** A etiqueta BCP 47: `<html lang>`, hreflang e Intl. */
export const ETIQUETA: PorIdioma<string> = { pt: 'pt-BR', en: 'en', es: 'es' };

/** O que o seletor mostra (PT · EN · ES) e o nome de cada idioma nele mesmo, nunca traduzido. */
export const SIGLA: PorIdioma<string> = { pt: 'PT', en: 'EN', es: 'ES' };
export const AUTONIMO: PorIdioma<string> = { pt: 'Português', en: 'English', es: 'Español' };

/**
 * O primeiro idioma do Jogo entre as preferências, em ordem (`navigator.languages`, por exemplo):
 * `pt-PT` vale `pt`, `es-419` vale `es`.
 */
export function idiomaPreferido(preferencias: readonly string[]): Idioma {
  for (const preferencia of preferencias) {
    const base = preferencia.trim().toLowerCase().split(/[-_]/)[0] ?? '';
    if (ehIdioma(base)) return base;
  }
  return IDIOMA_PADRAO;
}
