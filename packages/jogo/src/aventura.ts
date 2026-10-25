// A Aventura: o estado de uma campanha sobre um Projeto. Um objeto simples e serializável, para o
// Jogo guardá-lo (servidor ou disco) sem conversão. O XP não mora aqui: é do Jogador, somado em
// todas as Aventuras.
import type { Classe } from './contrato.ts';
import {
  chaveDoDesafio,
  desafiosJogados,
  resultadoDaExpedicao,
  type Expedicao,
} from './expedicao.ts';
import { iniciarMapa, revelar, type EstruturaMapa, type MapaAventura } from './mapa.ts';

export type Aventura = {
  classe: Classe;
  mapa: MapaAventura;
  /** Região → chaves dos Desafios já jogados nela, para a nova tentativa trazer outros. */
  vistos: Readonly<Record<string, readonly string[]>>;
};

/** A Classe escolhida define a região de entrada; só ela começa fora da Névoa (spec §4). */
export function iniciarAventura(
  estrutura: EstruturaMapa,
  classe: Classe,
  entradas: Readonly<Record<Classe, string>>,
): Aventura {
  return { classe, mapa: iniciarMapa(estrutura, entradas[classe]), vistos: {} };
}

/** Fim de uma Expedição: guarda os Desafios jogados e, na vitória, revela a região. */
export function concluirExpedicao(aventura: Aventura, expedicao: Expedicao): Aventura {
  const { regiaoId, venceu } = resultadoDaExpedicao(expedicao);
  const antes = aventura.vistos[regiaoId] ?? [];
  const jogados = desafiosJogados(expedicao).map(chaveDoDesafio);
  return {
    ...aventura,
    mapa: venceu ? revelar(aventura.mapa, regiaoId) : aventura.mapa,
    vistos: { ...aventura.vistos, [regiaoId]: [...new Set([...antes, ...jogados])] },
  };
}
