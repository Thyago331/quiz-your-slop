import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ErroDoMestre,
  criarAventura,
  detalharNaAventura,
  montarAventura,
  nomearRepositorios,
  type ArquivosDoProjeto,
  type AventuraNoProjeto,
  type Classe,
  type EventoDoMestre,
  type IaDoMestre,
  type SaidaCriarAventura,
} from '@quiz/jogo';
import { emMaiusculas, formatar, type Mensagens } from '@quiz/i18n';
import {
  EscolhaDeClasse,
  Janela,
  Menu,
  Sprite,
  classesNaTela,
  useIdioma,
  useMensagens,
  type ItemMenu,
} from '@quiz/ui';
import { EscolhaDoMestre, estaPronta, primeiraPronta, useMestres } from './EscolhaDoMestre.tsx';
import { lerArquivosDoProjeto, transporteDoMestre } from './mestre.ts';
import { TelaDoRelatorio, itemDoRelatorio, type PedidoDeRelatorio } from './Relatorio.tsx';
import { ehErroDoSistema, escolherPasta, rodarGit, salvarAventura } from './sistema.ts';
import { useEsc } from './TelaProvisoria.tsx';

const PASSOS = ['projeto', 'mestre', 'classe', 'leitura', 'entrada'] as const;
type Passo = 1 | 2 | 3 | 4 | 5;

/** Uma pasta do Projeto, já conferida como repositório git (com o commit atual). */
type Pasta = { caminho: string; commit: string };

type Linha = { tipo: 'ok' | 'andamento' | 'recusada'; texto: string };

type Leitura =
  | { estado: 'lendo'; linhas: Linha[] }
  | { estado: 'erro'; linhas: Linha[]; erro: string; causa: unknown }
  | { estado: 'pronta'; linhas: Linha[]; saida: SaidaCriarAventura; arquivos: ArquivosDoProjeto };

type Detalhe =
  | { estado: 'escolhendo' }
  | { estado: 'detalhando'; texto: string }
  | { estado: 'erro'; erro: string; causa: unknown };

type Erros = Mensagens['ui']['nova']['erros'];

/** O texto claro para o Jogador a partir do que falhou (camada Rust, Mestre ou outro). */
export function mensagemDoErro(e: unknown, t: Erros): string {
  if (e instanceof ErroDoMestre) {
    return formatar(t.saida_invalida, {
      n: e.tentativas,
      detalhe: e.problemas.slice(0, 3).join('; '),
    });
  }
  if (ehErroDoSistema(e)) {
    if (e.codigo === 'mestre_ausente') return t.mestre_ausente;
    if (e.codigo === 'sem_modo_restrito')
      return formatar(t.sem_modo_restrito, { faltando: e.detalhe.faltando.join(', ') });
    if (e.codigo === 'raiz_nao_permitida')
      return formatar(t.raiz_nao_permitida, { pasta: e.detalhe });
    if (e.codigo === 'falhou') {
      return formatar(t.falhou, {
        detalhe: linhaDoErro(e.detalhe.stderr).slice(0, 300) || String(e.detalhe.codigo),
      });
    }
    if (e.codigo === 'tempo_esgotado')
      return formatar(t.tempo_esgotado, { segundos: e.detalhe.segundos });
    return formatar(t.outro, {
      detalhe: 'detalhe' in e ? `${e.codigo}: ${JSON.stringify(e.detalhe)}` : e.codigo,
    });
  }
  return formatar(t.outro, { detalhe: e instanceof Error ? e.message : String(e) });
}

/** O Codex abre o stderr com um cabeçalho: a linha que importa é a última `ERROR`. */
export function linhaDoErro(stderr: string): string {
  const linhas = stderr.trim().split(/\r?\n/);
  return (
    linhas
      .filter((l) => /^error\b/i.test(l.trim()))
      .at(-1)
      ?.trim() ?? stderr.trim()
  );
}

const nomeDaPasta = (caminho: string) =>
  caminho
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .pop() || caminho;

type NovaAventuraProps = {
  onVoltar: () => void;
  onCriada: (aventura: AventuraNoProjeto) => void;
};

