import { describe, expect, it } from 'vitest';
import {
  iniciarMapa,
  progresso,
  revelar,
  vizinhas,
  type EstruturaMapa,
  type MapaAventura,
} from './mapa.ts';

// Um mapa pequeno: a — b — c, e d ligada só a c.
const estrutura: EstruturaMapa = {
  regioes: ['a', 'b', 'c', 'd'],
  ligacoes: [
    { id: 'a-b', origem: 'a', destino: 'b' },
    { id: 'b-c', origem: 'b', destino: 'c' },
    { id: 'd-c', origem: 'd', destino: 'c' },
  ],
};

describe('iniciarMapa', () => {
  it('só a região de entrada sai da Névoa, desbloqueada, e nenhuma Ligação é conhecida', () => {
    const mapa = iniciarMapa(estrutura, 'b');
    expect(mapa.estados).toEqual({ a: 'nevoa', b: 'desbloqueada', c: 'nevoa', d: 'nevoa' });
    expect(mapa.ligacoesConhecidas).toEqual([]);
  });

  it('recusa uma entrada que não é região do mapa', () => {
    expect(() => iniciarMapa(estrutura, 'x')).toThrow(/x/);
  });
});

describe('vizinhas', () => {
  it('são as regiões ligadas, nos dois sentidos da Ligação', () => {
    const mapa = iniciarMapa(estrutura, 'a');
    expect(vizinhas(mapa, 'c')).toEqual(['b', 'd']);
    expect(vizinhas(mapa, 'b')).toEqual(['a', 'c']);
    expect(vizinhas(mapa, 'a')).toEqual(['b']);
  });
});

describe('revelar', () => {
  it('a região fica revelada e as vizinhas na Névoa ficam desbloqueadas', () => {
    const mapa = revelar(iniciarMapa(estrutura, 'c'), 'c');
    expect(mapa.estados).toEqual({
      a: 'nevoa',
      b: 'desbloqueada',
      c: 'revelada',
      d: 'desbloqueada',
    });
  });

  it('vizinhas já conhecidas mantêm o estado', () => {
    const inicio = iniciarMapa(estrutura, 'b');
    const comC: MapaAventura = { ...inicio, estados: { ...inicio.estados, c: 'desatualizada' } };
    const mapa = revelar(revelar(comC, 'b'), 'a');
    expect(mapa.estados).toEqual({ a: 'revelada', b: 'revelada', c: 'desatualizada', d: 'nevoa' });
  });

  it('as Ligações que tocam a região revelada passam a ser conhecidas, sem repetir', () => {
    const mapa = revelar(iniciarMapa(estrutura, 'c'), 'c');
    expect(mapa.ligacoesConhecidas).toEqual(['b-c', 'd-c']);
    expect(revelar(mapa, 'b').ligacoesConhecidas).toEqual(['b-c', 'd-c', 'a-b']);
  });

  it('uma região desatualizada volta a ser revelada', () => {
    const revelado = revelar(iniciarMapa(estrutura, 'b'), 'b');
    const mapa: MapaAventura = {
      ...revelado,
      estados: { ...revelado.estados, b: 'desatualizada' },
    };
    expect(revelar(mapa, 'b').estados.b).toBe('revelada');
  });

  it('recusa revelar uma região na Névoa ou fora do mapa: não há Expedição fora do conhecido', () => {
    const mapa = iniciarMapa(estrutura, 'a');
    expect(() => revelar(mapa, 'c')).toThrow(/Névoa/);
    expect(() => revelar(mapa, 'x')).toThrow(/x/);
  });

  it('não altera o mapa recebido', () => {
    const mapa = iniciarMapa(estrutura, 'c');
    const copia = structuredClone(mapa);
    revelar(mapa, 'c');
    expect(mapa).toEqual(copia);
  });
});

describe('progresso', () => {
  it('conta as reveladas sobre as regiões conhecidas, fora da Névoa', () => {
    expect(progresso(iniciarMapa(estrutura, 'b'))).toEqual({ reveladas: 0, conhecidas: 1 });
    // revelar b descobre a e c: o Progresso cai de 1/1 para 1/3 assim que elas aparecem
    expect(progresso(revelar(iniciarMapa(estrutura, 'b'), 'b'))).toEqual({
      reveladas: 1,
      conhecidas: 3,
    });
  });

  it('uma região desatualizada continua conhecida mas não conta como revelada', () => {
    const revelado = revelar(iniciarMapa(estrutura, 'b'), 'b');
    const mapa: MapaAventura = {
      ...revelado,
      estados: { ...revelado.estados, b: 'desatualizada' },
    };
    expect(progresso(mapa)).toEqual({ reveladas: 0, conhecidas: 3 });
  });
});
