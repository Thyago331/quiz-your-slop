// Correção dos Desafios pelo Jogo: todo Formato de Desafio tem gabarito objetivo (spec §5).
import type { Desafio } from './contrato.ts';

/** A resposta do Jogador: ids de opções, como o gabarito. */
export type Resposta = readonly string[];

/** Múltipla escolha: exatamente a opção do gabarito. */
function corrigirMultiplaEscolha(desafio: Desafio, resposta: Resposta): boolean {
  return resposta.length === 1 && resposta[0] === desafio.gabarito[0];
}

export function corrigir(desafio: Desafio, resposta: Resposta): boolean {
  switch (desafio.formato) {
    case 'multipla_escolha':
      return corrigirMultiplaEscolha(desafio, resposta);
    // Apontar no código e Traçar o fluxo chegam no próximo passo do Tutorial.
    case 'apontar':
    case 'tracar_fluxo':
      throw new Error(`Formato de Desafio ainda sem correção: ${desafio.formato}`);
  }
}
