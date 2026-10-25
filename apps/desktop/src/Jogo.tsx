import { useCallback, useEffect, useState } from 'react';
import {
  aventuraMaisRecente,
  lerAventuraSalva,
  porcentagemDoProgresso,
  type AventuraNoProjeto,
} from '@quiz/jogo';
import { AUTONIMO, ETIQUETA, formatar, MENSAGENS } from '@quiz/i18n';
import { IdiomaDaInterface, TelaInicial } from '@quiz/ui';
import { idiomaSalvo, salvarIdioma } from './idioma.ts';
import { NovaAventura } from './NovaAventura.tsx';
import { carregarAventuras } from './sistema.ts';
import { nomeDoProjeto, TelaDoMapa } from './TelaDoMapa.tsx';
import { TelaDeIdioma } from './TelaDeIdioma.tsx';
import { TelaProvisoria } from './TelaProvisoria.tsx';

/** As telas do hub (spec §13, Título); `inicio` é o próprio hub. */
export type Tela = 'inicio' | 'continuar' | 'nova' | 'tutorial' | 'perfil' | 'enviado' | 'idioma';

const DO_HUB = ['continuar', 'nova', 'tutorial', 'perfil', 'enviado', 'idioma'] as const;
type TelaDoHub = (typeof DO_HUB)[number];
const ehTelaDoHub = (id: string): id is TelaDoHub => DO_HUB.some((t) => t === id);

/** As Aventuras guardadas que passam na conferência (um arquivo estragado é deixado de lado). */
async function aventurasGuardadas(): Promise<AventuraNoProjeto[]> {
  const textos = await carregarAventuras().catch(() => [] as string[]);
  return textos.flatMap((texto) => lerAventuraSalva(texto) ?? []);
}

/** O Jogo desktop: o hub e o lugar de cada tela dele. */
export function Jogo() {
  const [idioma, setIdioma] = useState(idiomaSalvo);
  const [aventuras, setAventuras] = useState<AventuraNoProjeto[]>([]);
  const recente = aventuraMaisRecente(aventuras);
  const [tela, setTela] = useState<Tela>('inicio');
  // Ao voltar ao hub, o cursor fica no item que levou à tela.
  const [ultima, setUltima] = useState<TelaDoHub | undefined>();
  const voltar = useCallback(() => setTela('inicio'), []);

  useEffect(() => {
    let vivo = true;
    void aventurasGuardadas().then((lidas) => vivo && setAventuras(lidas));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = ETIQUETA[idioma];
    salvarIdioma(idioma);
  }, [idioma]);

  const t = MENSAGENS[idioma].ui.inicio;
  const nomes: Record<TelaDoHub, string> = {
    continuar: recente
      ? formatar(MENSAGENS[idioma].ui.aventura.continuar, {
          nome: nomeDoProjeto(recente),
          progresso: porcentagemDoProgresso(recente.mapa),
        })
      : t.continuar,
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
  if (tela === 'inicio') {
    conteudo = (
      <TelaInicial
        itens={DO_HUB.map((id) => ({
          id,
          rotulo: nomes[id],
          desabilitado: id === 'continuar' && !recente,
        }))}
        inicial={ultima}
        onEscolher={abrir}
      />
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
  } else if (tela === 'continuar' && recente) {
    conteudo = <TelaDoMapa key={recente.id} aventura={recente} onVoltar={voltar} />;
  } else if (tela === 'nova') {
    conteudo = (
      <NovaAventura
        onVoltar={voltar}
        onCriada={(nova) => {
          setAventuras((atuais) => [...atuais.filter((a) => a.id !== nova.id), nova]);
          setUltima('continuar');
          setTela('continuar');
        }}
      />
    );
  } else {
    conteudo = <TelaProvisoria titulo={nomes[tela]} onVoltar={voltar} />;
  }

  return <IdiomaDaInterface idioma={idioma}>{conteudo}</IdiomaDaInterface>;
}
