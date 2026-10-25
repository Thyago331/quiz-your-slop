// sitemap.xml, robots.txt e llms.txt (spec §12) montados a partir das páginas públicas.
import type { MetadataRoute } from 'next';
import { AUTONIMO, IDIOMAS, IDIOMA_PADRAO } from '@quiz/i18n';
import { COMO_FUNCIONA } from '@/textos/como-funciona';
import { alternativas, urlNoIdioma } from './metadados';
import { CAMINHOS_FECHADOS, PAGINAS_PUBLICAS } from './paginas';
import { LEMA, NOME_DO_SITE, REPOSITORIO, urlDoSite, type Env } from './site';

/**
 * Uma `<url>` por página pública em cada idioma, todas com o mesmo conjunto de hreflang. Sem
 * priority nem changefreq: o Google ignora os dois.
 */
export function mapaDoSite(env: Env = process.env): MetadataRoute.Sitemap {
  return PAGINAS_PUBLICAS.flatMap((p) =>
    IDIOMAS.map((idioma) => ({
      url: urlNoIdioma(idioma, p.caminho, env),
      alternates: { languages: alternativas(p.caminho, env) },
    })),
  );
}

/**
 * Tudo aberto a buscadores e a IAs (inclusive os rastreadores de treino, nomeados para a regra
 * ficar explícita), menos as áreas com conta e a API.
 */
export const RASTREADORES_DE_IA = [
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
] as const;

export function regrasDeRobots(env: Env = process.env): MetadataRoute.Robots {
  const disallow = [...CAMINHOS_FECHADOS];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: [...RASTREADORES_DE_IA], allow: '/', disallow },
    ],
    sitemap: `${urlDoSite(env)}/sitemap.xml`,
  };
}

/**
 * O llms.txt (llmstxt.org): título, resumo, as páginas com descrição e o "como funciona" inteiro,
 * em português (a língua-fonte do site); as versões em inglês e espanhol vêm listadas no fim.
 */
export function textoLlms(env: Env = process.env): string {
  const pt = IDIOMA_PADRAO;
  const paginas = PAGINAS_PUBLICAS.map(
    (p) =>
      `- [${p.textos[pt].titulo}](${urlNoIdioma(pt, p.caminho, env)}): ${p.textos[pt].descricao}`,
  );
  const { introducao, secoes } = COMO_FUNCIONA[pt];
  const comoFunciona = secoes.flatMap((s) => ['', `### ${s.titulo}`, '', ...s.paragrafos]);
  const outros = IDIOMAS.filter((i) => i !== pt).flatMap((idioma) =>
    PAGINAS_PUBLICAS.map(
      (p) =>
        `- [${p.textos[idioma].titulo} (${AUTONIMO[idioma]})](${urlNoIdioma(idioma, p.caminho, env)})`,
    ),
  );
  return [
    `# ${NOME_DO_SITE}`,
    '',
    `> ${introducao}`,
    '',
    `${LEMA}. O código do Jogador nunca sai da máquina dele; a IA é a dele (Claude Code ou ` +
      `Codex CLI), em modo somente leitura. Site em português (pt-BR), inglês e espanhol.`,
    '',
    '## Páginas',
    '',
    ...paginas,
    '',
    '## Como funciona',
    ...comoFunciona,
    '',
    '## Outros idiomas',
    '',
    ...outros,
    '',
    '## Opcional',
    '',
    `- [Código-fonte](${REPOSITORIO}): o repositório aberto do Jogo e do site.`,
    '',
  ].join('\n');
}
