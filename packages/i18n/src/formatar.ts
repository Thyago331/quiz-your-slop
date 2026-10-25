import { ETIQUETA, type Idioma } from './idiomas.ts';

/** Troca cada `{nome}` do modelo pelo valor; sem valor, o `{nome}` fica (e o teste de tela o pega). */
export function formatar(
  modelo: string,
  valores: Readonly<Record<string, string | number>>,
): string {
  return modelo.replace(/\{(\w+)\}/g, (inteiro, nome: string) =>
    nome in valores ? String(valores[nome]) : inteiro,
  );
}

export function formatarNumero(idioma: Idioma, valor: number): string {
  return new Intl.NumberFormat(ETIQUETA[idioma]).format(valor);
}

/**
 * Data e hora curtas no jeito do idioma. O servidor não sabe o fuso de quem lê: em português vale o
 * de Brasília, nos outros, UTC, e o fuso aparece escrito.
 */
export function formatarDataHora(idioma: Idioma, data: Date): string {
  const timeZone = idioma === 'pt' ? 'America/Sao_Paulo' : 'UTC';
  const texto = new Intl.DateTimeFormat(ETIQUETA[idioma], {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(data);
  return idioma === 'pt' ? texto : `${texto} UTC`;
}

/** Maiúsculas com as regras do idioma (os títulos em Press Start 2P vão assim). */
export function emMaiusculas(idioma: Idioma, texto: string): string {
  return texto.toLocaleUpperCase(ETIQUETA[idioma]);
}
