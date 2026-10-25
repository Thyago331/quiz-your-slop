import { cartaoDaPagina, cartoesPorIdioma, TAMANHO_DO_CARTAO } from '@/seo/cartao';
import { NOME_DO_SITE } from '@/seo/site';
import { PAGINA } from '@/textos/baixar';

export const alt = NOME_DO_SITE;
export const size = TAMANHO_DO_CARTAO;
export const contentType = 'image/png';
export const generateStaticParams = cartoesPorIdioma;

export default cartaoDaPagina(PAGINA);
