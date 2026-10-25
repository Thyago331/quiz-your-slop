import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MINIMO_DE_DESAFIOS,
  PoucosDesafios,
  arvoreDoExplorador,
  avancar,
  concluirNaAventura,
  contestar,
  contestarDesafio,
  desafioAtual,
  iniciarExpedicao,
  lerCommits,
  mudancasParaOMestre,
  prepararNaAventura,
  regioesDoExplorador,
  responderDesafio,
  tituloDoXp,
  type ArquivosDoProjeto,
  type AventuraNoProjeto,
  type Expedicao,
  type EntradaPrepararExpedicao,
  type ExpedicaoConcluida,
  type OpcaoApontar,
  type Revelacao,
} from '@quiz/jogo';
import { emMaiusculas, formatar, nomeDoTitulo } from '@quiz/i18n';
import {
  Batalha,
  ExploradorDeCodigo,
  Janela,
  Menu,
  PalcoComCodigo,
  ResumoExpedicao,
  Sprite,
  classeNaTela,
  useIdioma,
  useMensagens,
  type ArquivoAberto,
  type PedidoDeContestacao,
} from '@quiz/ui';
import { gitDoProjeto } from './desatualizacao.ts';
import { ListaDeLinhas, type Linha } from './Linhas.tsx';
import { leitorDoProjeto, lerArquivosDoProjeto, transporteDoMestre } from './mestre.ts';
import { mensagemDoErro } from './NovaAventura.tsx';
import { useEsc } from './TelaProvisoria.tsx';

type Fase =
  | { tipo: 'preparando'; linhas: Linha[] }
  | { tipo: 'erro'; linhas: Linha[]; erro: string }
  | { tipo: 'batalha'; expedicao: Expedicao; contestacao?: PedidoDeContestacao }
  | { tipo: 'resumo'; concluida: ExpedicaoConcluida; xpAntes: number };

type TelaDaExpedicaoProps = {
  aventura: AventuraNoProjeto;
  regiaoId: string;
  /** O XP das outras Aventuras: o Título é do Jogador, somado em todas. */
  xpDosOutros: number;
  /** A Aventura mudou (Ligações escondidas, resultado): o Jogo guarda no disco. */
  onAtualizada: (aventura: AventuraNoProjeto) => void;
  /** Vitória com vizinhas novas: o Jogo as detalha (e mostra o andamento). */
  onVitoria: (concluida: ExpedicaoConcluida) => void;
  /** O andamento do detalhe das vizinhas, mostrado no resumo. */
  detalhes: readonly Linha[];
  onVoltar: () => void;
};

/**
 * A Expedição no Projeto: o Mestre prepara (com tentativas e conferência à vista), a batalha com o
 * explorador do código de verdade ao lado, a Contestação com o Mestre e o resumo.
 */
