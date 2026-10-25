import { cartao, TAMANHO_DO_CARTAO } from '@/seo/cartao';
import { PAGINA } from '@/textos/taverna';

export const alt = PAGINA.cartao;
export const size = TAMANHO_DO_CARTAO;
export const contentType = 'image/png';

export default function Imagem() {
  return cartao(PAGINA.cartao);
}
