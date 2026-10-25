import { describe, expect, it } from 'vitest';
import { configUmami } from '@/analise/umami';
import { PERGUNTAS, PAGINA as FAQ } from '@/textos/faq';
import { PAGINA as INICIO } from '@/textos/inicio';
import { faqPage, serializarJsonLd, softwareApplication } from './jsonld';
import { alternativas, metadadosDaPagina, metadadosDoSite } from './metadados';
import { PAGINAS_PUBLICAS } from './paginas';
import { mapaDoSite, regrasDeRobots, textoLlms } from './rastreio';
import { urlAbsoluta, urlDoSite } from './site';

const env = { SITE_URL: 'https://quiz.example/' };

describe('urlDoSite', () => {
  it('usa SITE_URL sem a barra do fim', () => {
    expect(urlDoSite(env)).toBe('https://quiz.example');
    expect(urlAbsoluta('/faq', env)).toBe('https://quiz.example/faq');
    expect(urlAbsoluta('/', env)).toBe('https://quiz.example/');
  });

  it('cai no servidor de desenvolvimento sem SITE_URL ou com lixo', () => {
    expect(urlDoSite({})).toBe('http://localhost:3000');
    expect(urlDoSite({ SITE_URL: '  ' })).toBe('http://localhost:3000');
    expect(urlDoSite({ SITE_URL: 'quiz.example' })).toBe('http://localhost:3000');
  });
});

const HREFLANG_DO_FAQ = {
  'pt-BR': 'https://quiz.example/pt/faq',
  en: 'https://quiz.example/en/faq',
  es: 'https://quiz.example/es/faq',
  'x-default': 'https://quiz.example/pt/faq',
};

describe('alternativas', () => {
  it('dão pt-BR, en, es e x-default (a versão em português) com o prefixo de cada idioma', () => {
    expect(alternativas('/faq', env)).toEqual(HREFLANG_DO_FAQ);
    expect(alternativas('/', env)).toEqual({
      'pt-BR': 'https://quiz.example/pt',
      en: 'https://quiz.example/en',
      es: 'https://quiz.example/es',
      'x-default': 'https://quiz.example/pt',
    });
  });
});

describe('metadados', () => {
  it('dão a cada página canonical, hreflang, Open Graph e Twitter', () => {
    const m = metadadosDaPagina(FAQ, 'pt', env);
    expect(m.title).toBe('Perguntas frequentes');
    expect(m.description).toBe(FAQ.textos.pt.descricao);
    expect(m.alternates).toEqual({
      canonical: 'https://quiz.example/pt/faq',
      languages: HREFLANG_DO_FAQ,
    });
    expect(m.openGraph).toMatchObject({
      url: 'https://quiz.example/pt/faq',
      locale: 'pt_BR',
      alternateLocale: ['en_US', 'es_ES'],
      siteName: 'Quiz your slop',
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('cada idioma tem o próprio canonical, título e locale, e o mesmo conjunto de hreflang', () => {
    const en = metadadosDaPagina(FAQ, 'en', env);
    expect(en.title).toBe('Frequently asked questions');
    expect(en.alternates).toEqual({
      canonical: 'https://quiz.example/en/faq',
      languages: HREFLANG_DO_FAQ,
    });
    expect(en.openGraph).toMatchObject({ locale: 'en_US', url: 'https://quiz.example/en/faq' });
    const es = metadadosDaPagina(FAQ, 'es', env);
    expect(es.title).toBe('Preguntas frecuentes');
    expect(es.alternates?.canonical).toBe('https://quiz.example/es/faq');
  });

  it('a inicial leva o nome do site junto da chamada, sem o modelo', () => {
    expect(metadadosDaPagina(INICIO, 'pt', env).title).toEqual({
      absolute: 'Quiz your slop — Você comitou. Mas você leu?',
    });
    expect(metadadosDaPagina(INICIO, 'es', env).title).toEqual({
      absolute: 'Quiz your slop — Hiciste commit. ¿Pero lo leíste?',
    });
  });

  it('a raiz fixa a base das URLs', () => {
    expect(String(metadadosDoSite(env).metadataBase)).toBe('https://quiz.example/');
  });
});

describe('JSON-LD', () => {
  it('SoftwareApplication descreve o Jogo gratuito para Windows e Linux', () => {
    const dados = softwareApplication('descrição', 'en', env);
    expect(dados).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'Quiz your slop',
      url: 'https://quiz.example/en',
      inLanguage: 'en',
      operatingSystem: 'Windows, Linux',
      downloadUrl: 'https://quiz.example/en/baixar',
      offers: { '@type': 'Offer', price: '0' },
    });
  });

  it('FAQPage traz cada pergunta com a resposta da página', () => {
    const perguntas = PERGUNTAS.es;
    const dados = faqPage(perguntas, 'es', env);
    expect(dados['@type']).toBe('FAQPage');
    expect(dados).toMatchObject({ url: 'https://quiz.example/es/faq', inLanguage: 'es' });
    expect(dados.mainEntity).toHaveLength(perguntas.length);
    expect((dados.mainEntity as unknown[])[0]).toEqual({
      '@type': 'Question',
      name: perguntas[0]?.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: perguntas[0]?.resposta },
    });
  });

  it('a serialização não deixa um texto fechar o <script>', () => {
    const texto = serializarJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: '</script><script>alert(1)</script>',
    });
    expect(texto).not.toContain('<');
    expect(JSON.parse(texto).name).toBe('</script><script>alert(1)</script>');
  });
});

