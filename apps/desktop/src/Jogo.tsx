import { useCallback, useEffect, useRef, useState } from 'react';
import {
  aventuraMaisRecente,
  detalharVizinhas,
  lerAventuraSalva,
  porcentagemDoProgresso,
  tituloDoXp,
  type AventuraNoProjeto,
  type MudancaDaRegiao,
} from '@quiz/jogo';
import { AUTONIMO, ETIQUETA, formatar, MENSAGENS, nomeDoTitulo } from '@quiz/i18n';
import { IdiomaDaInterface, TelaInicial } from '@quiz/ui';
import { AvisoDeAtualizacao, useAtualizacao } from './Atualizacao.tsx';
import { detectarNoProjeto } from './desatualizacao.ts';
import { ITEM_DA_CONTA, ResumoDaConta, TelaDeEntrada, itemDaConta, useConta } from './Conta.tsx';
import { Enviado } from './Enviado.tsx';
import { idiomaSalvo, salvarIdioma } from './idioma.ts';
import { NovaAventura } from './NovaAventura.tsx';
import type { Linha } from './Linhas.tsx';
import { lerArquivosDoProjeto, transporteDoMestre } from './mestre.ts';
import { carregarAventuras, salvarAventura } from './sistema.ts';
import { useSincronia } from './sincronia.ts';
import { TelaDaExpedicao } from './TelaDaExpedicao.tsx';
import { nomeDoProjeto, TelaDoMapa } from './TelaDoMapa.tsx';
import { TelaDeIdioma } from './TelaDeIdioma.tsx';
import { TelaProvisoria } from './TelaProvisoria.tsx';
import { TrocaDeMestre } from './TrocaDeMestre.tsx';

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
  const [ultima, setUltima] = useState<string | undefined>();
  const voltar = useCallback(() => setTela('inicio'), []);
  const conta = useConta(idioma);
  // O progresso com o site: nunca segura o jogo (sincronia.ts).
  const sincronia = useSincronia(conta.sessao?.estado === 'conectado');
  const { registrar, carregadas } = sincronia;
  const atualizacao = useAtualizacao();
  // A Expedição em curso (região) e a última, onde o cursor volta no mapa.
  const [expedicao, setExpedicao] = useState<string | null>(null);
  const [ultimaRegiao, setUltimaRegiao] = useState<string | undefined>();
  const [detalhes, setDetalhes] = useState<{ ocupado: boolean; linhas: Linha[] }>({
    ocupado: false,
    linhas: [],
  });
  const voltarAoMapa = useCallback(() => setExpedicao(null), []);
  // O que mudou em cada região desde a revelação, por Aventura (lido do git ao abrir o mapa).
  const [mudancas, setMudancas] = useState<Record<string, Record<string, MudancaDaRegiao>>>({});
  const detectadas = useRef(new Set<string>());
  const aventurasAgora = useRef(aventuras);
  useEffect(() => {
    aventurasAgora.current = aventuras;
  }, [aventuras]);
  const [trocandoMestre, setTrocandoMestre] = useState(false);

  /** Toda mudança de uma Aventura vai para o disco na hora (o estado inteiro mora no arquivo). */
  const atualizar = useCallback(
    (aventura: AventuraNoProjeto) => {
      setAventuras((atuais) => [...atuais.filter((a) => a.id !== aventura.id), aventura]);
      void salvarAventura(aventura.id, JSON.stringify(aventura)).catch(() => undefined);
      // O ganho vai para o XP do Jogador; o fim de uma Expedição dispara o envio.
      registrar(aventura);
    },
    [registrar],
  );

  /** Detalha as regiões (vizinhas novas, ou uma que falhou antes), uma de cada vez. */
  const detalhar = useCallback(
    async (aventura: AventuraNoProjeto, ids: readonly string[]) => {
      const t = MENSAGENS[idioma].ui.expedicao;
      const nome = (id: string) => aventura.regioes.find((r) => r.id === id)?.nome ?? '???';
      const linhas: Linha[] = [];
      const mostrar = (linha: Linha, ocupado = true) => {
        linhas.push(linha);
        setDetalhes({ ocupado, linhas: [...linhas] });
      };
      setDetalhes({ ocupado: true, linhas: [] });
      try {
        const arquivos = await lerArquivosDoProjeto(aventura.repositorios);
        await detalharVizinhas(
          transporteDoMestre(aventura.mestre, aventura.repositorios),
          aventura,
          ids,
          {
            idioma,
            arquivos,
            gerarId: () => crypto.randomUUID(),
            aoAvancar: (e) => {
              const regiao = nome(e.regiaoId);
              if (e.tipo === 'detalhando') {
                mostrar({
                  tipo: 'andamento',
                  texto: formatar(t.detalhando, { regiao, n: e.indice + 1, total: e.total }),
                });
              } else if (e.tipo === 'detalhada') {
                atualizar(e.aventura);
                mostrar({ tipo: 'ok', texto: formatar(t.detalhada, { regiao }) });
              } else {
                mostrar({ tipo: 'recusada', texto: formatar(t.detalheFalhou, { regiao }) });
              }
            },
          },
        );
      } catch {
        for (const id of ids) {
          mostrar({ tipo: 'recusada', texto: formatar(t.detalheFalhou, { regiao: nome(id) }) });
        }
      }
      setDetalhes({ ocupado: false, linhas: [...linhas] });
    },
    [atualizar, idioma],
  );

  useEffect(() => {
    let vivo = true;
    void aventurasGuardadas().then((lidas) => {
      if (!vivo) return;
      setAventuras(lidas);
      carregadas(lidas);
    });
    return () => {
      vivo = false;
    };
  }, [carregadas]);

  // Ao abrir uma Aventura, uma vez por sessão: a detecção da Região desatualizada (só git, sem IA).
  const abertaId = tela === 'continuar' ? recente?.id : undefined;
  useEffect(() => {
    const aberta = aventurasAgora.current.find((a) => a.id === abertaId);
    if (!aberta || detectadas.current.has(aberta.id)) return;
    detectadas.current.add(aberta.id);
    const agora = () => aventurasAgora.current.find((a) => a.id === aberta.id) ?? aberta;
    void detectarNoProjeto(aberta, agora)
      .then((r) => {
        if (r.aventura !== agora()) atualizar(r.aventura);
        setMudancas((atuais) => ({ ...atuais, [aberta.id]: r.mudancas }));
      })
      .catch(() => undefined);
  }, [abertaId, atualizar]);

  useEffect(() => {
    document.documentElement.lang = ETIQUETA[idioma];
    salvarIdioma(idioma);
  }, [idioma]);

  // O XP do Jogador: o contador da sincronia (com o que o site tem), nunca menos que as Aventuras.
  const xpTotal = Math.max(
    sincronia.jogador.xp,
    aventuras.reduce((soma, a) => soma + a.xp, 0),
  );
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
  if (conta.entrando) {
    conteudo = <TelaDeEntrada onCancelar={conta.cancelar} />;
  } else if (tela === 'inicio') {
    conteudo = (
      <TelaInicial
        itens={[
          ...DO_HUB.map((id) => ({
            id,
            rotulo: nomes[id],
            desabilitado: id === 'continuar' && !recente,
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
        <p className="conta-resumo">
          {formatar(MENSAGENS[idioma].ui.aventura.xp, {
            xp: xpTotal,
            titulo: nomeDoTitulo(tituloDoXp(xpTotal).atual.nome, idioma),
          })}
        </p>
        <ResumoDaConta {...conta} />
        <AvisoDeAtualizacao {...atualizacao} />
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
  } else if (tela === 'continuar' && recente && expedicao) {
    conteudo = (
      <TelaDaExpedicao
        key={`${recente.id}:${expedicao}`}
        aventura={recente}
        regiaoId={expedicao}
        xpDosOutros={xpTotal - recente.xp}
        onAtualizada={atualizar}
        onVitoria={(c) => void detalhar(c.aventura, c.novas)}
        detalhes={detalhes.linhas}
        onVoltar={voltarAoMapa}
      />
    );
  } else if (tela === 'continuar' && recente && trocandoMestre) {
    conteudo = (
      <TrocaDeMestre
        key={recente.id}
        aventura={recente}
        onTrocada={(trocada) => {
          atualizar(trocada);
          setDetalhes({
            ocupado: false,
            linhas: [
              {
                tipo: 'ok',
                texto: formatar(MENSAGENS[idioma].ui.aventura.troca.trocado, {
                  mestre: MENSAGENS[idioma].ui.nova.mestre[trocada.mestre],
                }),
              },
            ],
          });
          setTrocandoMestre(false);
        }}
        onVoltar={() => setTrocandoMestre(false)}
      />
    );
  } else if (tela === 'continuar' && recente) {
    conteudo = (
      <TelaDoMapa
        key={recente.id}
        aventura={recente}
        mudancas={mudancas[recente.id] ?? {}}
        xp={xpTotal}
        detalhes={detalhes}
        {...(ultimaRegiao && { inicial: ultimaRegiao })}
        onPartir={(id) => {
          setUltimaRegiao(id);
          setDetalhes({ ocupado: false, linhas: [] });
          setExpedicao(id);
        }}
        onDetalhar={(id) => void detalhar(recente, [id])}
        onTrocarMestre={() => setTrocandoMestre(true)}
        onVoltar={voltar}
      />
    );
  } else if (tela === 'nova') {
    conteudo = (
      <NovaAventura
        onVoltar={voltar}
        onCriada={(nova) => {
          setAventuras((atuais) => [...atuais.filter((a) => a.id !== nova.id), nova]);
          registrar(nova);
          setUltima('continuar');
          setTela('continuar');
        }}
      />
    );
  } else if (tela === 'enviado') {
    conteudo = (
      <Enviado
        envio={sincronia.envio}
        comConta={conta.sessao !== null && conta.sessao.estado !== 'desconectado'}
        onAbrir={sincronia.reler}
        onVoltar={voltar}
      />
    );
  } else {
    conteudo = <TelaProvisoria titulo={nomes[tela]} onVoltar={voltar} />;
  }

  return <IdiomaDaInterface idioma={idioma}>{conteudo}</IdiomaDaInterface>;
}
