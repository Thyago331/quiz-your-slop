'use client';
import type { Classe } from '@quiz/jogo';
import { Janela } from './Janela.tsx';
import { Menu } from './Menu.tsx';
import { Sprite } from './Sprite.tsx';
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

type EscolhaDeClasseProps = {
  classes: readonly ClasseNaTela[];
  onEscolher: (classe: Classe) => void;
  titulo?: string;
};

/** Seleção de personagem: um cartão por Classe; ← → e Enter, ou o mouse. */
export function EscolhaDeClasse({
  classes,
  onEscolher,
  titulo = 'Escolha a sua Classe',
}: EscolhaDeClasseProps) {
  return (
    <Janela titulo={titulo.toUpperCase()} className="escolha-classe">
      <Menu
        rotulo={titulo}
        horizontal
        autoFoco
        className="escolha-classe-cartoes"
        itens={classes.map((c) => ({
          id: c.id,
          rotulo: (
            <span className="escolha-classe-cartao">
              <Sprite nome={c.sprite} escala={9} titulo={c.nome} />
              <span className="escolha-classe-nome">{c.nome}</span>
              <span>{c.descricao}</span>
              {c.detalhe && <span className="escolha-classe-detalhe">{c.detalhe}</span>}
            </span>
          ),
        }))}
        onEscolher={(id) => {
          const classe = classes.find((c) => c.id === id);
          if (classe) onEscolher(classe.id);
        }}
      />
      <p className="escolha-classe-ajuda">▶ ← → escolhem · Enter confirma · ou clique.</p>
    </Janela>
  );
}
