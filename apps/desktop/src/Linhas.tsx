/** Uma linha do andamento de uma chamada ao Mestre (tentativas, recusas, o que deu certo). */
export type Linha = { tipo: 'ok' | 'andamento' | 'recusada'; texto: string };

/** As linhas do andamento, anunciadas ao leitor de tela; `lendo` pisca o cursor no fim. */
export function ListaDeLinhas({
  linhas,
  lendo = false,
}: {
  linhas: readonly Linha[];
  lendo?: boolean;
}) {
  return (
    <ul className="nova-linhas" aria-live="polite">
      {linhas.map((l, k) => (
        <li key={k} className={`nova-linha--${l.tipo}`}>
          {l.texto}
        </li>
      ))}
      {lendo && <li className="nova-lendo">▮▮▮</li>}
    </ul>
  );
}
