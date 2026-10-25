import type { ReactNode } from 'react';
import { Janela } from './Janela.tsx';
import { Menu, type ItemMenu } from './Menu.tsx';
import { Sprite } from './Sprite.tsx';
import { useMensagens } from './idioma.tsx';

type TelaInicialProps = {
  /** Os itens do hub; quem usa decide quais existem e o que fazem. */
  itens: readonly ItemMenu[];
  onEscolher: (id: string) => void;
  /** Onde o cursor começa (ao voltar de uma tela, o item que levou até ela). */
  inicial?: string;
  /** Abaixo do menu, dentro da janela. */
  children?: ReactNode;
};

/** A tela de título do JRPG: os três heróis, o nome do Jogo e o hub (protótipo, ?tela=inicio). */
export function TelaInicial({ itens, onEscolher, inicial, children }: TelaInicialProps) {
  const t = useMensagens().ui.inicio;
  return (
    <main className="tela-inicial">
      <div className="tela-inicial-herois">
        <Sprite nome="cavaleiro" escala={7} />
        <Sprite nome="mago" escala={7} />
        <Sprite nome="bardo" escala={7} />
      </div>
      {/* O nome do Jogo é marca: igual em todos os idiomas. */}
      <h1 className="tela-inicial-logo" aria-label="Quiz your slop">
        QUIZ YOUR
        <br />
        SLOP
      </h1>
      <p className="tela-inicial-lema">{t.lema}</p>
      <Janela className="tela-inicial-hub">
        <Menu rotulo={t.menu} itens={itens} onEscolher={onEscolher} inicial={inicial} autoFoco />
        {children}
      </Janela>
      <p className="tela-inicial-ajuda">{t.ajuda}</p>
      <p className="tela-inicial-rodape">{t.privacidade}</p>
    </main>
  );
}
