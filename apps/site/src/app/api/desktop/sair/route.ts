import { banco } from '@/servidor/banco';
import { responderSair } from '@/servidor/desktop';
import { responder } from '../resposta';

// O "Sair" do Jogo desktop: revoga o token que veio no Authorization.
export async function POST(pedido: Request) {
  return responder(await responderSair(banco, pedido.headers.get('authorization')));
}
