// Onde cada coisa da Taverna fica no mapa-mundi (tiles), como no protótipo da variante D.
// A API de Pedidos é o centro: as construções ficam fora das linhas e colunas das estradas dela.
import type { IlhaNoMapa, NomeSprite } from '@quiz/ui';

export const COLUNAS = 32;
export const LINHAS = 18;

/** Território → ilha. */
export const ILHAS: Readonly<Record<string, Omit<IlhaNoMapa, 'id' | 'nome'>>> = {
  salao: { coluna: 1, linha: 2, largura: 8, altura: 14 },
  balcao: { coluna: 11, linha: 1, largura: 10, altura: 16 },
  adega: { coluna: 23, linha: 1, largura: 8, altura: 7 },
  cozinha: { coluna: 23, linha: 10, largura: 8, altura: 7 },
};

/** Região → construção. */
export const CONSTRUCOES: Readonly<
  Record<string, { coluna: number; linha: number; sprite: NomeSprite }>
> = {
  cardapio: { coluna: 4, linha: 5, sprite: 'quadro' },
  'carrinho-checkout': { coluna: 4, linha: 12, sprite: 'carrinho' },
  'api-pedidos': { coluna: 15, linha: 7, sprite: 'castelo' },
  'cofre-anao': { coluna: 18, linha: 15, sprite: 'cofre' },
  grimorio: { coluna: 12, linha: 15, sprite: 'grimorio' },
  'livro-registros': { coluna: 27, linha: 4, sprite: 'livro' },
  fogao: { coluna: 25, linha: 13, sprite: 'fogao' },
};
