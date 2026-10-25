import { textoLlms } from '@/seo/rastreio';

// GEO (spec §12): o resumo do produto para IAs, no formato de llmstxt.org.
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(textoLlms(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
