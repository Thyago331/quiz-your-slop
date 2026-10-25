'use client';
import type { ReactNode } from 'react';
import { AUTONIMO, ETIQUETA, IDIOMAS, SIGLA, type Idioma } from '@quiz/i18n';
import { useMensagens } from './idioma.tsx';

/** O que o seletor entrega a quem desenha a opção como link (o site usa o Link do next-intl). */
export type OpcaoDeIdioma = {
  idioma: Idioma;
  atual: boolean;
  conteudo: ReactNode;
  props: { className: string; lang: string; title: string; 'aria-current'?: 'true' };
};

type SeletorDeIdiomaProps = {
  atual: Idioma;
  /** Sem link, cada idioma é um botão que chama isto (o Jogo desktop). */
  onEscolher?: (idioma: Idioma) => void;
  link?: (opcao: OpcaoDeIdioma) => ReactNode;
  className?: string;
};

/** PT · EN · ES: o idioma atual marcado com o cursor ▶ (spec §13, tela Título). */
export function SeletorDeIdioma({ atual, onEscolher, link, className }: SeletorDeIdiomaProps) {
  const t = useMensagens().ui;
  return (
    <nav
      className={className ? `seletor-idioma ${className}` : 'seletor-idioma'}
      aria-label={t.idioma}
    >
      {IDIOMAS.map((idioma, k) => {
        const opcao: OpcaoDeIdioma = {
          idioma,
          atual: idioma === atual,
          conteudo: SIGLA[idioma],
          props: {
            className: 'seletor-idioma-opcao',
            lang: ETIQUETA[idioma],
            title: AUTONIMO[idioma],
            ...(idioma === atual ? { 'aria-current': 'true' as const } : {}),
          },
        };
        return (
          <span key={idioma}>
            {k > 0 && <span aria-hidden> · </span>}
            {link ? (
              link(opcao)
            ) : (
              <button type="button" {...opcao.props} onClick={() => onEscolher?.(idioma)}>
                {opcao.conteudo}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
