import { describe, expect, it } from 'vitest';
import { configUmami } from '@/analise/umami';
import { PERGUNTAS, PAGINA as FAQ } from '@/textos/faq';
import { PAGINA as INICIO } from '@/textos/inicio';
import { faqPage, serializarJsonLd, softwareApplication } from './jsonld';
import { metadadosDaPagina, metadadosDoSite } from './metadados';
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

describe('metadados', () => {
  it('dão a cada página canonical, hreflang, Open Graph e Twitter', () => {
    const m = metadadosDaPagina(FAQ, env);
    expect(m.title).toBe('Perguntas frequentes');
    expect(m.description).toBe(FAQ.descricao);
    expect(m.alternates).toEqual({
      canonical: 'https://quiz.example/faq',
      languages: { 'pt-BR': 'https://quiz.example/faq', 'x-default': 'https://quiz.example/faq' },
    });
    expect(m.openGraph).toMatchObject({
      url: 'https://quiz.example/faq',
      locale: 'pt_BR',
      siteName: 'Quiz your slop',
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('a inicial leva o nome do site junto da chamada, sem o modelo', () => {
    expect(metadadosDaPagina(INICIO, env).title).toEqual({
      absolute: 'Quiz your slop — Você comitou. Mas você leu?',
    });
  });

  it('a raiz fixa a base das URLs', () => {
    expect(String(metadadosDoSite(env).metadataBase)).toBe('https://quiz.example/');
  });
});

describe('JSON-LD', () => {
  it('SoftwareApplication descreve o Jogo gratuito para Windows e Linux', () => {
    const dados = softwareApplication('descrição', env);
    expect(dados).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'Quiz your slop',
      url: 'https://quiz.example/',
      operatingSystem: 'Windows, Linux',
      offers: { '@type': 'Offer', price: '0' },
    });
  });

  it('FAQPage traz cada pergunta com a resposta da página', () => {
    const dados = faqPage(PERGUNTAS, env);
    expect(dados['@type']).toBe('FAQPage');
    expect(dados.mainEntity).toHaveLength(PERGUNTAS.length);
    expect((dados.mainEntity as unknown[])[0]).toEqual({
      '@type': 'Question',
      name: PERGUNTAS[0]?.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: PERGUNTAS[0]?.resposta },
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
  it('o sitemap lista as páginas públicas com URL absoluta', () => {
    const urls = mapaDoSite(env).map((u) => u.url);
    expect(urls).toEqual([
      'https://quiz.example/',
      'https://quiz.example/como-funciona',
      'https://quiz.example/taverna-do-slop',
      'https://quiz.example/privacidade',
      'https://quiz.example/faq',
    ]);
  });

  it('o robots abre o site, fecha login, Tutorial e API e aponta o sitemap', () => {
    const robots = regrasDeRobots(env);
    expect(robots.sitemap).toBe('https://quiz.example/sitemap.xml');
    const regras = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    expect(regras[0]).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/entrar', '/tutorial'],
    });
    expect(regras[1]?.userAgent).toContain('ClaudeBot');
  });

  it('o llms.txt resume o produto e linka cada página pública', () => {
    const texto = textoLlms(env);
    expect(texto.startsWith('# Quiz your slop\n\n> ')).toBe(true);
    for (const p of PAGINAS_PUBLICAS) expect(texto).toContain(urlAbsoluta(p.caminho, env));
    expect(texto).toContain('### O Mestre é a sua IA');
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
