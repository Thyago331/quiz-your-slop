import { CALIBRAGEM_PADRAO } from '@quiz/jogo';
import type { Idioma } from './idiomas.ts';
import { MENSAGENS, type Mensagens } from './mensagens/index.ts';

type ChaveDoTitulo = keyof Mensagens['jogo']['titulos'];

const CHAVE_DO_TITULO = new Map(
  Object.entries(MENSAGENS.pt.jogo.titulos).map(([chave, nome]) => [nome, chave as ChaveDoTitulo]),
);

/**
 * O Título na tela. O envio de progresso guarda o nome em português (o da calibragem), que não
 * muda com o idioma; um nome desconhecido aparece como veio.
 */
export function nomeDoTitulo(nome: string, idioma: Idioma): string {
  const chave = CHAVE_DO_TITULO.get(nome);
  return chave ? MENSAGENS[idioma].jogo.titulos[chave] : nome;
}

/** Os Títulos da calibragem padrão que não têm tradução (o teste exige zero). */
export const titulosSemTraducao = () =>
  CALIBRAGEM_PADRAO.titulos.filter((t) => !CHAVE_DO_TITULO.has(t.nome)).map((t) => t.nome);
