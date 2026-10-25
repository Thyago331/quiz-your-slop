import type { ReactNode } from 'react';

type JanelaProps = { children: ReactNode; titulo?: string; className?: string };

/** A caixa de diálogo do JRPG: a moldura de toda tela do Jogo (spec §13). */
export function Janela({ children, titulo, className }: JanelaProps) {
  return (
    <section className={className ? `janela ${className}` : 'janela'}>
      {titulo && <h2 className="janela-titulo">{titulo}</h2>}
      {children}
    </section>
  );
}
