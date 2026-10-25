import { banco } from '@/servidor/banco';
import { responderTroca } from '@/servidor/desktop';
import { responder } from '../resposta';

// O Jogo desktop troca o código do redirect (com o verificador PKCE) pelo token.
export async function POST(pedido: Request) {
  return responder(await responderTroca(banco, await pedido.text()));
}
