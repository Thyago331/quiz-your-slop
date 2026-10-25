// As Classes na tela, fora do módulo 'use client' de EscolhaDeClasse: páginas do servidor (o Perfil)
// também precisam do nome e do sprite de cada uma.
import type { Classe } from '@quiz/jogo';
import type { NomeSprite } from './sprites.ts';

export type ClasseNaTela = {
  id: Classe;
  nome: string;
  descricao: string;
  sprite: NomeSprite;
  /** Linha extra embaixo da descrição (o Tutorial mostra a região de entrada). */
  detalhe?: string;
};

/** As Classes como o protótipo as apresenta (variante D, passo 3 da Nova Aventura). */
export const CLASSES: readonly ClasseNaTela[] = [
  {
    id: 'backend',
    nome: 'Cavaleiro do Backend',
    descricao: 'Contratos, dados, regras e efeitos colaterais. Começa na rota principal.',
    sprite: 'cavaleiro',
  },
  {
    id: 'frontend',
    nome: 'Mago do Frontend',
    descricao: 'Estado, telas e interação. Começa na página inicial.',
    sprite: 'mago',
  },
  {
    id: 'fullstack',
    nome: 'Bardo Fullstack',
    descricao: 'A travessia front ↔ back. Começa onde a tela chama a API.',
    sprite: 'bardo',
  },
];
