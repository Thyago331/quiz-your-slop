import { describe, expect, it } from 'vitest';
import { arvoreDoExplorador, caminhosVisiveis, mascarar, type NoExplorador } from './explorador.ts';

const territorios = [
  { id: 'salao', nome: 'Salão' },
  { id: 'balcao', nome: 'Balcão' },
];
const regioes = [
  {
    id: 'cardapio',
    territorio_id: 'salao',
    arquivos: ['web/src/pages/Menu.tsx', 'web/src/api/items.ts', 'web/index.html'],
  },
  { id: 'carrinho', territorio_id: 'salao', arquivos: ['web/src/cart/useCart.ts'] },
  { id: 'api', territorio_id: 'balcao', arquivos: ['api/src/server.ts'] },
  { id: 'grimorio', territorio_id: 'balcao', arquivos: ['shared/money.ts'] },
];
const estados = {
  cardapio: 'desbloqueada',
  carrinho: 'nevoa',
  api: 'revelada',
  grimorio: 'nevoa',
} as const;

/** O que a árvore mostra, linha a linha, como na tela. */
function desenhar(nos: readonly NoExplorador[], recuo = ''): string[] {
  return nos.flatMap((no) =>
    no.tipo === 'pasta'
      ? [`${recuo}${no.nome}/${no.naNevoa ? ' ☁' : ''}`, ...desenhar(no.filhos, `${recuo}  `)]
      : [`${recuo}${no.nome}${no.naNevoa ? ' ☁' : ''}`],
  );
}

describe('arvoreDoExplorador', () => {
  it('agrupa por Território, depois por pastas, pastas antes de arquivos', () => {
    const grupos = arvoreDoExplorador({ territorios, regioes, estados });
    expect(grupos.map((g) => g.nome)).toEqual(['Salão', 'Balcão']);
    expect(desenhar(grupos[0]!.filhos)).toEqual([
      'web/',
      '  src/',
      '    api/',
      '      items.ts',
      '    xxxx/ ☁',
      '      xxxxxxx.xx ☁',
      '    pages/',
      '      Menu.tsx',
      '  index.html',
    ]);
  });

  it('junta a cadeia de pastas de um filho só', () => {
    const grupos = arvoreDoExplorador({ territorios, regioes, estados });
    expect(desenhar(grupos[1]!.filhos)).toEqual([
      'api/src/',
      '  server.ts',
      'xxxxxx/ ☁',
      '  xxxxx.xx ☁',
    ]);
  });

  it('arquivo visível leva caminho e Região; na Névoa, nem caminho nem nome de verdade', () => {
    const [salao] = arvoreDoExplorador({ territorios, regioes, estados });
    const arquivos = JSON.stringify(salao);
    expect(arquivos).toContain('"caminho":"web/src/pages/Menu.tsx"');
    expect(arquivos).toContain('"regiaoId":"cardapio"');
    expect(arquivos).not.toContain('useCart');
    expect(arquivos).not.toContain('cart');
    expect(arquivos).not.toContain('carrinho');
  });

  it('Região sem estado conta como Névoa', () => {
    const [salao] = arvoreDoExplorador({ territorios, regioes, estados: {} });
    expect(desenhar(salao!.filhos).every((linha) => linha.endsWith('☁'))).toBe(true);
  });

  it('arquivos fora de toda Região (ou de Território desconhecido) vão para um grupo à parte, visíveis', () => {
    const grupos = arvoreDoExplorador({
      territorios,
      regioes: [...regioes, { id: 'solta', territorio_id: 'sumido', arquivos: ['tools/x.ts'] }],
      estados: { ...estados, solta: 'desbloqueada' },
      todos: ['README.md', 'web/index.html', 'tools/x.ts'],
    });
    const outros = grupos.at(-1)!;
    expect(outros.territorioId).toBeNull();
    expect(outros.nome).toBe('Outros arquivos');
    expect(desenhar(outros.filhos)).toEqual(['tools/', '  x.ts', 'README.md']);
    const readme = outros.filhos.find((n) => n.tipo === 'arquivo');
    expect(readme).toEqual({
      tipo: 'arquivo',
      naNevoa: false,
      nome: 'README.md',
      caminho: 'README.md',
      regiaoId: null,
    });
  });

  it('sem arquivos soltos, não há grupo à parte', () => {
    const grupos = arvoreDoExplorador({ territorios, regioes, estados, todos: ['web/index.html'] });
    expect(grupos.map((g) => g.territorioId)).toEqual(['salao', 'balcao']);
  });
});

describe('caminhosVisiveis', () => {
  it('só os arquivos fora da Névoa podem ser abertos', () => {
    const grupos = arvoreDoExplorador({ territorios, regioes, estados });
    expect([...caminhosVisiveis(grupos)].sort()).toEqual([
      'api/src/server.ts',
      'web/index.html',
      'web/src/api/items.ts',
      'web/src/pages/Menu.tsx',
    ]);
  });
});

describe('mascarar', () => {
  it('troca tudo menos ponto e barra, mantendo o tamanho', () => {
    expect(mascarar('web/src/cart')).toBe('xxx/xxx/xxxx');
    expect(mascarar('useCart.ts')).toBe('xxxxxxx.xx');
  });
});
