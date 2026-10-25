'use client';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  caminhosVisiveis,
  type GrupoDoExplorador,
  type LerArquivo,
  type NoExplorador,
} from '@quiz/jogo';
import { emMaiusculas, formatar } from '@quiz/i18n';
import { useIdioma, useMensagens } from './idioma.tsx';
import { Janela } from './Janela.tsx';
import { linguagemDe, realcar } from './realce.ts';

/** O arquivo no visualizador; inicio/fim (1-based, inclusivos) destacam linhas, como uma Evidência. */
export type ArquivoAberto = { caminho: string; inicio?: number; fim?: number };

type ArvoreDeArquivosProps = {
  grupos: readonly GrupoDoExplorador[];
  /** Caminho do arquivo aberto, marcado na árvore. */
  aberto?: string;
  onAbrir: (caminho: string) => void;
};

/**
 * A árvore do Projeto por Território e pastas. Arquivo na Névoa é só uma forma borrada: não é
 * botão, não recebe foco e o nome que aparece é a máscara que vem das regras do Jogo.
 */
export function ArvoreDeArquivos({ grupos, aberto, onAbrir }: ArvoreDeArquivosProps) {
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.explorador;
  const nos = (filhos: readonly NoExplorador[]): ReactNode => (
    <ul className="explorador-nos">
      {filhos.map((no, k) => {
        if (no.tipo === 'pasta') {
          return (
            <li key={no.naNevoa ? `nevoa-${k}` : no.nome}>
              {no.naNevoa ? (
                <span
                  className="explorador-pasta explorador-nevoa"
                  role="img"
                  aria-label={t.pastaNaNevoa}
                >
                  {no.nome}/
                </span>
              ) : (
                <span className="explorador-pasta">{no.nome}/</span>
              )}
              {nos(no.filhos)}
            </li>
          );
        }
        if (no.naNevoa) {
          return (
            <li key={`nevoa-${k}`}>
              <span
                className="explorador-arquivo explorador-nevoa"
                role="img"
                aria-label={t.arquivoNaNevoa}
              >
                {no.nome}
              </span>
            </li>
          );
        }
        const atual = no.caminho === aberto;
        return (
          <li key={no.caminho}>
            <button
              type="button"
              className="explorador-arquivo"
              aria-current={atual ? 'true' : undefined}
              title={no.caminho}
              onClick={() => onAbrir(no.caminho)}
            >
              {no.nome}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="explorador-arvore" aria-label={t.arquivos}>
      {grupos.map((grupo) => (
        <div key={grupo.territorioId ?? '—'} className="explorador-grupo">
          <h3 className="explorador-territorio">
            {emMaiusculas(idioma, grupo.territorioId === null ? m.jogo.outrosArquivos : grupo.nome)}
          </h3>
          {nos(grupo.filhos)}
        </div>
      ))}
    </nav>
  );
}

type VisualizadorDeCodigoProps = {
  /** Cada novo objeto rola de novo até as linhas, mesmo que sejam as mesmas de antes. */
  aberto: ArquivoAberto;
  conteudo: string;
};

/** Código somente leitura, com números de linha e destaque de sintaxe; rola até as linhas destacadas. */
export function VisualizadorDeCodigo({ aberto, conteudo }: VisualizadorDeCodigoProps) {
  const t = useMensagens().ui.explorador;
  const { caminho, inicio, fim = inicio } = aberto;
  const linhas = useMemo(() => realcar(conteudo, linguagemDe(caminho)), [conteudo, caminho]);
  const caixa = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = caixa.current;
    if (!pre) return;
    const alvo =
      aberto.inicio !== undefined
        ? pre.querySelector<HTMLElement>(`[data-linha="${aberto.inicio}"]`)
        : null;
    // Rola só a caixa do código (não a página), deixando um pouco de contexto acima.
    pre.scrollTop = alvo ? Math.max(0, alvo.offsetTop - 2 * alvo.offsetHeight) : 0;
  }, [aberto]);

  const destacada = (n: number) =>
    inicio !== undefined && fim !== undefined && n >= inicio && n <= fim;
  const rotulo =
    inicio !== undefined
      ? formatar(t.codigoDeLinhas, {
          caminho,
          linhas: `${inicio}${fim !== inicio ? `–${fim}` : ''}`,
        })
      : formatar(t.codigoDe, { caminho });

  return (
    <pre ref={caixa} className="codigo explorador-codigo" tabIndex={0} aria-label={rotulo}>
      {/* Embrulho da largura da linha mais longa: o destaque cobre a linha inteira ao rolar. */}
      <span className="explorador-linhas">
        {linhas.map((tokens, k) => {
          const n = k + 1;
          return (
            <span
              key={n}
              data-linha={n}
              className={destacada(n) ? 'codigo-linha codigo-linha--destaque' : 'codigo-linha'}
            >
              <span className="codigo-numero" aria-hidden>
                {n}
              </span>
              {tokens.map((t, j) =>
                t.tipo ? (
                  <span key={j} className={`tok-${t.tipo}`}>
                    {t.texto}
                  </span>
                ) : (
                  t.texto
                ),
              )}
            </span>
          );
        })}
      </span>
    </pre>
  );
}

type ExploradorDeCodigoProps = {
  /** A árvore já com a Névoa aplicada (arvoreDoExplorador). */
  grupos: readonly GrupoDoExplorador[];
  lerArquivo: LerArquivo;
  aberto: ArquivoAberto | null;
  onAbrir: (caminho: string) => void;
  className?: string;
};

/**
 * O explorador de código do Tutorial (spec §9): árvore + visualizador. Só lê arquivos que a árvore
 * mostra; pedir um arquivo na Névoa (por uma Evidência, por exemplo) mostra a nuvem, não o código.
 */
export function ExploradorDeCodigo({
  grupos,
  lerArquivo,
  aberto,
  onAbrir,
  className,
}: ExploradorDeCodigoProps) {
  const idioma = useIdioma();
  const t = useMensagens().ui.explorador;
  const visiveis = useMemo(() => caminhosVisiveis(grupos), [grupos]);
  const raiz = useRef<HTMLDivElement>(null);
  const visivel = aberto !== null && visiveis.has(aberto.caminho);
  const conteudo = visivel ? lerArquivo(aberto.caminho) : undefined;

  // Aberto por uma Evidência: se o explorador está fora da vista (celular, empilhado), vai até ele.
  useEffect(() => {
    if (aberto?.inicio === undefined) return;
    const caixa = raiz.current?.getBoundingClientRect();
    if (caixa && (caixa.top < 0 || caixa.top > window.innerHeight)) {
      raiz.current?.scrollIntoView?.({ block: 'start' });
    }
  }, [aberto]);

  let visor: ReactNode;
  if (aberto === null) {
    visor = <p className="texto-apagado">{t.escolha}</p>;
  } else if (!visivel) {
    visor = (
      <p className="explorador-aviso" role="status">
        {t.naNevoa}
      </p>
    );
  } else if (conteudo === undefined) {
    visor = <p className="texto-erro">{t.naoEncontrado}</p>;
  } else {
    visor = <VisualizadorDeCodigo aberto={aberto} conteudo={conteudo} />;
  }

  return (
    <div ref={raiz} className={className ? `explorador ${className}` : 'explorador'}>
      <Janela titulo={emMaiusculas(idioma, t.titulo)}>
        <div className="explorador-corpo">
          <ArvoreDeArquivos grupos={grupos} aberto={aberto?.caminho} onAbrir={onAbrir} />
          <div className="explorador-visor">
            <div className="explorador-caminho">
              📜 {visivel ? aberto.caminho : aberto ? '???' : '—'}
            </div>
            {visor}
          </div>
        </div>
      </Janela>
    </div>
  );
}

type PalcoComCodigoProps = {
  /** A batalha (ou o que estiver em cena). */
  principal: ReactNode;
  /** O explorador de código. */
  codigo: ReactNode;
  aba: 'principal' | 'codigo';
  onTrocarAba: (aba: 'principal' | 'codigo') => void;
  rotuloPrincipal?: string;
};

/**
 * Cena + explorador lado a lado em tela larga; no celular, uma aba de cada vez (sem rolagem
 * horizontal). As duas ficam montadas: trocar de aba não perde o estado da batalha.
 */
export function PalcoComCodigo({
  principal,
  codigo,
  aba,
  onTrocarAba,
  rotuloPrincipal,
}: PalcoComCodigoProps) {
  const t = useMensagens().ui.explorador;
  return (
    <div className="palco" data-aba={aba}>
      <div className="palco-abas menu--horizontal" role="tablist" aria-label={t.cena}>
        <button
          type="button"
          role="tab"
          id="palco-aba-principal"
          className="menu-item"
          aria-selected={aba === 'principal'}
          aria-controls="palco-principal"
          data-cursor={aba === 'principal'}
          onClick={() => onTrocarAba('principal')}
        >
          {rotuloPrincipal ?? t.batalha}
        </button>
        <button
          type="button"
          role="tab"
          id="palco-aba-codigo"
          className="menu-item"
          aria-selected={aba === 'codigo'}
          aria-controls="palco-codigo"
          data-cursor={aba === 'codigo'}
          onClick={() => onTrocarAba('codigo')}
        >
          {t.codigo}
        </button>
      </div>
      <div
        className="palco-codigo"
        id="palco-codigo"
        role="tabpanel"
        aria-labelledby="palco-aba-codigo"
      >
        {codigo}
      </div>
      <div
        className="palco-principal"
        id="palco-principal"
        role="tabpanel"
        aria-labelledby="palco-aba-principal"
      >
        {principal}
      </div>
    </div>
  );
}