export function TelaDaExpedicao({
  aventura,
  regiaoId,
  xpDosOutros,
  onAtualizada,
  onVitoria,
  detalhes,
  onVoltar,
}: TelaDaExpedicaoProps) {
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.expedicao;
  const regiao = aventura.regioes.find((r) => r.id === regiaoId);
  const nomeRegiao = regiao?.nome ?? '???';
  const classe = classeNaTela(aventura.classe, idioma);
  const [fase, setFase] = useState<Fase>({ tipo: 'preparando', linhas: [] });
  const leitor = useMemo(() => leitorDoProjeto(aventura.repositorios), [aventura.repositorios]);
  const [todos, setTodos] = useState<string[]>([]);
  // Os arquivos commitados, lidos na preparação: a Contestação confere caminhos com eles.
  const arquivosDoProjeto = useRef<ArquivosDoProjeto | undefined>(undefined);
  // O HEAD na preparação (o código que o Mestre leu) e, se desatualizada, a lista nova de arquivos.
  const revelacao = useRef<Revelacao | undefined>(undefined);
  // Cada preparação tem um número: voltar no meio faz a resposta antiga ser ignorada.
  const geracao = useRef(0);
  const iniciou = useRef(false);
  const atual = useRef(aventura);
  useEffect(() => {
    atual.current = aventura;
  }, [aventura]);

  const voltar = useCallback(() => {
    geracao.current++;
    onVoltar();
  }, [onVoltar]);
  useEsc(fase.tipo === 'batalha' ? () => {} : voltar);

  const preparar = useCallback(async () => {
    const minha = ++geracao.current;
    const vale = () => geracao.current === minha;
    const linhas: Linha[] = [];
    const mostrar = (linha: Linha) => {
      linhas.push(linha);
      if (vale()) setFase({ tipo: 'preparando', linhas: [...linhas] });
    };
    setFase({ tipo: 'preparando', linhas: [] });
    try {
      const arquivos = await lerArquivosDoProjeto(atual.current.repositorios);
      arquivosDoProjeto.current = arquivos;
      if (vale()) setTodos([...arquivos.arquivos]);
      const commits = await lerCommits(atual.current.repositorios, gitDoProjeto).catch(() => ({}));
      // Região desatualizada: a Expedição é sobre o que mudou (o diff, ou só a lista se for grande).
      let mudancas: EntradaPrepararExpedicao['mudancas'];
      if (atual.current.mapa.estados[regiaoId] === 'desatualizada') {
        mudancas = await mudancasParaOMestre(atual.current, regiaoId, gitDoProjeto).catch(
          (): NonNullable<typeof mudancas> => ({ arquivos_alterados: [] }),
        );
        const n = mudancas.arquivos_alterados.length;
        mostrar({
          tipo: 'andamento',
          texto: formatar(mudancas.diff === undefined ? t.semDiff : t.sobreMudancas, { n }),
        });
      }
      const r = await prepararNaAventura(
        transporteDoMestre(atual.current.mestre, atual.current.repositorios),
        atual.current,
        regiaoId,
        {
          idioma,
          lerArquivo: leitor.ler,
          arquivos,
          gerarId: () => crypto.randomUUID(),
          ...(mudancas && { mudancas }),
          aoAcompanhar: (e) =>
            mostrar(
              e.tipo === 'tentativa'
                ? { tipo: 'andamento', texto: formatar(t.tentativa, { n: e.numero, de: e.de }) }
                : {
                    tipo: 'recusada',
                    texto: formatar(t.recusada, { motivo: e.problemas.slice(0, 2).join('; ') }),
                  },
            ),
          aoPreparar: (e) =>
            mostrar(
              e.tipo === 'pedido'
                ? {
                    tipo: 'andamento',
                    texto: formatar(t.pedido, {
                      quantidade: e.quantidade,
                      regiao: nomeRegiao,
                      n: e.numero,
                    }),
                  }
                : {
                    tipo: e.descartados > 0 ? 'recusada' : 'ok',
                    texto: `${e.descartados > 0 ? '✘' : '✔'} ${formatar(t.conferida, {
                      validos: e.validos,
                      quantidade: e.quantidade,
                      descartados: e.descartados,
                    })}`,
                  },
            ),
        },
      );
      if (!vale()) return;
      revelacao.current = {
        commits,
        ...(r.arquivos_atualizados && { arquivos: r.arquivos_atualizados }),
      };
      onAtualizada(r.aventura);
      setFase({ tipo: 'batalha', expedicao: iniciarExpedicao(regiaoId, r.desafios) });
    } catch (e) {
      if (!vale()) return;
      const erro =
        e instanceof PoucosDesafios
          ? formatar(t.poucos, { n: e.validos, minimo: MINIMO_DE_DESAFIOS })
          : mensagemDoErro(e, m.ui.nova.erros);
      setFase({ tipo: 'erro', linhas: [...linhas], erro });
    }
  }, [idioma, leitor, m, nomeRegiao, onAtualizada, regiaoId, t]);

  useEffect(() => {
    // Uma vez só (o StrictMode monta duas vezes; cada preparação é uma CLI inteira).
    if (iniciou.current) return;
    iniciou.current = true;
    void preparar();
  }, [preparar]);

  /**
   * A Contestação real: o Mestre relê o código (uma CLI inteira, leva um tempo). O veredito só vale
   * para a batalha que o pediu; falha vira erro com tentar de novo ou desistir, sem perder nada.
   */
  async function contestarNoMestre(expedicao: Expedicao, argumento: string) {
    const mesma = (f: Fase): f is Extract<Fase, { tipo: 'batalha' }> =>
      f.tipo === 'batalha' && f.expedicao === expedicao;
    setFase({ tipo: 'batalha', expedicao, contestacao: { estado: 'esperando', argumento } });
    try {
      const resposta = expedicao.respostas[expedicao.atual]?.resposta ?? [];
      const reavaliacao = await contestar(
        transporteDoMestre(atual.current.mestre, atual.current.repositorios),
        { idioma, desafio: desafioAtual(expedicao), resposta_jogador: [...resposta], argumento },
        {
          repositorios: atual.current.repositorios,
          lerArquivo: leitor.ler,
          ...(arquivosDoProjeto.current && { arquivos: arquivosDoProjeto.current }),
        },
      );
      setFase((f) =>
        mesma(f)
          ? { tipo: 'batalha', expedicao: contestarDesafio(expedicao, argumento, reavaliacao) }
          : f,
      );
    } catch (e) {
      const erro = mensagemDoErro(e, m.ui.nova.erros);
      setFase((f) => (mesma(f) ? { ...f, contestacao: { estado: 'falhou', argumento, erro } } : f));
    }
  }

  function seguir(expedicao: Expedicao) {
    const proxima = avancar(expedicao);
    if (proxima.fase !== 'encerrada') {
      setFase({ tipo: 'batalha', expedicao: proxima });
      return;
    }
    const xpAntes = xpDosOutros + atual.current.xp;
    const concluida = concluirNaAventura(atual.current, proxima, {
      gerarId: () => crypto.randomUUID(),
      agora: new Date().toISOString(),
      ...(revelacao.current && { revelacao: revelacao.current }),
    });
    onAtualizada(concluida.aventura);
    setFase({ tipo: 'resumo', concluida, xpAntes });
    if (concluida.novas.length > 0) onVitoria(concluida);
  }

  if (fase.tipo === 'batalha') {
    return (
      <main className="tela-expedicao">
        <BatalhaNoProjeto
          aventura={aventura}
          expedicao={fase.expedicao}
          nomeRegiao={nomeRegiao}
          heroi={classe?.sprite ?? 'heroi'}
          leitor={leitor}
          todos={todos}
          {...(fase.contestacao && { contestacao: fase.contestacao })}
          onResponder={(resposta) =>
            setFase({ tipo: 'batalha', expedicao: responderDesafio(fase.expedicao, resposta) })
          }
          onAvancar={() => seguir(fase.expedicao)}
          onContestar={(argumento) => void contestarNoMestre(fase.expedicao, argumento.trim())}
          onTentarContestarDeNovo={() =>
            fase.contestacao && void contestarNoMestre(fase.expedicao, fase.contestacao.argumento)
          }
          onDesistirDeContestar={() => setFase({ tipo: 'batalha', expedicao: fase.expedicao })}
        />
      </main>
    );
  }

  if (fase.tipo === 'resumo') {
    const { concluida, xpAntes } = fase;
    const nomes = (ids: readonly string[]) =>
      ids.map((id) => concluida.aventura.regioes.find((r) => r.id === id)?.nome ?? '???');
    const antes = tituloDoXp(xpAntes).atual.nome;
    const agora = tituloDoXp(xpAntes + concluida.resultado.xp).atual.nome;
    return (
      <main className="tela-expedicao tela-expedicao--resumo">
        <ResumoExpedicao
          resultado={concluida.resultado}
          nomeRegiao={nomeRegiao}
          descobertas={nomes(concluida.descobertas)}
          {...(agora !== antes && { novoTitulo: nomeDoTitulo(agora, idioma) })}
          onVoltar={onVoltar}
        />
        {detalhes.length > 0 && (
          <Janela>
            <ListaDeLinhas linhas={detalhes} />
          </Janela>
        )}
      </main>
    );
  }

  return (
    <main className="tela-expedicao">
      <Janela titulo={emMaiusculas(idioma, nomeRegiao)} className="nova-janela">
        <h3 className="nova-pergunta">{t.preparando}</h3>
        <div className="nova-leitura">
          <Sprite nome={classe?.sprite ?? 'heroi'} escala={8} />
          <ListaDeLinhas linhas={fase.linhas} lendo={fase.tipo === 'preparando'} />
        </div>
        {fase.tipo === 'erro' ? (
          <>
            <p className="nova-aviso" role="alert">
              {t.erro} {fase.erro}
            </p>
            <Menu
              rotulo={t.erro}
              autoFoco
              itens={[
                { id: 'de-novo', rotulo: t.tentarDeNovo },
                { id: 'voltar', rotulo: t.voltar },
              ]}
              onEscolher={(id) => (id === 'voltar' ? voltar() : void preparar())}
            />
          </>
        ) : (
          <>
            <p className="nova-apagado">{t.espera}</p>
            <Menu
              rotulo={t.voltar}
              itens={[{ id: 'voltar', rotulo: t.voltar }]}
              onEscolher={voltar}
            />
          </>
        )}
      </Janela>
    </main>
  );
}

