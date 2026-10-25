// Contestação roteirizada do Tutorial (spec §9): sem Mestre, quem decide é o campo `isca` do
// Desafio — a isca é anulada com um texto fixo, e o resto mantém o gabarito com a explicação.
import type { Desafio, Evidencia, SaidaContestar } from './contrato.ts';

/** O texto que anula a isca, com o código de verdade que desmente o gabarito. */
export type Anulacao = { explicacao: string; evidencias: Evidencia[] };

/** A resposta do Jogo à Contestação, no mesmo formato da saída de `contestar` do Mestre. */
export function contestacaoRoteirizada(desafio: Desafio, anulacao?: Anulacao): SaidaContestar {
  if (!desafio.isca) {
    return {
      veredito: 'mantido',
      explicacao: desafio.explicacao,
      evidencias: desafio.evidencias,
    };
  }
  if (!anulacao) throw new Error(`Desafio-isca sem texto de anulação: ${desafio.enunciado}`);
  return { veredito: 'anulado', ...anulacao };
}
