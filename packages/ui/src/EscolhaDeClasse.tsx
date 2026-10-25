'use client';
import type { Classe } from '@quiz/jogo';
import { Janela } from './Janela.tsx';
import { Menu } from './Menu.tsx';
import { Sprite } from './Sprite.tsx';
import type { ClasseNaTela } from './classes.ts';

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
