import type { Anulacao, Desafio } from '@quiz/jogo';

/**
 * Desafio do Tutorial: sempre com id, para a Aventura lembrar quais o Jogador já viu. A isca traz
 * o texto que a anula quando o Jogador a contesta (Contestação roteirizada, sem Mestre).
 */
export type DesafioTaverna = Desafio & { id: string; anulacao?: Anulacao };
