import { describe, expect, it } from 'vitest';
import { destinoSeguro } from './destino';

describe('destinoSeguro', () => {
  it('mantém caminhos do próprio site', () => {
    expect(destinoSeguro('/tutorial')).toBe('/tutorial');
    expect(destinoSeguro(['/tutorial?x=1', '/outro'])).toBe('/tutorial?x=1');
    expect(destinoSeguro('/pt/tutorial?a=1&b=2#topo')).toBe('/pt/tutorial?a=1&b=2#topo');
  });

  it('troca por / o que levaria para fora', () => {
    for (const de of [undefined, '', 'https://mal.example', '//mal.example', '/\\mal.example'])
      expect(destinoSeguro(de)).toBe('/');
  });

  it('recusa caracteres de controle e espaços (o navegador os tira e sobra //mal.example)', () => {
    for (const de of [
      '/\t/mal.example',
      '/\n/mal.example',
      '/\r/mal.example',
      '/ /mal.example',
      '/\u0000/mal.example',
      '/\u007f/mal.example',
      '/ /mal.example',
      '/tutorial\n',
    ])
      expect(destinoSeguro(de)).toBe('/');
  });

  it('recusa barras invertidas em qualquer lugar', () => {
    for (const de of ['\\\\mal.example', '/\\/mal.example', '/tutorial\\..\\x'])
      expect(destinoSeguro(de)).toBe('/');
  });

  it('recusa o que vira // depois de normalizar', () => {
    for (const de of ['/.//mal.example', '/..//mal.example', '/a/..//mal.example'])
      expect(destinoSeguro(de)).toBe('/');
  });
});
