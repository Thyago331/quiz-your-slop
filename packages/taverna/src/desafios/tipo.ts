import type { Anulacao, Desafio } from '@quiz/jogo';

/**
 * Desafio do Tutorial: sempre com id, para a Aventura lembrar quais o Jogador já viu. A isca traz
 * o texto que a anula quando o Jogador a contesta (Contestação roteirizada, sem Mestre).
 */
export type DesafioTaverna = Desafio & { id: string; anulacao?: Anulacao };

/**
 * Os textos de um Desafio em outro idioma: o resto (Formato, gabarito, opções de Apontar,
 * Evidências, isca) vem do Desafio em português, porque o código da Taverna é um só.
 */
export type TextosDoDesafio = {
  enunciado: string;
  /** Id da opção → texto (Múltipla escolha e Traçar o fluxo). */
  opcoes?: Readonly<Record<string, string>>;
  explicacao: string;
  /** Só na isca: a explicação da anulação. */
  anulacao?: string;
};

/** Id do Desafio → textos traduzidos, para uma Região. */
export type TextosDaRegiao = Readonly<Record<string, TextosDoDesafio>>;
