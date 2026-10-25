// As Classes na tela, fora do módulo 'use client' de EscolhaDeClasse: páginas do servidor (o Perfil)
// também precisam do nome e do sprite de cada uma.
import type { Classe } from '@quiz/jogo';
import { MENSAGENS, type Idioma } from '@quiz/i18n';
import type { NomeSprite } from './sprites.ts';

export type ClasseNaTela = {
  id: Classe;
  nome: string;
  descricao: string;
  sprite: NomeSprite;
  /** Linha extra embaixo da descrição (o Tutorial mostra a região de entrada). */
  detalhe?: string;
};

const SPRITE: Readonly<Record<Classe, NomeSprite>> = {
  backend: 'cavaleiro',
  frontend: 'mago',
  fullstack: 'bardo',
};

const ORDEM: readonly Classe[] = ['backend', 'frontend', 'fullstack'];

/** As Classes como o protótipo as apresenta (variante D, passo 3 da Nova Aventura), no idioma. */
export function classesNaTela(idioma: Idioma): ClasseNaTela[] {
  return ORDEM.map((id) => ({ id, ...MENSAGENS[idioma].jogo.classes[id], sprite: SPRITE[id] }));
}

export function classeNaTela(id: string | undefined, idioma: Idioma): ClasseNaTela | undefined {
  return classesNaTela(idioma).find((c) => c.id === id);
}
