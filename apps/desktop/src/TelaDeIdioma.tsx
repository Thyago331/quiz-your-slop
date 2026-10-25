import { AUTONIMO, ETIQUETA, IDIOMAS, type Idioma } from '@quiz/i18n';
import { Janela, Menu, useMensagens } from '@quiz/ui';
import { useEsc } from './TelaProvisoria.tsx';

type TelaDeIdiomaProps = {
  atual: Idioma;
  onEscolher: (idioma: Idioma) => void;
  onVoltar: () => void;
};

/** Português, English, Español: cada um no próprio nome; o cursor começa no atual. */
export function TelaDeIdioma({ atual, onEscolher, onVoltar }: TelaDeIdiomaProps) {
  const t = useMensagens().ui;
  useEsc(onVoltar);
  const itens = [
    ...IDIOMAS.map((idioma) => ({
      id: idioma,
      rotulo: <span lang={ETIQUETA[idioma]}>{AUTONIMO[idioma]}</span>,
    })),
    { id: 'voltar', rotulo: t.provisoria.voltar },
  ];
  return (
    <main className="tela-provisoria">
      <Janela titulo={t.idioma}>
        <Menu
          rotulo={t.idioma}
          itens={itens}
          inicial={atual}
          autoFoco
          onEscolher={(id) => {
            const idioma = IDIOMAS.find((i) => i === id);
            if (idioma) onEscolher(idioma);
            else onVoltar();
          }}
        />
        <p className="tela-provisoria-ajuda">{t.inicio.ajuda}</p>
      </Janela>
    </main>
  );
}
