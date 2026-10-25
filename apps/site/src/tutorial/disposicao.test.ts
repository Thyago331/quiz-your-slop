import { REGIOES, TERRITORIOS } from '@quiz/taverna';
import { describe, expect, it } from 'vitest';
import { COLUNAS, CONSTRUCOES, ILHAS, LINHAS } from './disposicao';

describe('disposição do mapa da Taverna', () => {
  it('todo Território tem ilha e toda Região tem construção', () => {
    expect(Object.keys(ILHAS).sort()).toEqual(TERRITORIOS.map((t) => t.id).sort());
    expect(Object.keys(CONSTRUCOES).sort()).toEqual(REGIOES.map((r) => r.id).sort());
  });

  it('cada construção fica dentro da ilha do seu Território', () => {
    for (const regiao of REGIOES) {
      const ilha = ILHAS[regiao.territorio_id]!;
      const { coluna, linha } = CONSTRUCOES[regiao.id]!;
      expect(coluna, regiao.id).toBeGreaterThanOrEqual(ilha.coluna);
      expect(coluna, regiao.id).toBeLessThan(ilha.coluna + ilha.largura);
      expect(linha, regiao.id).toBeGreaterThanOrEqual(ilha.linha);
      expect(linha, regiao.id).toBeLessThan(ilha.linha + ilha.altura);
      expect(coluna).toBeLessThan(COLUNAS);
      expect(linha).toBeLessThan(LINHAS);
    }
  });
});
