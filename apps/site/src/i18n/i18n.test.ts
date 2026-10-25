import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from '@/proxy';
import { destinoSeguro } from '@/servidor/destino';
import { caminhoDoLogin, caminhoNoIdioma } from './caminhos';
import { routing } from './routing';

const pedir = (caminho: string, cabecalhos: Record<string, string> = {}) =>
  proxy(new NextRequest(`http://localhost:3000${caminho}`, { headers: cabecalhos }));

describe('caminhos', () => {
  it('prefixam o idioma, e a inicial é só o prefixo', () => {
    expect(caminhoNoIdioma('en', '/faq')).toBe('/en/faq');
    expect(caminhoNoIdioma('pt', '/')).toBe('/pt');
    expect(caminhoDoLogin('es', '/tutorial')).toBe('/es/entrar?de=%2Fes%2Ftutorial');
  });

  it('o destino do login vai codificado e volta inteiro, com a própria query', () => {
    const login = caminhoDoLogin('pt', '/tutorial?a=1&b=2');
    expect(login).toBe('/pt/entrar?de=%2Fpt%2Ftutorial%3Fa%3D1%26b%3D2');
    // Como o Next entrega searchParams à página /entrar: já decodificado.
    const de = new URL(login, 'http://localhost:3000').searchParams.get('de') ?? undefined;
    expect(destinoSeguro(de)).toBe('/pt/tutorial?a=1&b=2');
  });
});

describe('roteamento', () => {
  it('todo caminho leva o idioma, pt é o padrão e a escolha dura um ano', () => {
    expect(routing.locales).toEqual(['pt', 'en', 'es']);
    expect(routing.defaultLocale).toBe('pt');
    expect(routing.localePrefix).toBe('always');
    expect(routing.localeCookie).toMatchObject({ maxAge: 31536000 });
  });
});

describe('proxy', () => {
  it('na primeira visita, a raiz vai para o idioma do Accept-Language', () => {
    const resposta = pedir('/', { 'accept-language': 'es-AR,es;q=0.9,en;q=0.8' });
    expect(resposta.status).toBe(307);
    expect(new URL(resposta.headers.get('location')!).pathname).toBe('/es');
  });

  it('sem idioma do Jogo no Accept-Language, português', () => {
    const resposta = pedir('/faq', { 'accept-language': 'de-DE,fr;q=0.8' });
    expect(new URL(resposta.headers.get('location')!).pathname).toBe('/pt/faq');
  });

  it('o cookie NEXT_LOCALE (o seletor) vence o Accept-Language e o caminho é mantido', () => {
    const resposta = pedir('/entrar?de=/tutorial', {
      'accept-language': 'pt-BR',
      cookie: 'NEXT_LOCALE=en',
    });
    const destino = new URL(resposta.headers.get('location')!);
    expect(destino.pathname).toBe('/en/entrar');
    expect(destino.searchParams.get('de')).toBe('/tutorial');
  });

  it('com prefixo não redireciona, e grava o idioma no cookie quando ele mudou', () => {
    const resposta = pedir('/es/faq', { cookie: 'NEXT_LOCALE=en', 'sec-fetch-dest': 'document' });
    expect(resposta.headers.get('location')).toBeNull();
    expect(resposta.cookies.get('NEXT_LOCALE')?.value).toBe('es');
  });
});
