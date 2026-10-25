import type { Env } from '@/seo/site';

/**
 * O Umami do site (spec §8, §11): a URL do script da instância própria e o id deste site. Só com
 * as duas definidas o script entra na página; sem elas (o padrão), nada de estatística.
 */
export function configUmami(
  env: Env = process.env,
): { scriptUrl: string; websiteId: string } | null {
  const scriptUrl = env.UMAMI_SCRIPT_URL?.trim();
  const websiteId = env.UMAMI_WEBSITE_ID?.trim();
  return scriptUrl && websiteId ? { scriptUrl, websiteId } : null;
}
