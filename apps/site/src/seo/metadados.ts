import type { Metadata } from 'next';
import { ETIQUETA, IDIOMAS, IDIOMA_PADRAO, type Idioma, type PorIdioma } from '@quiz/i18n';
import { caminhoNoIdioma } from '@/i18n/caminhos';
import type { DadosDaPagina } from '@/textos/pagina';
import { NOME_DO_SITE, urlAbsoluta, urlDoSite, type Env } from './site';

/** O Open Graph quer idioma_PAÍS. */
const LOCALE_OG: PorIdioma<string> = { pt: 'pt_BR', en: 'en_US', es: 'es_ES' };

/** O que vale para o site inteiro (layout raiz): a base das URLs e o título padrão. */
export function metadadosDoSite(env: Env = process.env): Metadata {
  return {
    metadataBase: new URL(urlDoSite(env)),
    title: { default: NOME_DO_SITE, template: `%s · ${NOME_DO_SITE}` },
    applicationName: NOME_DO_SITE,
  };
}

/** A URL absoluta de uma página num idioma. */
export function urlNoIdioma(idioma: Idioma, caminho: string, env: Env = process.env): string {
  return urlAbsoluta(caminhoNoIdioma(idioma, caminho), env);
}

/**
 * O mesmo conjunto de hreflang em todas as versões de uma página: pt-BR, en, es e x-default
 * apontando para a versão em português (uma página de verdade, não a raiz que redireciona).
 */
export function alternativas(caminho: string, env: Env = process.env): Record<string, string> {
  const idiomas: Record<string, string> = {};
  for (const idioma of IDIOMAS) idiomas[ETIQUETA[idioma]] = urlNoIdioma(idioma, caminho, env);
  idiomas['x-default'] = urlNoIdioma(IDIOMA_PADRAO, caminho, env);
  return idiomas;
}

/**
 * Canonical (a própria versão), hreflang, Open Graph e Twitter de uma página pública. As imagens
 * vêm dos arquivos `opengraph-image`/`twitter-image` de cada rota, que o Next acrescenta sozinho.
 */
export function metadadosDaPagina(
  pagina: DadosDaPagina,
  idioma: Idioma,
  env: Env = process.env,
): Metadata {
  const { titulo: chamada, descricao } = pagina.textos[idioma];
  const url = urlNoIdioma(idioma, pagina.caminho, env);
  const inicial = pagina.caminho === '/';
  // A inicial leva o título inteiro, sem o " · Quiz your slop" do modelo.
  const titulo = inicial ? `${NOME_DO_SITE} — ${chamada}` : chamada;
  return {
    title: inicial ? { absolute: titulo } : titulo,
    description: descricao,
    alternates: { canonical: url, languages: alternativas(pagina.caminho, env) },
    openGraph: {
      type: 'website',
      url,
      siteName: NOME_DO_SITE,
      locale: LOCALE_OG[idioma],
      alternateLocale: IDIOMAS.filter((i) => i !== idioma).map((i) => LOCALE_OG[i]),
      title: titulo,
      description: descricao,
    },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao },
  };
}
