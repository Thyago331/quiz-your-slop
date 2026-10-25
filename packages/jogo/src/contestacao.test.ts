import { describe, expect, it } from 'vitest';
import { contestacaoRoteirizada } from './contestacao.ts';
import type { Desafio } from './contrato.ts';

const comum: Desafio = {
  id: 'd1',
  formato: 'multipla_escolha',
  enunciado: 'Qual rota cria o pedido?',
  dificuldade: 1,
  opcoes: [
    { id: 'a', texto: 'GET /items' },
    { id: 'b', texto: 'POST /orders' },
  ],
  gabarito: ['b'],
  explicacao: 'O `server.ts` registra a rota.',
  evidencias: [{ caminho: 'api/src/server.ts', linha_inicio: 10, linha_fim: 10, trecho: '…' }],
};
const anulacao = {
  explicacao: 'Nenhuma linha de `charge()` confere pedido repetido. O comentário mente.',
  evidencias: [
    { caminho: 'api/src/payments/dwarfVault.ts', linha_inicio: 24, linha_fim: 24, trecho: '…' },
  ],
};

describe('contestacaoRoteirizada (Tutorial, sem Mestre)', () => {
  it('Desafio comum: gabarito mantido, com a explicação e as Evidências do próprio Desafio', () => {
    expect(contestacaoRoteirizada(comum)).toEqual({
      veredito: 'mantido',
      explicacao: comum.explicacao,
      evidencias: comum.evidencias,
    });
  });

  it('o texto de anulação não muda o veredito de um Desafio comum', () => {
    expect(contestacaoRoteirizada(comum, anulacao).veredito).toBe('mantido');
  });

  it('Desafio-isca: anulado, com o texto fixo e o código de verdade', () => {
    expect(contestacaoRoteirizada({ ...comum, isca: true }, anulacao)).toEqual({
      veredito: 'anulado',
      ...anulacao,
    });
  });

  it('isca sem texto de anulação é erro de quem escreveu o Desafio', () => {
    expect(() => contestacaoRoteirizada({ ...comum, isca: true })).toThrow(/isca/);
  });
});
