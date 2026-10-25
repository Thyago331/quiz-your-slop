import type { Idioma } from '@quiz/jogo';
import {
  LIGACOES,
  REGIOES,
  TERRITORIOS,
  type LigacaoTaverna,
  type RegiaoTaverna,
  type TerritorioTaverna,
} from './mapa.ts';
import { TRADUCOES_DO_MAPA } from './traducoes.ts';

export type MapaNoIdioma = {
  territorios: readonly TerritorioTaverna[];
  regioes: readonly RegiaoTaverna[];
  ligacoes: readonly LigacaoTaverna[];
};

const cache = new Map<Idioma, MapaNoIdioma>();

/** O mapa da Taverna com nomes, resumos e descrições no idioma; ids, arquivos e Evidências iguais. */
export function mapaNoIdioma(idioma: Idioma): MapaNoIdioma {
  if (idioma === 'pt') return { territorios: TERRITORIOS, regioes: REGIOES, ligacoes: LIGACOES };
  const pronto = cache.get(idioma);
  if (pronto) return pronto;
  const t = TRADUCOES_DO_MAPA[idioma];
  const mapa: MapaNoIdioma = {
    territorios: TERRITORIOS.map((x) => ({ ...x, ...t.territorios[x.id] })),
    regioes: REGIOES.map((x) => ({ ...x, ...t.regioes[x.id] })),
    ligacoes: LIGACOES.map((x) => ({ ...x, descricao: t.ligacoes[x.id] ?? x.descricao })),
  };
  cache.set(idioma, mapa);
  return mapa;
}
