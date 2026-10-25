// Banco de Desafios do Tutorial, escritos à mão no formato `Desafio` do contrato (spec §9).
// Um módulo por Região em desafios/, em português; desafios/en/ e desafios/es/ trazem só os textos
// traduzidos de cada um, por id. Os trechos das Evidências são cópia exata de codigo/ (o teste
// confere). Nos de Traçar o fluxo, as opções vêm fora de ordem: é a ordem em que aparecem na tela.
import { API_DE_PEDIDOS } from './desafios/api-pedidos.ts';
import { CARDAPIO } from './desafios/cardapio.ts';
import { CARRINHO_E_CHECKOUT } from './desafios/carrinho-checkout.ts';
import { COFRE_DO_ANAO } from './desafios/cofre-anao.ts';
import { FOGAO } from './desafios/fogao.ts';
import { GRIMORIO } from './desafios/grimorio.ts';
import { LIVRO_DE_REGISTROS } from './desafios/livro-registros.ts';
import { API_DE_PEDIDOS_EN } from './desafios/en/api-pedidos.ts';
import { CARDAPIO_EN } from './desafios/en/cardapio.ts';
import { CARRINHO_E_CHECKOUT_EN } from './desafios/en/carrinho-checkout.ts';
import { COFRE_DO_ANAO_EN } from './desafios/en/cofre-anao.ts';
import { FOGAO_EN } from './desafios/en/fogao.ts';
import { GRIMORIO_EN } from './desafios/en/grimorio.ts';
import { LIVRO_DE_REGISTROS_EN } from './desafios/en/livro-registros.ts';
import { API_DE_PEDIDOS_ES } from './desafios/es/api-pedidos.ts';
import { CARDAPIO_ES } from './desafios/es/cardapio.ts';
import { CARRINHO_E_CHECKOUT_ES } from './desafios/es/carrinho-checkout.ts';
import { COFRE_DO_ANAO_ES } from './desafios/es/cofre-anao.ts';
import { FOGAO_ES } from './desafios/es/fogao.ts';
import { GRIMORIO_ES } from './desafios/es/grimorio.ts';
import { LIVRO_DE_REGISTROS_ES } from './desafios/es/livro-registros.ts';
import type { Idioma } from '@quiz/jogo';
import type { DesafioTaverna, TextosDaRegiao, TextosDoDesafio } from './desafios/tipo.ts';

export type { DesafioTaverna, TextosDaRegiao, TextosDoDesafio } from './desafios/tipo.ts';

/** Região → Desafios. */
export const DESAFIOS: Readonly<Record<string, readonly DesafioTaverna[]>> = {
  cardapio: CARDAPIO,
  'carrinho-checkout': CARRINHO_E_CHECKOUT,
  'api-pedidos': API_DE_PEDIDOS,
  'cofre-anao': COFRE_DO_ANAO,
  grimorio: GRIMORIO,
  'livro-registros': LIVRO_DE_REGISTROS,
  fogao: FOGAO,
};

type IdiomaTraduzido = Exclude<Idioma, 'pt'>;

/** Os textos traduzidos de cada Região (desafios/en/, desafios/es/), por id de Desafio. */
export const TEXTOS_TRADUZIDOS: Readonly<
  Record<IdiomaTraduzido, Readonly<Record<string, TextosDaRegiao>>>
> = {
  en: {
    cardapio: CARDAPIO_EN,
    'carrinho-checkout': CARRINHO_E_CHECKOUT_EN,
    'api-pedidos': API_DE_PEDIDOS_EN,
    'cofre-anao': COFRE_DO_ANAO_EN,
    grimorio: GRIMORIO_EN,
    'livro-registros': LIVRO_DE_REGISTROS_EN,
    fogao: FOGAO_EN,
  },
  es: {
    cardapio: CARDAPIO_ES,
    'carrinho-checkout': CARRINHO_E_CHECKOUT_ES,
    'api-pedidos': API_DE_PEDIDOS_ES,
    'cofre-anao': COFRE_DO_ANAO_ES,
    grimorio: GRIMORIO_ES,
    'livro-registros': LIVRO_DE_REGISTROS_ES,
    fogao: FOGAO_ES,
  },
};

/**
 * O Desafio em português com os textos trocados. O teste exige tradução completa; se um texto
 * faltasse, ficaria o português em vez de quebrar a tela.
 */
function traduzir(d: DesafioTaverna, t: TextosDoDesafio | undefined): DesafioTaverna {
  if (!t) return d;
  return {
    ...d,
    enunciado: t.enunciado,
    explicacao: t.explicacao,
    opcoes: d.opcoes.map((o) => ('texto' in o ? { ...o, texto: t.opcoes?.[o.id] ?? o.texto } : o)),
    ...(d.anulacao && {
      anulacao: { ...d.anulacao, explicacao: t.anulacao ?? d.anulacao.explicacao },
    }),
  };
}

function traduzirBanco(idioma: IdiomaTraduzido) {
  return Object.fromEntries(
    Object.entries(DESAFIOS).map(([regiaoId, lista]) => [
      regiaoId,
      lista.map((d) => traduzir(d, TEXTOS_TRADUZIDOS[idioma][regiaoId]?.[d.id])),
    ]),
  );
}

/** Os Desafios em inglês e espanhol, por Região: mesmos ids, Formatos, gabaritos e Evidências. */
export const DESAFIOS_TRADUZIDOS: Readonly<
  Record<IdiomaTraduzido, Readonly<Record<string, readonly DesafioTaverna[]>>>
> = {
  en: traduzirBanco('en'),
  es: traduzirBanco('es'),
};

/** Os Desafios da Região no idioma da tela. */
export function desafiosDaRegiao(regiaoId: string, idioma: Idioma): readonly DesafioTaverna[] {
  const banco = idioma === 'pt' ? DESAFIOS : DESAFIOS_TRADUZIDOS[idioma];
  return banco[regiaoId] ?? [];
}
