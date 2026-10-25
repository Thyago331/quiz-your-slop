import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { responderProgresso, type RespostaDeProgresso } from '@/servidor/progresso';

// A API de progresso (spec §11): a conta vem da sessão; o corpo só passa pela lista permitida de
// lerEnvio. PUT não é um método "simples", então outro site não consegue enviá-lo sem preflight.
const responder = ({ status, corpo }: RespostaDeProgresso) =>
  Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });

async function jogadorDaSessao() {
  const sessao = await auth();
  return sessao?.user?.jogadorId ?? null;
}

export async function GET() {
  return responder(
    await responderProgresso(banco, { metodo: 'GET', jogadorId: await jogadorDaSessao() }),
  );
}

export async function PUT(pedido: Request) {
  const jogadorId = await jogadorDaSessao();
  const corpo = jogadorId ? await pedido.text() : '';
  return responder(await responderProgresso(banco, { metodo: 'PUT', jogadorId, corpo }));
}