type BatalhaNoProjetoProps = {
  aventura: AventuraNoProjeto;
  expedicao: Expedicao;
  nomeRegiao: string;
  heroi: Parameters<typeof Batalha>[0]['heroi'];
  leitor: ReturnType<typeof leitorDoProjeto>;
  todos: readonly string[];
  contestacao?: PedidoDeContestacao;
  onResponder: (resposta: string[]) => void;
  onAvancar: () => void;
  onContestar: (argumento: string) => void;
  onTentarContestarDeNovo: () => void;
  onDesistirDeContestar: () => void;
};

/**
 * A batalha com o explorador ao lado: a árvore do Projeto com a Névoa, o código lido do disco, e
 * cada Evidência abre o arquivo nas linhas dela.
 */
function BatalhaNoProjeto({
  aventura,
  expedicao,
  nomeRegiao,
  heroi,
  leitor,
  todos,
  contestacao,
  onResponder,
  onAvancar,
  onContestar,
  onTentarContestarDeNovo,
  onDesistirDeContestar,
}: BatalhaNoProjetoProps) {
  const m = useMensagens();
  const semente = aventura.regioes.find((r) => r.id === expedicao.regiaoId)?.arquivos_semente[0];
  const [aberto, setAberto] = useState<ArquivoAberto | null>(semente ? { caminho: semente } : null);
  const [aba, setAba] = useState<'principal' | 'codigo'>('principal');
  // O cache não é estado: cada arquivo que chega do disco pede um novo desenho.
  const [, setLidos] = useState(0);
  const citados = useMemo(
    () => [
      ...new Set(
        expedicao.desafios.flatMap((d) => [
          ...d.evidencias.map((e) => e.caminho),
          ...(d.formato === 'apontar' ? d.opcoes.map((o) => (o as OpcaoApontar).caminho) : []),
        ]),
      ),
    ],
    [expedicao.desafios],
  );
  const grupos = useMemo(
    () =>
      arvoreDoExplorador({
        territorios: aventura.territorios,
        ...regioesDoExplorador(aventura, todos, citados),
      }),
    [aventura, todos, citados],
  );

  const caminho = aberto?.caminho;
  useEffect(() => {
    if (caminho === undefined || leitor.cache.has(caminho)) return;
    let vivo = true;
    void leitor.ler(caminho).then(() => vivo && setLidos((n) => n + 1));
    return () => {
      vivo = false;
    };
  }, [caminho, leitor]);

  return (
    <PalcoComCodigo
      aba={aba}
      onTrocarAba={setAba}
      codigo={
        <ExploradorDeCodigo
          grupos={grupos}
          lerArquivo={(c) => leitor.cache.get(c)}
          aberto={aberto}
          onAbrir={(c) => setAberto({ caminho: c })}
        />
      }
      principal={
        <Batalha
          expedicao={expedicao}
          estados={aventura.mapa.estados}
          nomeRegiao={nomeRegiao}
          heroi={heroi}
          onResponder={onResponder}
          onAvancar={onAvancar}
          onContestar={onContestar}
          {...(contestacao && { pedidoDeContestacao: contestacao })}
          onTentarContestarDeNovo={onTentarContestarDeNovo}
          onDesistirDeContestar={onDesistirDeContestar}
          textoDoCacador={m.ui.batalha.cacadorNoProjeto}
          onAbrirEvidencia={(ev) => {
            setAberto({ caminho: ev.caminho, inicio: ev.linha_inicio, fim: ev.linha_fim });
            setAba('codigo');
          }}
        />
      }
    />
  );
}
