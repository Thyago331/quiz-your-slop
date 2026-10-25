import { banco } from '@/servidor/banco';
import { responderEu } from '@/servidor/desktop';
import { responder } from '../resposta';

// Quem está conectado ao Jogo desktop (login, nome, avatar); 401 com token vencido ou revogado.
export async function GET(pedido: Request) {
  return responder(await responderEu(banco, pedido.headers.get('authorization')));
}
