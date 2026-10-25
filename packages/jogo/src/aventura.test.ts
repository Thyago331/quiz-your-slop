import { describe, expect, it } from 'vitest';
import { concluirExpedicao, iniciarAventura } from './aventura.ts';
import type { Desafio } from './contrato.ts';
import { avancar, iniciarExpedicao, responderDesafio, type Expedicao } from './expedicao.ts';
import type { EstruturaMapa } from './mapa.ts';

const estrutura: EstruturaMapa = {
  regioes: ['tela', 'rota', 'travessia'],
  ligacoes: [
    { id: 'tela-travessia', origem: 'tela', destino: 'travessia' },
    { id: 'travessia-rota', origem: 'travessia', destino: 'rota' },
  ],
};
const entradas = { frontend: 'tela', backend: 'rota', fullstack: 'travessia' } as const;

describe('iniciarAventura', () => {
  it('a Classe escolhida define a região de entrada: só ela sai da Névoa', () => {
    const aventura = iniciarAventura(estrutura, 'backend', entradas);
    expect(aventura.classe).toBe('backend');
    expect(aventura.mapa.estados).toEqual({
      tela: 'nevoa',
      rota: 'desbloqueada',
      travessia: 'nevoa',
    });
    expect(aventura.vistos).toEqual({});
  });

  it('é um objeto simples, que sobrevive a JSON (para ser guardado depois)', () => {
    const aventura = iniciarAventura(estrutura, 'fullstack', entradas);
    expect(JSON.parse(JSON.stringify(aventura))).toEqual(aventura);
  });
});

const desafio = (id: string): Desafio => ({
  id,
  formato: 'multipla_escolha',
  enunciado: id,
  dificuldade: 1,
  opcoes: [{ id: 'sim', texto: 'Sim' }],
  gabarito: ['sim'],
  explicacao: '',
  evidencias: [{ caminho: 'x.ts', linha_inicio: 1, linha_fim: 1, trecho: 'x' }],
});
const desafios = ['d1', 'd2', 'd3', 'd4', 'd5'].map(desafio);

function jogar(regiaoId: string, respostas: string[]): Expedicao {
  return respostas.reduce(
    (e, r) => avancar(responderDesafio(e, [r])),
    iniciarExpedicao(regiaoId, desafios),
  );
}

describe('concluirExpedicao', () => {
  const inicio = iniciarAventura(estrutura, 'fullstack', entradas);

  it('a vitória revela a região e desbloqueia as vizinhas', () => {
    const aventura = concluirExpedicao(inicio, jogar('travessia', ['sim', 'sim', 'sim', 'sim']));
    expect(aventura.mapa.estados).toEqual({
      tela: 'desbloqueada',
      rota: 'desbloqueada',
      travessia: 'revelada',
    });
  });

  it('o Guardião que resiste deixa o mapa como estava', () => {
    const aventura = concluirExpedicao(
      inicio,
      jogar('travessia', ['não', 'não', 'não', 'não', 'não']),
    );
    expect(aventura.mapa).toEqual(inicio.mapa);
  });

  it('guarda os Desafios jogados na região, sem repetir, para a próxima tentativa trazer outros', () => {
    const primeira = concluirExpedicao(
      inicio,
      jogar('travessia', ['não', 'sim', 'sim', 'não', 'não']),
    );
    expect(primeira.vistos).toEqual({ travessia: ['d1', 'd2', 'd3', 'd4', 'd5'] });
    const segunda = concluirExpedicao(primeira, jogar('travessia', ['sim', 'sim', 'sim', 'sim']));
    expect(segunda.vistos).toEqual({ travessia: ['d1', 'd2', 'd3', 'd4', 'd5'] });
  });

  it('só conclui Expedição encerrada', () => {
    expect(() => concluirExpedicao(inicio, iniciarExpedicao('travessia', desafios))).toThrow(
      /encerrada/,
    );
  });
});
