// A Aventura: o estado de uma campanha sobre um Projeto. Um objeto simples e serializável, para o
// Jogo guardá-lo (servidor ou disco) sem conversão.
import type { Classe } from './contrato.ts';
import { iniciarMapa, type EstruturaMapa, type MapaAventura } from './mapa.ts';

export type Aventura = {
  classe: Classe;
  mapa: MapaAventura;
};

/** A Classe escolhida define a região de entrada; só ela começa fora da Névoa (spec §4). */
export function iniciarAventura(
  estrutura: EstruturaMapa,
  classe: Classe,
  entradas: Readonly<Record<Classe, string>>,
): Aventura {
  return { classe, mapa: iniciarMapa(estrutura, entradas[classe]) };
}
