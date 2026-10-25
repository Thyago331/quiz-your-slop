import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { jogadorDoPedido } from '@/servidor/desktop';
import { responderProgresso, type RespostaDeProgresso } from '@/servidor/progresso';

// A API de progresso (spec §11): a conta vem da sessão do site ou, no Jogo desktop, do token em
// `Authorization: Bearer`; o corpo só passa pela lista permitida de lerEnvio. PUT não é um método
// "simples", então outro site não consegue enviá-lo sem preflight.
const responder = ({ status, corpo }: RespostaDeProgresso) =>
  Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });

const jogador = (pedido: Request) =>
  jogadorDoPedido(banco, pedido.headers.get('authorization'), async () => {
    const sessao = await auth();
    return sessao?.user?.jogadorId ?? null;
  });

export async function GET(pedido: Request) {
  return responder(
    await responderProgresso(banco, { metodo: 'GET', jogadorId: await jogador(pedido) }),
  );
}

export async function PUT(pedido: Request) {
  const jogadorId = await jogador(pedido);
  const corpo = jogadorId ? await pedido.text() : '';
  return responder(await responderProgresso(banco, { metodo: 'PUT', jogadorId, corpo }));
}
