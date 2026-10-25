import type { ReactNode } from 'react';

/** A caixa de diálogo do JRPG: a moldura de toda tela do Jogo (spec §13). */
export function Janela({ children }: { children: ReactNode }) {
  return <section className="janela">{children}</section>;
}
