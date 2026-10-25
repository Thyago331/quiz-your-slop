/** Idiomas do MVP (spec §12). Toda chamada ao Mestre leva um deles. */
export const IDIOMAS = ['pt', 'en', 'es'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export function ehIdioma(valor: string): valor is Idioma {
  return (IDIOMAS as readonly string[]).includes(valor);
}
