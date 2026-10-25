// Correção dos Desafios pelo Jogo: todo Formato de Desafio tem gabarito objetivo (spec §5).
import type { Desafio } from './contrato.ts';

/** A resposta do Jogador: ids de opções, como o gabarito. */
export type Resposta = readonly string[];

/** Múltipla escolha: exatamente a opção do gabarito. */
function corrigirMultiplaEscolha(desafio: Desafio, resposta: Resposta): boolean {
  return resposta.length === 1 && resposta[0] === desafio.gabarito[0];
}

/** Apontar no código: um lugar só, e ele está entre os aceitos pelo gabarito. */
function corrigirApontar(desafio: Desafio, resposta: Resposta): boolean {
  return resposta.length === 1 && desafio.gabarito.includes(resposta[0] as string);
}

/** Traçar o fluxo: a ordem completa, passo a passo igual à do gabarito. */
function corrigirTracarFluxo(desafio: Desafio, resposta: Resposta): boolean {
  const { gabarito } = desafio;
  return resposta.length === gabarito.length && gabarito.every((id, k) => resposta[k] === id);
}

export function corrigir(desafio: Desafio, resposta: Resposta): boolean {
  switch (desafio.formato) {
    case 'multipla_escolha':
      return corrigirMultiplaEscolha(desafio, resposta);
    case 'apontar':
      return corrigirApontar(desafio, resposta);
    case 'tracar_fluxo':
      return corrigirTracarFluxo(desafio, resposta);
  }
}
