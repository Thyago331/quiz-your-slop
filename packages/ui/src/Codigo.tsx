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

/** A Evidência em pergaminho: onde está e o trecho de código, com os números das linhas. */
export function EvidenciaNaTela({ evidencia }: { evidencia: Evidencia }) {
  const linhas = evidencia.trecho.split(/\r?\n/);
  return (
    <figure className="evidencia">
      <figcaption>
        📜 <code>{localDaEvidencia(evidencia)}</code>
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
