import type { Evidencia } from '@quiz/jogo';

/** Texto de Desafio: o que vem entre `crases` aparece como código, como no protótipo. */
export function Texto({ children }: { children: string }) {
  return (
    <>
      {children.split('`').map((parte, k) => (k % 2 === 1 ? <code key={k}>{parte}</code> : parte))}
    </>
  );
}

/** `caminho:linha` (ou `caminho:inicio-fim`), o jeito de citar uma Evidência. */
export function localDaEvidencia(ev: Evidencia): string {
  const faixa =
    ev.linha_fim > ev.linha_inicio ? `${ev.linha_inicio}-${ev.linha_fim}` : ev.linha_inicio;
  return `${ev.caminho}:${faixa}`;
}

type EvidenciaNaTelaProps = {
  evidencia: Evidencia;
  /** Com ele, o `caminho:linha` vira botão que abre o arquivo no explorador de código. */
  onAbrir?: (evidencia: Evidencia) => void;
};

/** A Evidência em pergaminho: onde está e o trecho de código, com os números das linhas. */
export function EvidenciaNaTela({ evidencia, onAbrir }: EvidenciaNaTelaProps) {
  const linhas = evidencia.trecho.split(/\r?\n/);
  const local = localDaEvidencia(evidencia);
  return (
    <figure className="evidencia">
      <figcaption>
        📜{' '}
        {onAbrir ? (
          <button
            type="button"
            className="evidencia-abrir"
            title="Abrir no explorador de código"
            onClick={() => onAbrir(evidencia)}
          >
            <code>{local}</code>
          </button>
        ) : (
          <code>{local}</code>
        )}
      </figcaption>
      <pre className="codigo">
        {linhas.map((linha, k) => (
          <span key={k} className="codigo-linha">
            <span className="codigo-numero" aria-hidden>
              {evidencia.linha_inicio + k}
            </span>
            {linha}
          </span>
        ))}
      </pre>
    </figure>
  );
}
