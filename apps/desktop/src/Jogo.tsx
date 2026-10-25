import { useCallback, useEffect, useState } from 'react';
import { AUTONIMO, ETIQUETA, formatar, MENSAGENS } from '@quiz/i18n';
import { IdiomaDaInterface, TelaInicial } from '@quiz/ui';
import { ITEM_DA_CONTA, ResumoDaConta, TelaDeEntrada, itemDaConta, useConta } from './Conta.tsx';
import { idiomaSalvo, salvarIdioma } from './idioma.ts';
import { TelaDeIdioma } from './TelaDeIdioma.tsx';
import { TelaProvisoria } from './TelaProvisoria.tsx';

/** As telas do hub (spec §13, Título); `inicio` é o próprio hub. */
export type Tela = 'inicio' | 'continuar' | 'nova' | 'tutorial' | 'perfil' | 'enviado' | 'idioma';

const DO_HUB = ['continuar', 'nova', 'tutorial', 'perfil', 'enviado', 'idioma'] as const;
type TelaDoHub = (typeof DO_HUB)[number];
const ehTelaDoHub = (id: string): id is TelaDoHub => DO_HUB.some((t) => t === id);

type JogoProps = {
  /** Há uma Aventura salva para continuar. O arquivo local da Aventura chega com a Nova Aventura. */
  haAventura?: boolean;
};

/** O Jogo desktop: por enquanto, o hub e o lugar de cada tela dele. */
export function Jogo({ haAventura = false }: JogoProps) {
  const [idioma, setIdioma] = useState(idiomaSalvo);
  const [tela, setTela] = useState<Tela>('inicio');
  // Ao voltar ao hub, o cursor fica no item que levou à tela.
  const [ultima, setUltima] = useState<string | undefined>();
  const voltar = useCallback(() => setTela('inicio'), []);
  const conta = useConta(idioma);

  useEffect(() => {
    document.documentElement.lang = ETIQUETA[idioma];
    salvarIdioma(idioma);
  }, [idioma]);

  const t = MENSAGENS[idioma].ui.inicio;
  const nomes: Record<TelaDoHub, string> = {
    continuar: t.continuar,
    nova: t.novaAventura,
    tutorial: t.tutorial,
    perfil: t.perfil,
    enviado: t.enviado,
    idioma: formatar(t.idioma, { idioma: AUTONIMO[idioma] }),
  };

  function abrir(id: string) {
    if (!ehTelaDoHub(id)) return;
    setUltima(id);
    setTela(id);
  }

  let conteudo;
  if (conta.entrando) {
    conteudo = <TelaDeEntrada onCancelar={conta.cancelar} />;
  } else if (tela === 'inicio') {
    conteudo = (
      <TelaInicial
        itens={[
          ...DO_HUB.map((id) => ({
            id,
            rotulo: nomes[id],
            desabilitado: id === 'continuar' && !haAventura,
          })),
          itemDaConta(conta, idioma),
        ]}
        inicial={ultima}
        onEscolher={(id) => {
          if (id !== ITEM_DA_CONTA) return abrir(id);
          setUltima(id);
          conta.alternar();
        }}
      >
        <ResumoDaConta {...conta} />
      </TelaInicial>
    );
  } else if (tela === 'idioma') {
    conteudo = (
      <TelaDeIdioma
        atual={idioma}
        onEscolher={(novo) => {
          setIdioma(novo);
          voltar();
        }}
        onVoltar={voltar}
      />
    );
  } else {
    conteudo = <TelaProvisoria titulo={nomes[tela]} onVoltar={voltar} />;
  }

  return <IdiomaDaInterface idioma={idioma}>{conteudo}</IdiomaDaInterface>;
}