describe('rastreio', () => {
  it('o sitemap lista cada página pública em cada idioma, com o hreflang de todas', () => {
    const mapa = mapaDoSite(env);
    expect(mapa.map((u) => u.url)).toEqual(
      [
        '',
        '/como-funciona',
        '/taverna-do-slop',
        '/privacidade',
        '/faq',
        '/baixar',
        '/verificar',
      ].flatMap((c) => ['pt', 'en', 'es'].map((i) => `https://quiz.example/${i}${c}`)),
    );
    const faqEmEspanhol = mapa.find((u) => u.url === 'https://quiz.example/es/faq');
    expect(faqEmEspanhol?.alternates?.languages).toEqual(HREFLANG_DO_FAQ);
  });

  it('o robots abre o site, fecha login, Tutorial e API em todo idioma e aponta o sitemap', () => {
    const robots = regrasDeRobots(env);
    expect(robots.sitemap).toBe('https://quiz.example/sitemap.xml');
    const regras = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    expect(regras[0]).toMatchObject({ userAgent: '*', allow: '/' });
    expect(regras[0]?.disallow).toEqual(
      expect.arrayContaining(['/api/', '/pt/entrar', '/en/tutorial', '/es/lista-de-espera']),
    );
    expect(regras[1]?.userAgent).toContain('ClaudeBot');
  });

  it('o llms.txt resume o produto em português e linka cada página em cada idioma', () => {
    const texto = textoLlms(env);
    expect(texto.startsWith('# Quiz your slop\n\n> ')).toBe(true);
    for (const p of PAGINAS_PUBLICAS) {
      for (const idioma of ['pt', 'en', 'es'])
        expect(texto).toContain(
          urlAbsoluta(`/${idioma}${p.caminho === '/' ? '' : p.caminho}`, env),
        );
    }
    expect(texto).toContain('### O Mestre é a sua IA');
    expect(texto).toContain('[How it works (English)](https://quiz.example/en/como-funciona)');
    expect(texto).toContain('- [Verificar o download](https://quiz.example/pt/verificar): ');
  });
});

describe('configUmami', () => {
  it('só liga com a URL do script e o id do site', () => {
    expect(configUmami({})).toBeNull();
    expect(configUmami({ UMAMI_SCRIPT_URL: 'https://stats.example/script.js' })).toBeNull();
    expect(configUmami({ UMAMI_WEBSITE_ID: 'abc' })).toBeNull();
    expect(
      configUmami({
        UMAMI_SCRIPT_URL: ' https://stats.example/script.js ',
        UMAMI_WEBSITE_ID: ' abc ',
      }),
    ).toEqual({ scriptUrl: 'https://stats.example/script.js', websiteId: 'abc' });
  });
});