/** A Nova Aventura em 5 passos (spec §13; protótipo variante D, `?tela=nova&passo=1..5`). */
export function NovaAventura({ onVoltar, onCriada }: NovaAventuraProps) {
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.nova;
  const [passo, setPasso] = useState<Passo>(1);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState<string | null>(null);
  // A IA que o Jogador marcou no passo 2; vale só se estiver pronta.
  const [ia, setIa] = useState<IaDoMestre | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [leitura, setLeitura] = useState<Leitura>({ estado: 'lendo', linhas: [] });
  const [detalhe, setDetalhe] = useState<Detalhe>({ estado: 'escolhendo' });
  // Cada leitura/detalhe tem um número: voltar no meio faz a resposta antiga ser ignorada.
  const geracao = useRef(0);
  // O relatório de erro aberto (opcional, Relatorio.tsx).
  const [relatorio, setRelatorio] = useState<PedidoDeRelatorio | null>(null);

  const repositorios = nomearRepositorios(pastas.map((p) => p.caminho));
  const mestres = useMestres(passo === 2 ? pastas.map((p) => p.caminho) : null);
  const escolhida = ia && estaPronta(mestres, ia) ? ia : (primeiraPronta(mestres) ?? null);
  // O Mestre que segue para a Leitura e fica na Aventura.
  const [mestre, setMestre] = useState<IaDoMestre>('claude_code');

  const voltar = useCallback(() => {
    geracao.current++;
    if (passo === 1) onVoltar();
    else if (passo === 5) setPasso(3);
    else setPasso((passo - 1) as Passo);
  }, [passo, onVoltar]);
  useEsc(relatorio ? () => {} : voltar);

  async function adicionarPasta() {
    setAviso(null);
    const caminho = await escolherPasta().catch(() => null);
    if (!caminho) return;
    if (pastas.some((p) => p.caminho === caminho)) {
      setAviso(formatar(t.projeto.repetida, { pasta: caminho }));
      return;
    }
    setConferindo(caminho);
    try {
      const commit = (await rodarGit(caminho, { tipo: 'rev_parse_head' })).trim();
      setPastas((atuais) => [...atuais, { caminho, commit }]);
    } catch {
      setAviso(formatar(t.projeto.semGit, { pasta: caminho }));
    } finally {
      setConferindo(null);
    }
  }

  async function ler(classeEscolhida: Classe) {
    const minha = ++geracao.current;
    const atual = () => geracao.current === minha;
    setPasso(4);
    const linhas: Linha[] = [];
    const mostrar = (linha: Linha) => {
      linhas.push(linha);
      if (atual()) setLeitura({ estado: 'lendo', linhas: [...linhas] });
    };
    setLeitura({ estado: 'lendo', linhas: [] });
    try {
      const arquivos = await lerArquivosDoProjeto(repositorios);
      mostrar({ tipo: 'ok', texto: formatar(t.leitura.arquivos, { n: arquivos.arquivos.size }) });
      const saida = await criarAventura(
        transporteDoMestre(mestre, repositorios),
        { idioma, repositorios, classe: classeEscolhida },
        {
          repositorios,
          arquivos,
          aoAcompanhar: (e) => mostrar(linhaDoEvento(e, t.leitura.lendo, t.leitura.recusada)),
        },
      );
      if (!atual()) return;
      mostrar({
        tipo: 'ok',
        texto: formatar(t.leitura.pronto, {
          nomes: saida.territorios.map((x) => x.nome).join(', '),
        }),
      });
      setLeitura({ estado: 'pronta', linhas: [...linhas], saida, arquivos });
      setDetalhe({ estado: 'escolhendo' });
      setPasso(5);
    } catch (e) {
      if (atual())
        setLeitura({
          estado: 'erro',
          linhas: [...linhas],
          erro: mensagemDoErro(e, t.erros),
          causa: e,
        });
    }
  }

  async function comecar(indice: number) {
    if (leitura.estado !== 'pronta' || !classe) return;
    const minha = ++geracao.current;
    const candidata = leitura.saida.candidatas_entrada[indice];
    if (!candidata) return;
    const gerarId = () => crypto.randomUUID();
    const agora = new Date().toISOString();
    const criada = montarAventura({
      id: crypto.randomUUID(),
      agora,
      mestre,
      classe,
      repositorios: repositorios.map((r, k) => ({ ...r, commit: pastas[k]?.commit ?? '' })),
      saida: leitura.saida,
      escolhida: indice,
      gerarId,
    });
    const aoAcompanhar = (e: EventoDoMestre) => {
      if (e.tipo === 'tentativa' && geracao.current === minha) {
        setDetalhe({
          estado: 'detalhando',
          texto: formatar(t.entrada.detalhando, { regiao: candidata.nome, n: e.numero, de: e.de }),
        });
      }
    };
    try {
      const aventura = await detalharNaAventura(
        transporteDoMestre(mestre, repositorios),
        criada,
        criada.regioes[0]!.id,
        {
          idioma,
          arquivos: leitura.arquivos,
          gerarId,
          aoAcompanhar,
        },
      );
      if (geracao.current !== minha) return;
      await salvarAventura(aventura.id, JSON.stringify(aventura));
      onCriada(aventura);
    } catch (e) {
      if (geracao.current === minha)
        setDetalhe({ estado: 'erro', erro: mensagemDoErro(e, t.erros), causa: e });
    }
  }

  /** Abre o relatório de um erro com o que o limpa: as pastas e os nomes que o Mestre deu. */
  function relatar(erro: unknown, onde: PedidoDeRelatorio['onde']) {
    const saida = leitura.estado === 'pronta' ? leitura.saida : null;
    const nomes = saida
      ? [
          ...saida.territorios.map((x) => x.nome),
          ...saida.candidatas_entrada.flatMap((c) => [c.nome, c.territorio_novo?.nome ?? '']),
        ]
      : [];
    setRelatorio({ erro, onde, mestre, repositorios, nomes });
  }

  if (relatorio) return <TelaDoRelatorio pedido={relatorio} onVoltar={() => setRelatorio(null)} />;

  let corpo: ReactNode;
  if (passo === 1) {
    const itens: ItemMenu[] = [
      { id: 'adicionar', rotulo: t.projeto.adicionar, desabilitado: conferindo !== null },
      ...pastas.map((p) => ({
        id: `remover:${p.caminho}`,
        rotulo: formatar(t.projeto.remover, { nome: nomeDaPasta(p.caminho) }),
      })),
      {
        id: 'proximo',
        rotulo: t.proximo,
        desabilitado: pastas.length === 0 || conferindo !== null,
      },
      { id: 'menu', rotulo: t.menu },
    ];
    corpo = (
      <>
        <h3 className="nova-pergunta">{t.projeto.pergunta}</h3>
        <ul className="nova-pastas" aria-label={t.passos.projeto}>
          {pastas.length === 0 && <li className="nova-apagado">{t.projeto.nenhuma}</li>}
          {pastas.map((p) => (
            <li key={p.caminho}>
              📁 {p.caminho} <span className="nova-ok">{t.projeto.git}</span>
            </li>
          ))}
        </ul>
        {conferindo && <p role="status">{formatar(t.projeto.conferindo, { pasta: conferindo })}</p>}
        {aviso && (
          <p className="nova-aviso" role="alert">
            {aviso}
          </p>
        )}
        <Menu
          rotulo={t.passos.projeto}
          itens={itens}
          autoFoco
          onEscolher={(id) => {
            if (id === 'adicionar') void adicionarPasta();
            else if (id === 'proximo') setPasso(2);
            else if (id === 'menu') onVoltar();
            else if (id.startsWith('remover:')) {
              const caminho = id.slice('remover:'.length);
              setPastas((atuais) => atuais.filter((p) => p.caminho !== caminho));
            }
          }}
        />
        <p className="nova-apagado">{t.projeto.dica}</p>
      </>
    );
  } else if (passo === 2) {
    corpo = (
      <>
        <h3 className="nova-pergunta">{t.mestre.pergunta}</h3>
        <EscolhaDoMestre
          mestres={mestres}
          escolhida={escolhida}
          onEscolhida={setIa}
          rotulo={t.passos.mestre}
          acoes={[
            { id: 'proximo', rotulo: t.proximo, desabilitado: !escolhida },
            { id: 'voltar', rotulo: t.voltar },
          ]}
          onAcao={(id) => {
            if (id === 'voltar') voltar();
            else if (escolhida) {
              setMestre(escolhida);
              setPasso(3);
            }
          }}
        />
      </>
    );
  } else if (passo === 3) {
    corpo = (
      <>
        <EscolhaDeClasse
          classes={classesNaTela(idioma)}
          onEscolher={(c) => {
            setClasse(c);
            void ler(c);
          }}
        />
        <Menu rotulo={t.voltar} itens={[{ id: 'voltar', rotulo: t.voltar }]} onEscolher={voltar} />
      </>
    );
  } else if (passo === 4) {
    corpo = (
      <>
        <h3 className="nova-pergunta">{t.leitura.titulo}</h3>
        <div className="nova-leitura">
          <Sprite nome="heroi" escala={8} />
          <ul className="nova-linhas" aria-live="polite">
            {leitura.linhas.map((l, k) => (
              <li key={k} className={`nova-linha--${l.tipo}`}>
                {l.texto}
              </li>
            ))}
            {leitura.estado === 'lendo' && <li className="nova-lendo">▮▮▮</li>}
          </ul>
        </div>
        {leitura.estado === 'erro' ? (
          <>
            <p className="nova-aviso" role="alert">
              {t.leitura.erro} {leitura.erro}
            </p>
            <Menu
              rotulo={t.passos.leitura}
              autoFoco
              itens={[
                { id: 'de-novo', rotulo: t.leitura.tentarDeNovo },
                itemDoRelatorio(idioma),
                { id: 'voltar', rotulo: t.voltar },
              ]}
              onEscolher={(id) => {
                if (id === 'voltar') voltar();
                else if (id === 'relatorio') relatar(leitura.causa, 'leitura');
                else if (classe) void ler(classe);
              }}
            />
          </>
        ) : (
          <p className="nova-apagado">{t.leitura.espera}</p>
        )}
      </>
    );
  } else if (leitura.estado === 'pronta') {
    const { saida } = leitura;
    const ocupado = detalhe.estado === 'detalhando';
    corpo = (
      <>
        <h3 className="nova-pergunta">{t.entrada.pergunta}</h3>
        {saida.aviso_classe && (
          <p className="nova-aviso" role="note">
            ⚠ {saida.aviso_classe}
          </p>
        )}
        <Menu
          rotulo={t.passos.entrada}
          autoFoco
          className="nova-candidatas"
          itens={[
            ...saida.candidatas_entrada.map((c, k) => ({
              id: String(k),
              desabilitado: ocupado,
              rotulo: (
                <span className="nova-candidata">
                  <span>
                    {c.nome} <span className="nova-apagado">({c.territorio_novo?.nome})</span>
                    {k === 0 && <span className="nova-ouro"> {t.entrada.sugestao}</span>}
                  </span>
                  <span className="nova-apagado">{c.motivo}</span>
                </span>
              ),
            })),
            { id: 'voltar', rotulo: t.voltar, desabilitado: ocupado },
          ]}
          onEscolher={(id) => (id === 'voltar' ? voltar() : void comecar(Number(id)))}
        />
        {detalhe.estado === 'detalhando' && <p role="status">{detalhe.texto}</p>}
        {detalhe.estado === 'erro' && (
          <>
            <p className="nova-aviso" role="alert">
              {t.entrada.erro} {detalhe.erro}
            </p>
            <Menu
              rotulo={t.entrada.erro}
              itens={[itemDoRelatorio(idioma)]}
              onEscolher={() => relatar(detalhe.causa, 'entrada')}
            />
          </>
        )}
        <p className="nova-apagado">{t.entrada.ajuda}</p>
      </>
    );
  }

  return (
    <main className="nova-aventura">
      <Janela titulo={emMaiusculas(idioma, t.titulo)} className="nova-janela">
        <ol
          className="nova-trilha"
          aria-label={formatar(t.passoAtual, {
            n: passo,
            total: 5,
            passo: t.passos[PASSOS[passo - 1]!],
          })}
        >
          {PASSOS.map((p, k) => (
            <li
              key={p}
              className={
                k + 1 === passo
                  ? 'nova-trilha--atual'
                  : k + 1 < passo
                    ? 'nova-trilha--feito'
                    : undefined
              }
              aria-current={k + 1 === passo ? 'step' : undefined}
            >
              {k + 1}. {t.passos[p]}
            </li>
          ))}
        </ol>
        {corpo}
        {passo !== 5 && passo !== 3 && <p className="nova-ajuda">{t.ajuda}</p>}
      </Janela>
    </main>
  );
}

function linhaDoEvento(e: EventoDoMestre, lendo: string, recusada: string): Linha {
  return e.tipo === 'tentativa'
    ? { tipo: 'andamento', texto: formatar(lendo, { n: e.numero, de: e.de }) }
    : {
        tipo: 'recusada',
        texto: formatar(recusada, { motivo: e.problemas.slice(0, 2).join('; ') }),
      };
}
