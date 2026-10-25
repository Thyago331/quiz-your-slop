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
import { lerArquivosDoProjeto, transporteClaudeCode } from './mestre.ts';
import {
  comandoDoMestre,
  detectarMestre,
  ehErroDoSistema,
  escolherPasta,
  rodarGit,
  salvarAventura,
  type DeteccaoDoMestre,
} from './sistema.ts';
import { useEsc } from './TelaProvisoria.tsx';

const PASSOS = ['projeto', 'mestre', 'classe', 'leitura', 'entrada'] as const;
type Passo = 1 | 2 | 3 | 4 | 5;

/** Uma pasta do Projeto, já conferida como repositório git (com o commit atual). */
type Pasta = { caminho: string; commit: string };

type Linha = { tipo: 'ok' | 'andamento' | 'recusada'; texto: string };

type Leitura =
  | { estado: 'lendo'; linhas: Linha[] }
  | { estado: 'erro'; linhas: Linha[]; erro: string }
  | { estado: 'pronta'; linhas: Linha[]; saida: SaidaCriarAventura; arquivos: ArquivosDoProjeto };

type Detalhe =
  | { estado: 'escolhendo' }
  | { estado: 'detalhando'; texto: string }
  | { estado: 'erro'; erro: string };

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
    if (e.codigo === 'falhou') {
      return formatar(t.falhou, {
        detalhe: e.detalhe.stderr.trim().slice(0, 300) || String(e.detalhe.codigo),
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
  const [deteccao, setDeteccao] = useState<DeteccaoDoMestre | 'procurando'>('procurando');
  const [comando, setComando] = useState<string | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [leitura, setLeitura] = useState<Leitura>({ estado: 'lendo', linhas: [] });
  const [detalhe, setDetalhe] = useState<Detalhe>({ estado: 'escolhendo' });
  // Cada leitura/detalhe tem um número: voltar no meio faz a resposta antiga ser ignorada.
  const geracao = useRef(0);

  const repositorios = nomearRepositorios(pastas.map((p) => p.caminho));

  const voltar = useCallback(() => {
    geracao.current++;
    if (passo === 1) onVoltar();
    else if (passo === 5) setPasso(3);
    else setPasso((passo - 1) as Passo);
  }, [passo, onVoltar]);
  useEsc(voltar);

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

  async function irParaOMestre() {
    setPasso(2);
    setDeteccao('procurando');
    setComando(null);
    const [raiz = '', ...extras] = pastas.map((p) => p.caminho);
    const [d, c] = await Promise.allSettled([
      detectarMestre('claude_code'),
      comandoDoMestre('claude_code', raiz, extras),
    ]);
    setDeteccao(d.status === 'fulfilled' ? d.value : { estado: 'ausente' });
    setComando(c.status === 'fulfilled' ? c.value : null);
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
        transporteClaudeCode(repositorios),
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
        setLeitura({ estado: 'erro', linhas: [...linhas], erro: mensagemDoErro(e, t.erros) });
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
      mestre: 'claude_code',
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
        transporteClaudeCode(repositorios),
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
        setDetalhe({ estado: 'erro', erro: mensagemDoErro(e, t.erros) });
    }
  }

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
            else if (id === 'proximo') void irParaOMestre();
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
    const pronta = deteccao !== 'procurando' && deteccao.estado === 'pronta';
    const estado =
      deteccao === 'procurando'
        ? t.mestre.procurando
        : deteccao.estado === 'pronta'
          ? formatar(t.mestre.encontrado, { versao: deteccao.versao })
          : deteccao.estado === 'ausente'
            ? t.mestre.ausente
            : formatar(t.mestre.semModoRestrito, { opcoes: deteccao.faltando.join(' ') });
    corpo = (
      <>
        <h3 className="nova-pergunta">{t.mestre.pergunta}</h3>
        <Menu
          key={pronta ? 'pronta' : 'esperando'}
          rotulo={t.passos.mestre}
          autoFoco
          itens={[
            {
              id: 'claude_code',
              rotulo: (
                <>
                  {t.mestre.claude_code}{' '}
                  <span className={pronta ? 'nova-ok' : 'nova-aviso'}>{estado}</span>
                </>
              ),
              desabilitado: !pronta,
            },
            { id: 'codex', rotulo: `${t.mestre.codex} ${t.mestre.emBreve}`, desabilitado: true },
            { id: 'proximo', rotulo: t.proximo, desabilitado: !pronta },
            { id: 'voltar', rotulo: t.voltar },
          ]}
          inicial={pronta ? 'claude_code' : 'voltar'}
          onEscolher={(id) => (id === 'voltar' ? voltar() : setPasso(3))}
        />
        {deteccao !== 'procurando' && !pronta && <p className="nova-aviso">{t.mestre.nenhum}</p>}
        <div className="nova-so-ler">
          <p className="nova-so-ler-titulo">{t.mestre.soLer}</p>
          <p>{formatar(t.mestre.explicacao, { provedor: 'Anthropic' })}</p>
          {comando && (
            <>
              <p className="nova-apagado">{t.mestre.comando}</p>
              <code className="nova-comando">{comando}</code>
            </>
          )}
        </div>
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
                { id: 'voltar', rotulo: t.voltar },
              ]}
              onEscolher={(id) => (id === 'voltar' ? voltar() : classe && void ler(classe))}
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
          <p className="nova-aviso" role="alert">
            {t.entrada.erro} {detalhe.erro}
          </p>
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
