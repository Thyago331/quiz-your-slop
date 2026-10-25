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

const apontar: Desafio = {
  id: 'd2',
  formato: 'apontar',
  enunciado: 'Onde um pedido inválido vira 400?',
  dificuldade: 3,
  opcoes: [
    { id: 'a', caminho: 'api/src/routes/orders.ts', simbolo: 'parseCreateOrder' },
    { id: 'b', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
    { id: 'c', caminho: 'api/src/events/publisher.ts' },
  ],
  gabarito: ['a', 'b'],
  explicacao: '…',
  evidencias: multipla.evidencias,
};

describe('corrigir — Apontar no código', () => {
  it('acerta quem aponta qualquer uma das opções aceitas', () => {
    expect(corrigir(apontar, ['a'])).toBe(true);
    expect(corrigir(apontar, ['b'])).toBe(true);
  });

  it('erra quem aponta um distrator', () => {
    expect(corrigir(apontar, ['c'])).toBe(false);
  });

  it('aponta-se um lugar só: várias opções, ou nenhuma, é erro', () => {
    expect(corrigir(apontar, ['a', 'b'])).toBe(false);
    expect(corrigir(apontar, [])).toBe(false);
  });
});

const fluxo: Desafio = {
  id: 'd3',
  formato: 'tracar_fluxo',
  enunciado: 'Ordene o que acontece depois que `POST /orders` chega:',
  dificuldade: 4,
  opcoes: [
    { id: 'cobra', texto: 'cobra', regiao_id: 'api' },
    { id: 'recebe', texto: 'recebe', regiao_id: 'api' },
    { id: 'grava', texto: 'grava', regiao_id: null, ligacao: 'consulta' },
  ],
  gabarito: ['recebe', 'cobra', 'grava'],
  explicacao: '…',
  evidencias: multipla.evidencias,
};

describe('corrigir — Traçar o fluxo', () => {
  it('acerta quem põe todos os passos na ordem do gabarito', () => {
    expect(corrigir(fluxo, ['recebe', 'cobra', 'grava'])).toBe(true);
  });

  it('erra quem troca a ordem de algum passo', () => {
    expect(corrigir(fluxo, ['cobra', 'recebe', 'grava'])).toBe(false);
  });

  it('a ordem precisa ser completa: faltar ou repetir passo é erro', () => {
    expect(corrigir(fluxo, ['recebe', 'cobra'])).toBe(false);
    expect(corrigir(fluxo, ['recebe', 'cobra', 'grava', 'grava'])).toBe(false);
    expect(corrigir(fluxo, [])).toBe(false);
  });
});
