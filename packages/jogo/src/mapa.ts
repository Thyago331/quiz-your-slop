// O mapa de uma Aventura: estados das Regiões, vizinhança por Ligação e Progresso (spec §3, §4).
import type { EstadoRegiao } from './contrato.ts';

/** O contrato só fala das regiões conhecidas; do lado do Jogo existe também a Névoa. */
export type EstadoNoMapa = 'nevoa' | EstadoRegiao;

/** Todos os estados no mapa, em tempo de execução (validar o que foi guardado). */
export const ESTADOS_NO_MAPA = [
  'nevoa',
  'desbloqueada',
  'revelada',
  'desatualizada',
] as const satisfies readonly EstadoNoMapa[];

/** Ligação reduzida ao que o mapa precisa: quem fala com quem. */
export type LigacaoMapa = { id: string; origem: string; destino: string };

/** A estrutura completa do mapa, inclusive o que ainda está na Névoa. */
export type EstruturaMapa = {
  regioes: readonly string[];
  ligacoes: readonly LigacaoMapa[];
};

/** O mapa como o Jogador o conhece num momento da Aventura. Imutável: toda mudança gera outro. */
export type MapaAventura = {
  ligacoes: readonly LigacaoMapa[];
  estados: Readonly<Record<string, EstadoNoMapa>>;
  /** Ids das Ligações visíveis no mapa (as que tocam uma região revelada). */
  ligacoesConhecidas: readonly string[];
};

/** Início da Aventura: só a região de entrada fora da Névoa. */
export function iniciarMapa(estrutura: EstruturaMapa, entrada: string): MapaAventura {
  if (!estrutura.regioes.includes(entrada)) throw new Error(`Entrada fora do mapa: ${entrada}`);
  const estados: Record<string, EstadoNoMapa> = {};
  for (const id of estrutura.regioes) estados[id] = id === entrada ? 'desbloqueada' : 'nevoa';
  return { ligacoes: estrutura.ligacoes, estados, ligacoesConhecidas: [] };
}

/** Duas Regiões são vizinhas se e somente se existe uma Ligação entre elas, em qualquer sentido. */
export function vizinhas(mapa: MapaAventura, regiaoId: string): string[] {
  const ids = new Set<string>();
  for (const l of mapa.ligacoes) {
    if (l.origem === regiaoId) ids.add(l.destino);
    if (l.destino === regiaoId) ids.add(l.origem);
  }
  ids.delete(regiaoId);
  return [...ids];
}

/**
 * Vitória numa Expedição: a região é revelada, desbloqueia as vizinhas que estavam na Névoa e as
 * Ligações dela aparecem no mapa. Revelar de novo uma desatualizada também passa por aqui.
 * Uma região na Névoa não tem Expedição, então revelá-la é erro de quem chamou.
 */
export function revelar(mapa: MapaAventura, regiaoId: string): MapaAventura {
  const atual = mapa.estados[regiaoId];
  if (atual === undefined) throw new Error(`Região fora do mapa: ${regiaoId}`);
  if (atual === 'nevoa') throw new Error(`Região na Névoa não pode ser revelada: ${regiaoId}`);
  const estados: Record<string, EstadoNoMapa> = { ...mapa.estados, [regiaoId]: 'revelada' };
  for (const vizinha of vizinhas(mapa, regiaoId)) {
    if (estados[vizinha] === 'nevoa') estados[vizinha] = 'desbloqueada';
  }
  const conhecidas = new Set(mapa.ligacoesConhecidas);
  for (const l of mapa.ligacoes) {
    if (l.origem === regiaoId || l.destino === regiaoId) conhecidas.add(l.id);
  }
  return { ...mapa, estados, ligacoesConhecidas: [...conhecidas] };
}

export type ProgressoAventura = { reveladas: number; conhecidas: number };

/**
 * Progresso da Aventura: reveladas sobre conhecidas (fora da Névoa). Desatualizada é conhecida mas
 * não revelada — por isso o Progresso cai quando o código muda, como cai ao descobrir regiões.
 */
export function progresso(mapa: MapaAventura): ProgressoAventura {
  const estados = Object.values(mapa.estados);
  return {
    reveladas: estados.filter((e) => e === 'revelada').length,
    conhecidas: estados.filter((e) => e !== 'nevoa').length,
  };
}
