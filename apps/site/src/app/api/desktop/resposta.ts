import type { RespostaDoDesktop } from '@/servidor/desktop';

/** As respostas da API do Jogo desktop: JSON, nunca em cache. */
export function responder({ status, corpo }: RespostaDoDesktop): Response {
  const headers = { 'Cache-Control': 'no-store' };
  return status === 204
    ? new Response(null, { status, headers })
    : Response.json(corpo, { status, headers });
}
