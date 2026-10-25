import { conferirEvidencia, type TipoLigacao } from '@quiz/jogo';
import { describe, expect, it } from 'vitest';
import { ARQUIVOS } from './arquivos.gerado.ts';
import { ENTRADAS, LIGACOES, REGIOES, TERRITORIOS } from './mapa.ts';

const ler = (caminho: string) => ARQUIVOS[caminho];
const idsRegioes = new Set(REGIOES.map((r) => r.id));

describe('mapa da Taverna', () => {
  it('tem 4 Territórios e 7 Regiões, todas num Território existente', () => {
    expect(TERRITORIOS.map((t) => t.id)).toEqual(['salao', 'balcao', 'adega', 'cozinha']);
    expect(REGIOES).toHaveLength(7);
    const idsTerritorios = new Set(TERRITORIOS.map((t) => t.id));
    for (const regiao of REGIOES) expect(idsTerritorios).toContain(regiao.territorio_id);
  });

  it('todo arquivo de Região existe e as sementes estão entre os arquivos', () => {
    for (const regiao of REGIOES) {
      for (const caminho of regiao.arquivos) expect(ARQUIVOS, caminho).toHaveProperty([caminho]);
      for (const semente of regiao.arquivos_semente) expect(regiao.arquivos).toContain(semente);
    }
  });

  it('todo arquivo da Taverna pertence a exatamente uma Região', () => {
    const todos = REGIOES.flatMap((r) => r.arquivos);
    expect(new Set(todos).size).toBe(todos.length);
    expect([...todos].sort()).toEqual(Object.keys(ARQUIVOS).sort());
  });

  it('origem e destino de toda Ligação existem e os ids não se repetem', () => {
    for (const ligacao of LIGACOES) {
      expect(idsRegioes).toContain(ligacao.origem.regiao_id);
      expect(idsRegioes).toContain(ligacao.destino.regiao_id);
    }
    expect(new Set(LIGACOES.map((l) => l.id)).size).toBe(LIGACOES.length);
  });

  it('os 4 tipos de Ligação aparecem', () => {
    const tipos: TipoLigacao[] = ['chamada', 'consulta', 'evento', 'dependencia'];
    expect(new Set(LIGACOES.map((l) => l.tipo))).toEqual(new Set(tipos));
  });

  it('toda Evidência de Ligação confere com o código', () => {
    for (const ligacao of LIGACOES) {
      expect(ligacao.evidencias.length).toBeGreaterThan(0);
      for (const ev of ligacao.evidencias) {
        expect(conferirEvidencia(ler, ev), `${ligacao.id} → ${ev.caminho}`).toEqual({ ok: true });
      }
    }
  });

  it('a entrada de cada Classe é uma Região do mapa', () => {
    expect(ENTRADAS).toEqual({
      frontend: 'cardapio',
      backend: 'api-pedidos',
      fullstack: 'carrinho-checkout',
    });
    for (const id of Object.values(ENTRADAS)) expect(idsRegioes).toContain(id);
  });
});

describe('slop plantado', () => {
  const arquivo = (caminho: string) => {
    const conteudo = ARQUIVOS[caminho];
    if (conteudo === undefined) throw new Error(`Arquivo ausente: ${caminho}`);
    return conteudo;
  };

  it('comentário mentiroso: charge() se diz idempotente e não checa pedido repetido', () => {
    const cofre = arquivo('api/src/payments/dwarfVault.ts');
    expect(cofre.split('\n')[2]).toBe(
      '// charge() is idempotent: paying twice for the same order never double-charges',
    );
    expect(cofre).not.toMatch(/ledger\.(find|some|filter|includes)|receiptsFor/);
  });

  it('regra duplicada: o front arredonda o total para cima, a API não arredonda', () => {
    expect(arquivo('web/src/cart/useCart.ts')).toContain('Math.ceil(subtotal + tax)');
    const servico = arquivo('api/src/orders/service.ts');
    expect(servico).toContain('order.total = order.subtotal + order.tax;');
    expect(servico).not.toMatch(/Math\.(ceil|round|floor)/);
  });

  it('nome enganoso: validateOrder() aplica o imposto do rei e muta o pedido', () => {
    const servico = arquivo('api/src/orders/service.ts');
    const corpo = servico.slice(servico.indexOf('export function validateOrder'));
    const fim = corpo.indexOf('\n}\n');
    expect(corpo.slice(0, fim)).toContain('order.tax = order.subtotal * KINGS_TAX_RATE;');
  });

  it('código morto: applyCoupon() existe com o TODO e ninguém o chama', () => {
    expect(arquivo('api/src/orders/coupons.ts')).toContain(
      '// TODO: remove after the tavern festival\nexport function applyCoupon(',
    );
    const outros = Object.entries(ARQUIVOS).filter(([c]) => c !== 'api/src/orders/coupons.ts');
    for (const [caminho, conteudo] of outros) {
      expect(conteudo, caminho).not.toMatch(/applyCoupon|orders\/coupons|\.\/coupons/);
    }
  });

  it('erro engolido: o worker faz catch {} em volta do UPDATE de status', () => {
    const worker = arquivo('kitchen/src/worker.ts');
    expect(worker).toContain("await setStatus(event.orderId, 'cooking');");
    expect(worker).toContain('  } catch {}\n');
  });
});
