import { describe, expect, it } from 'vitest';
import { IDIOMAS } from './idiomas.ts';
import { MENSAGENS } from './mensagens/index.ts';
import { chavesDe, textosVazios } from './paridade.ts';
import { nomeDoTitulo, titulosSemTraducao } from './titulos.ts';

describe('mensagens', () => {
  it.each(IDIOMAS)('%s tem exatamente as chaves do português', (idioma) => {
    expect(chavesDe(MENSAGENS[idioma])).toEqual(chavesDe(MENSAGENS.pt));
  });

  it.each(IDIOMAS)('%s não tem texto vazio', (idioma) => {
    expect(textosVazios(MENSAGENS[idioma])).toEqual([]);
  });

  it.each(IDIOMAS)('%s mantém os mesmos {marcadores} do português', (idioma) => {
    const marcadores = (m: unknown): string[] =>
      typeof m === 'string'
        ? [...m.matchAll(/\{(\w+)\}/g)].map((r) => r[1]!).sort()
        : typeof m === 'object' && m !== null
          ? Object.entries(m).flatMap(([k, v]) => marcadores(v).map((x) => `${k}.${x}`))
          : [];
    expect(marcadores(MENSAGENS[idioma])).toEqual(marcadores(MENSAGENS.pt));
  });
});

describe('chavesDe', () => {
  it('acusa chave a menos e lista de tamanho diferente', () => {
    expect(chavesDe({ a: 'x', b: ['1', '2'] })).not.toEqual(chavesDe({ a: 'x', b: ['1'] }));
    expect(chavesDe({ a: 'x', b: 'y' })).not.toEqual(chavesDe({ a: 'x' }));
  });
});

describe('nomeDoTitulo', () => {
  it('traduz pelo nome em português do envio e deixa como veio o que não conhece', () => {
    expect(nomeDoTitulo('Leitor de Diff', 'en')).toBe('Diff Reader');
    expect(nomeDoTitulo('Comitador Cego', 'es')).toBe('Commiteador Ciego');
    expect(nomeDoTitulo('Leitor de Diff', 'pt')).toBe('Leitor de Diff');
    expect(nomeDoTitulo('Outro', 'en')).toBe('Outro');
  });

  it('cobre todos os Títulos da calibragem', () => {
    expect(titulosSemTraducao()).toEqual([]);
  });
});
