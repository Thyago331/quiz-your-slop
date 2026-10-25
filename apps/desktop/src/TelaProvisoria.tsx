import { useEffect } from 'react';
import { Janela, Menu, useMensagens } from '@quiz/ui';

type TelaProvisoriaProps = { titulo: string; onVoltar: () => void };

/** O lugar de uma tela do hub que ainda não existe; os próximos tickets trocam por ela. */
export function TelaProvisoria({ titulo, onVoltar }: TelaProvisoriaProps) {
  const t = useMensagens().ui.provisoria;
  useEsc(onVoltar);
  return (
    <main className="tela-provisoria">
      <Janela titulo={titulo}>
        <p>{t.emBreve}</p>
        <Menu
          rotulo={titulo}
          itens={[{ id: 'voltar', rotulo: t.voltar }]}
          onEscolher={onVoltar}
          autoFoco
        />
        <p className="tela-provisoria-ajuda">{t.ajuda}</p>
      </Janela>
    </main>
  );
}

/** Esc volta, como em todo menu de JRPG. */
export function useEsc(acao: () => void) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') acao();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [acao]);
}
