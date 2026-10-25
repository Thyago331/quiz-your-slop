import { describe, expect, it } from 'vitest';
import { PREFIXO_DA_NEVOA, disporMapa, spriteDaRegiao } from './disposicao.ts';

const territorios = ['web', 'api', 'banco', 'fila', 'admin'].map((id) => ({ id, nome: id }));
const regioes = [
  { id: 'r1', nome: 'API de pedidos', territorio_id: 'api', estado: 'desbloqueada' as const },
  { id: 'r2', nome: 'Pagamentos', territorio_id: 'api', estado: 'revelada' as const },
  { id: 'r3', nome: 'Checkout', territorio_id: 'web', estado: 'desbloqueada' as const },
];

describe('disporMapa', () => {
  const d = disporMapa(territorios, regioes);

  it('uma ilha por Território, sem encostar uma na outra, dentro do mapa', () => {
    expect(d.ilhas.map((i) => i.id)).toEqual(['web', 'api', 'banco', 'fila', 'admin']);
    for (const a of d.ilhas) {
      expect(a.coluna).toBeGreaterThanOrEqual(1);
      expect(a.linha).toBeGreaterThanOrEqual(1);
      expect(a.coluna + a.largura).toBeLessThanOrEqual(d.colunas);
      expect(a.linha + a.altura).toBeLessThanOrEqual(d.linhas);
      for (const b of d.ilhas) {
        if (a === b) continue;
        const separadas =
          a.coluna + a.largura < b.coluna ||
          b.coluna + b.largura < a.coluna ||
          a.linha + a.altura < b.linha ||
          b.linha + b.altura < a.linha;
        expect(separadas, `${a.id} × ${b.id}`).toBe(true);
      }
    }
  });

  it('cada região fica dentro da ilha do seu Território, sem duas no mesmo lugar', () => {
    const ilha = (id: string) => d.ilhas.find((i) => i.id === id)!;
    for (const r of regioes) {
      const pos = d.regioes.find((n) => n.id === r.id)!;
      const i = ilha(r.territorio_id);
      expect(pos.coluna).toBeGreaterThan(i.coluna);
      expect(pos.coluna + 2).toBeLessThanOrEqual(i.coluna + i.largura);
      expect(pos.linha).toBeGreaterThan(i.linha);
      expect(pos.linha + 3).toBeLessThanOrEqual(i.linha + i.altura);
      expect(pos.estado).toBe(r.estado);
    }
    const lugares = d.regioes.map((r) => `${r.coluna},${r.linha}`);
    expect(new Set(lugares).size).toBe(lugares.length);
  });

  it('Território sem região conhecida mostra uma nuvem de Névoa', () => {
    const nevoas = d.regioes.filter((r) => r.estado === 'nevoa').map((r) => r.id);
    expect(nevoas).toEqual(['banco', 'fila', 'admin'].map((id) => PREFIXO_DA_NEVOA + id));
  });

  it('nunca menor que o mapa da Taverna, e o sprite é fixo por id', () => {
    const pequeno = disporMapa([{ id: 't', nome: 't' }], [regioes[0]!]);
    expect([pequeno.colunas, pequeno.linhas]).toEqual([32, 18]);
    expect(spriteDaRegiao('r1')).toBe(spriteDaRegiao('r1'));
    expect(new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(spriteDaRegiao)).size).toBeGreaterThan(1);
  });

  it('muitas regiões crescem o mapa em vez de amontoar', () => {
    const muitas = Array.from({ length: 12 }, (_, k) => ({
      id: `m${k}`,
      nome: `Região com nome comprido ${k}`,
      territorio_id: 'api',
      estado: 'desbloqueada' as const,
    }));
    const grande = disporMapa(territorios, muitas);
    expect(grande.colunas).toBeGreaterThan(32);
    const lugares = grande.regioes.map((r) => `${r.coluna},${r.linha}`);
    expect(new Set(lugares).size).toBe(lugares.length);
  });
});
