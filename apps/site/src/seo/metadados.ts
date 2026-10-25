import type { Metadata } from 'next';
import type { DadosDaPagina } from '@/textos/pagina';
import { NOME_DO_SITE, urlAbsoluta, urlDoSite, type Env } from './site';

/** `<html lang>` e o hreflang: só português por enquanto (en e es chegam com a tradução). */
export const IDIOMA = 'pt-BR';
const LOCALE_OG = 'pt_BR';

/** O que vale para o site inteiro (layout raiz): a base das URLs e o título padrão. */
export function metadadosDoSite(env: Env = process.env): Metadata {
  return {
    metadataBase: new URL(urlDoSite(env)),
    title: { default: NOME_DO_SITE, template: `%s · ${NOME_DO_SITE}` },
    applicationName: NOME_DO_SITE,
  };
}

/**
 * Canonical, hreflang, Open Graph e Twitter de uma página pública. As imagens vêm dos arquivos
 * `opengraph-image`/`twitter-image` de cada rota, que o Next acrescenta sozinho.
 */
export function metadadosDaPagina(pagina: DadosDaPagina, env: Env = process.env): Metadata {
  const url = urlAbsoluta(pagina.caminho, env);
  // A inicial leva o título inteiro, sem o " · Quiz your slop" do modelo.
  const titulo = pagina.caminho === '/' ? `${NOME_DO_SITE} — ${pagina.titulo}` : pagina.titulo;
  return {
    title: pagina.caminho === '/' ? { absolute: titulo } : titulo,
    description: pagina.descricao,
    alternates: { canonical: url, languages: { [IDIOMA]: url, 'x-default': url } },
    openGraph: {
      type: 'website',
      url,
      siteName: NOME_DO_SITE,
      locale: LOCALE_OG,
      title: titulo,
      description: pagina.descricao,
    },
    twitter: { card: 'summary_large_image', title: titulo, description: pagina.descricao },
  };
}
