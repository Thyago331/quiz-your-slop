import { mapaDoSite } from '@/seo/rastreio';

// SITE_URL é de execução: o sitemap é montado a cada pedido, não no build.
export const dynamic = 'force-dynamic';

export default function sitemap() {
  return mapaDoSite();
}
