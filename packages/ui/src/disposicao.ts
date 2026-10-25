// A disposição automática do mapa-mundi de um Projeto do Jogador (o da Taverna é feito à mão, no
// site): cada Território vira uma ilha, as ilhas ficam numa grade com mar entre elas, e as Regiões
// ficam numa grade dentro da ilha. Território sem região conhecida mostra uma nuvem de Névoa.
import type { EstadoNoMapa } from '@quiz/jogo';
import type { IlhaNoMapa, RegiaoNoMapa } from './MapaMundi.tsx';
import type { NomeSprite } from './sprites.ts';

export type TerritorioParaDispor = { id: string; nome: string };
export type RegiaoParaDispor = {
  id: string;
  nome: string;
  territorio_id: string;
  estado: EstadoNoMapa;
};

export type DisposicaoDoMapa = {
  colunas: number;
  linhas: number;
  ilhas: IlhaNoMapa[];
  regioes: RegiaoNoMapa[];
};

/** Prefixo das nuvens de Névoa que só enfeitam Territórios ainda sem região conhecida. */
export const PREFIXO_DA_NEVOA = 'nevoa:';

/** O mapa nunca fica menor que o da Taverna: um Projeto pequeno não vira um mapa gigante. */
const MINIMO = { colunas: 32, linhas: 18 };
const MAR = 2;
const ALTURA_DA_CELULA = 5;
/** Pixels por letra do nome da região no SVG (como em MapaMundi) e lado do tile. */
const LETRA = 9;
const TILE = 24;

const SPRITES: readonly NomeSprite[] = [
  'castelo',
  'quadro',
  'livro',
  'cofre',
  'grimorio',
  'fogao',
  'carrinho',
];

/** Sprite fixo por id: o mesmo a cada abertura, sem depender da ordem das regiões. */
export function spriteDaRegiao(id: string): NomeSprite {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SPRITES[h % SPRITES.length] ?? 'castelo';
}

const grade = (n: number) => {
  const colunas = Math.max(1, Math.ceil(Math.sqrt(n)));
  return { colunas, linhas: Math.max(1, Math.ceil(n / colunas)) };
};

export function disporMapa(
  territorios: readonly TerritorioParaDispor[],
  regioes: readonly RegiaoParaDispor[],
): DisposicaoDoMapa {
  // A célula cabe o nome mais comprido (o rótulo fica centrado embaixo da construção).
  const maiorNome = Math.max(0, ...regioes.map((r) => r.nome.length));
  const larguraDaCelula = Math.max(6, Math.ceil(((maiorNome + 2) * LETRA) / TILE) + 1);

  const porTerritorio = territorios.map((t) => {
    const daqui = regioes.filter((r) => r.territorio_id === t.id);
    const conteudo: RegiaoParaDispor[] = daqui.length
      ? daqui
      : [{ id: `${PREFIXO_DA_NEVOA}${t.id}`, nome: '???', territorio_id: t.id, estado: 'nevoa' }];
    const g = grade(conteudo.length);
    return {
      territorio: t,
      conteudo,
      g,
      largura: g.colunas * larguraDaCelula,
      altura: 1 + g.linhas * ALTURA_DA_CELULA,
    };
  });

  // Ilhas em linhas de até ⌈√n⌉, da esquerda para a direita.
  const porLinha = grade(porTerritorio.length).colunas;
  const ilhas: IlhaNoMapa[] = [];
  const noMapa: RegiaoNoMapa[] = [];
  let y = 1;
  let largura = 0;
  for (let k = 0; k < porTerritorio.length; k += porLinha) {
    const linha = porTerritorio.slice(k, k + porLinha);
    let x = 1;
    for (const { territorio, conteudo, g, largura: l, altura: a } of linha) {
      ilhas.push({
        id: territorio.id,
        nome: territorio.nome,
        coluna: x,
        linha: y,
        largura: l,
        altura: a,
      });
      conteudo.forEach((r, i) => {
        noMapa.push({
          id: r.id,
          nome: r.nome,
          estado: r.estado,
          coluna: x + (i % g.colunas) * larguraDaCelula + Math.floor(larguraDaCelula / 2) - 1,
          linha: y + 2 + Math.floor(i / g.colunas) * ALTURA_DA_CELULA,
          sprite: spriteDaRegiao(r.id),
        });
      });
      x += l + MAR;
    }
    largura = Math.max(largura, x - MAR + 1);
    y += Math.max(...linha.map((t) => t.altura)) + MAR;
  }
  const altura = y - MAR + 1;

  // Centraliza no tamanho mínimo.
  const colunas = Math.max(MINIMO.colunas, largura);
  const linhas = Math.max(MINIMO.linhas, altura);
  const dx = Math.floor((colunas - largura) / 2);
  const dy = Math.floor((linhas - altura) / 2);
  return {
    colunas,
    linhas,
    ilhas: ilhas.map((i) => ({ ...i, coluna: i.coluna + dx, linha: i.linha + dy })),
    regioes: noMapa.map((r) => ({ ...r, coluna: r.coluna + dx, linha: r.linha + dy })),
  };
}
