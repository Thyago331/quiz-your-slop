// Dados estruturados (spec §12): cada objeto repete o que está visível na página onde aparece.
import { ETIQUETA, type Idioma } from '@quiz/i18n';
import type { Pergunta } from '@/textos/faq';
import { urlNoIdioma } from './metadados';
import { NOME_DO_SITE, REPOSITORIO, type Env } from './site';

export type JsonLd = {
  '@context': 'https://schema.org';
  '@type': string;
  [campo: string]: unknown;
};

/** `<` escapado: nenhum texto dos dados consegue fechar a tag `<script>`. */
export function serializarJsonLd(dados: JsonLd): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}

/** O Jogo, na página inicial. */
export function softwareApplication(
  descricao: string,
  idioma: Idioma,
  env: Env = process.env,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: NOME_DO_SITE,
    url: urlNoIdioma(idioma, '/', env),
    description: descricao,
    applicationCategory: 'GameApplication',
    applicationSubCategory: 'Educational game',
    operatingSystem: 'Windows, Linux',
    inLanguage: ETIQUETA[idioma],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    codeRepository: REPOSITORIO,
    sameAs: [REPOSITORIO],
  };
}

/** As perguntas da página de FAQ, com as respostas em texto puro. */
export function faqPage(
  perguntas: readonly Pergunta[],
  idioma: Idioma,
  env: Env = process.env,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: urlNoIdioma(idioma, '/faq', env),
    inLanguage: ETIQUETA[idioma],
    mainEntity: perguntas.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  };
}
