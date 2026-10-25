import { describe, expect, it } from 'vitest';
import { destinoSeguro } from './destino';

describe('destinoSeguro', () => {
  it('mantém caminhos do próprio site', () => {
    expect(destinoSeguro('/tutorial')).toBe('/tutorial');
    expect(destinoSeguro(['/tutorial?x=1', '/outro'])).toBe('/tutorial?x=1');
  });

  it('troca por / o que levaria para fora', () => {
    for (const de of [undefined, '', 'https://mal.example', '//mal.example', '/\\mal.example'])
      expect(destinoSeguro(de)).toBe('/');
  });
});
