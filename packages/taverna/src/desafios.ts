// Banco de Desafios do Tutorial, escritos à mão no formato `Desafio` do contrato (spec §9).
// Um módulo por Região em desafios/: os textos estão em português e cada região fica num lugar só,
// pronta para a tradução (DESAFIOS_TRADUZIDOS, #30). Os trechos das Evidências são cópia exata de
// codigo/ (o teste confere). Nos de Traçar o fluxo, as opções vêm fora de ordem: é a ordem em que aparecem na tela.
import { API_DE_PEDIDOS } from './desafios/api-pedidos.ts';
import { CARDAPIO } from './desafios/cardapio.ts';
import { CARRINHO_E_CHECKOUT } from './desafios/carrinho-checkout.ts';
import { COFRE_DO_ANAO } from './desafios/cofre-anao.ts';
import { FOGAO } from './desafios/fogao.ts';
import { GRIMORIO } from './desafios/grimorio.ts';
import { LIVRO_DE_REGISTROS } from './desafios/livro-registros.ts';
import type { Idioma } from '@quiz/jogo';
import type { DesafioTaverna } from './desafios/tipo.ts';

export type { DesafioTaverna } from './desafios/tipo.ts';

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

/**
 * Os Desafios em outro idioma, por Região (#30): cada módulo de desafios/ ganha a sua versão
 * traduzida (desafios/en/cardapio.ts, por exemplo), registrada aqui. A tradução mantém ids,
 * Formatos, gabaritos e Evidências do português; só os textos mudam (o teste confere).
 */
export const DESAFIOS_TRADUZIDOS: Readonly<
  Partial<Record<Exclude<Idioma, 'pt'>, Readonly<Record<string, readonly DesafioTaverna[]>>>>
> = {};

/** Os Desafios da Região no idioma; sem tradução ainda (até o #30), os em português. */
export function desafiosDaRegiao(regiaoId: string, idioma: Idioma): readonly DesafioTaverna[] {
  const traduzidos = idioma === 'pt' ? undefined : DESAFIOS_TRADUZIDOS[idioma]?.[regiaoId];
  return traduzidos ?? DESAFIOS[regiaoId] ?? [];
}
