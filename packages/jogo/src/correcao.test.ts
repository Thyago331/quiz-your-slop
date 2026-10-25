import { describe, expect, it } from 'vitest';
import type { Desafio } from './contrato.ts';
import { corrigir } from './correcao.ts';

const multipla: Desafio = {
  id: 'd1',
  formato: 'multipla_escolha',
  enunciado: 'Qual rota cria o pedido?',
  dificuldade: 1,
  opcoes: [
    { id: 'a', texto: 'GET /items' },
    { id: 'b', texto: 'POST /orders' },
    { id: 'c', texto: 'PUT /cart' },
  ],
  gabarito: ['b'],
  explicacao: '…',
  evidencias: [{ caminho: 'api/src/server.ts', linha_inicio: 10, linha_fim: 10, trecho: '…' }],
};

describe('corrigir — Múltipla escolha', () => {
  it('acerta quem escolhe a opção do gabarito', () => {
    expect(corrigir(multipla, ['b'])).toBe(true);
  });

  it('erra quem escolhe outra opção', () => {
    expect(corrigir(multipla, ['a'])).toBe(false);
  });

  it('na Múltipla escolha vale uma opção só: marcar várias, ou nenhuma, é erro', () => {
    expect(corrigir(multipla, ['b', 'a'])).toBe(false);
    expect(corrigir(multipla, ['a', 'b'])).toBe(false);
    expect(corrigir(multipla, [])).toBe(false);
  });
});

describe('corrigir — formatos ainda sem correção', () => {
  it('recusa Apontar no código e Traçar o fluxo em vez de corrigir errado', () => {
    expect(() => corrigir({ ...multipla, formato: 'apontar' }, ['b'])).toThrow(/apontar/);
    expect(() => corrigir({ ...multipla, formato: 'tracar_fluxo' }, ['b'])).toThrow(/tracar_fluxo/);
  });
});
