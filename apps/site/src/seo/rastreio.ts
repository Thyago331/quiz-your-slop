// sitemap.xml, robots.txt e llms.txt (spec §12) montados a partir das páginas públicas.
import type { MetadataRoute } from 'next';
import { INTRODUCAO, SECOES } from '@/textos/como-funciona';
import { CAMINHOS_FECHADOS, PAGINAS_PUBLICAS } from './paginas';
import { LEMA, NOME_DO_SITE, REPOSITORIO, urlAbsoluta, urlDoSite, type Env } from './site';

/** Uma `<url>` por página pública. Sem priority nem changefreq: o Google ignora os dois. */
export function mapaDoSite(env: Env = process.env): MetadataRoute.Sitemap {
  return PAGINAS_PUBLICAS.map((p) => {
    const url = urlAbsoluta(p.caminho, env);
    return { url, alternates: { languages: { 'pt-BR': url } } };
  });
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

/** O llms.txt (llmstxt.org): título, resumo, as páginas com descrição e o "como funciona" inteiro. */
export function textoLlms(env: Env = process.env): string {
  const paginas = PAGINAS_PUBLICAS.map(
    (p) => `- [${p.titulo}](${urlAbsoluta(p.caminho, env)}): ${p.descricao}`,
  );
  const secoes = SECOES.flatMap((s) => ['', `### ${s.titulo}`, '', ...s.paragrafos]);
  return [
    `# ${NOME_DO_SITE}`,
    '',
    `> ${INTRODUCAO}`,
    '',
    `${LEMA}. O código do Jogador nunca sai da máquina dele; a IA é a dele (Claude Code ou ` +
      `Codex CLI), em modo somente leitura. Site em português (pt-BR).`,
    '',
    '## Páginas',
    '',
    ...paginas,
    '',
    '## Como funciona',
    ...secoes,
    '',
    '## Opcional',
    '',
    `- [Código-fonte](${REPOSITORIO}): o repositório aberto do Jogo e do site.`,
    '',
  ].join('\n');
}
