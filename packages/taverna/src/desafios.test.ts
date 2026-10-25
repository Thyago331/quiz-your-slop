import { conferirEvidencia, conferirOpcaoApontar, type OpcaoApontar } from '@quiz/jogo';
import { describe, expect, it } from 'vitest';
import { ARQUIVOS } from './arquivos.gerado.ts';
import { DESAFIOS } from './desafios.ts';
import { REGIOES } from './mapa.ts';

const ler = (caminho: string) => ARQUIVOS[caminho];
const todos = Object.values(DESAFIOS).flat();

describe('Desafios da Taverna', () => {
  it('toda Evidência confere com o código da Taverna', () => {
    for (const desafio of todos) {
      expect(desafio.evidencias.length, desafio.id).toBeGreaterThan(0);
      for (const ev of desafio.evidencias) {
        const onde = `${desafio.id} → ${ev.caminho}:${ev.linha_inicio}`;
        expect(conferirEvidencia(ler, ev), onde).toEqual({ ok: true });
      }
    }
  });

  it('cada região do banco existe no mapa', () => {
    const ids = new Set(REGIOES.map((r) => r.id));
    for (const regiaoId of Object.keys(DESAFIOS)) expect(ids).toContain(regiaoId);
  });

  it('ids únicos, e o gabarito só usa ids de opções', () => {
    expect(new Set(todos.map((d) => d.id)).size).toBe(todos.length);
    for (const desafio of todos) {
      const opcoes = desafio.opcoes.map((o) => o.id);
      expect(new Set(opcoes).size, desafio.id).toBe(opcoes.length);
      for (const id of desafio.gabarito) expect(opcoes, desafio.id).toContain(id);
    }
  });

  it('Múltipla escolha tem uma resposta certa entre ao menos 3 opções', () => {
    for (const desafio of todos.filter((d) => d.formato === 'multipla_escolha')) {
      expect(desafio.gabarito, desafio.id).toHaveLength(1);
      expect(desafio.opcoes.length, desafio.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('Apontar no código aponta para arquivos e símbolos que existem no código da Taverna', () => {
    for (const desafio of todos.filter((d) => d.formato === 'apontar')) {
      expect(desafio.gabarito.length, desafio.id).toBeGreaterThanOrEqual(1);
      expect(desafio.opcoes.length, desafio.id).toBeGreaterThan(desafio.gabarito.length);
      for (const opcao of desafio.opcoes as OpcaoApontar[]) {
        const onde = `${desafio.id} → ${opcao.caminho} ${opcao.simbolo ?? ''}`;
        expect(conferirOpcaoApontar(ler, opcao), onde).toEqual({ ok: true });
      }
    }
  });

  it('Traçar o fluxo: o gabarito ordena todos os passos, que aparecem fora de ordem', () => {
    const regioes = new Set(REGIOES.map((r) => r.id));
    for (const desafio of todos.filter((d) => d.formato === 'tracar_fluxo')) {
      const opcoes = desafio.opcoes.map((o) => o.id);
      expect([...desafio.gabarito].sort(), desafio.id).toEqual([...opcoes].sort());
      expect(desafio.gabarito, desafio.id).not.toEqual(opcoes);
      for (const opcao of desafio.opcoes) {
        expect('regiao_id' in opcao, desafio.id).toBe(true);
        if ('regiao_id' in opcao && opcao.regiao_id !== null) {
          expect(regioes, desafio.id).toContain(opcao.regiao_id);
        }
      }
    }
  });

  it('passo de fluxo fora da região diz por qual Ligação o caminho sai (é o que a Névoa mostra)', () => {
    for (const [regiaoId, desafios] of Object.entries(DESAFIOS)) {
      for (const desafio of desafios.filter((d) => d.formato === 'tracar_fluxo')) {
        for (const opcao of desafio.opcoes) {
          if ('regiao_id' in opcao && opcao.regiao_id !== regiaoId) {
            expect(opcao.ligacao, `${desafio.id} → ${opcao.id}`).toBeDefined();
          }
        }
      }
    }
  });

  it('a API de Pedidos tem os três Formatos, com Apontar e Traçar o fluxo de sobra', () => {
    const api = DESAFIOS['api-pedidos'] ?? [];
    const quantos = (formato: string) => api.filter((d) => d.formato === formato).length;
    expect(quantos('multipla_escolha')).toBeGreaterThan(0);
    expect(quantos('apontar')).toBeGreaterThanOrEqual(2);
    expect(quantos('tracar_fluxo')).toBeGreaterThanOrEqual(2);
  });

  it('a API de Pedidos tem Desafios para uma Expedição inteira, do mais fácil ao mais difícil', () => {
    const api = DESAFIOS['api-pedidos'] ?? [];
    expect(api.length).toBeGreaterThanOrEqual(5);
    expect(api.map((d) => d.dificuldade)).toContain(1);
    expect(api.map((d) => d.dificuldade)).toContain(5);
  });

  it('as Evidências de cada região ficam nos arquivos dela: nada da Névoa vaza', () => {
    for (const [regiaoId, desafios] of Object.entries(DESAFIOS)) {
      const arquivos = REGIOES.find((r) => r.id === regiaoId)?.arquivos ?? [];
      for (const desafio of desafios) {
        const evidencias = [...desafio.evidencias, ...(desafio.anulacao?.evidencias ?? [])];
        for (const ev of evidencias) expect(arquivos, desafio.id).toContain(ev.caminho);
      }
    }
  });

  it('a isca do Cofre do Anão: gabarito no comentário mentiroso, anulação no código de verdade', () => {
    const iscas = todos.filter((d) => d.isca);
    expect(iscas.map((d) => d.id)).toEqual(['cofre-pagar-duas-vezes']);
    const [isca] = iscas;
    expect(isca?.evidencias.map((e) => `${e.caminho}:${e.linha_inicio}`)).toEqual([
      'api/src/payments/dwarfVault.ts:3',
    ]);
    expect(isca?.evidencias[0]?.trecho).toMatch(/idempotent/);
    const anulacao = isca?.anulacao;
    expect(anulacao?.explicacao).toMatch(/mente/);
    for (const ev of anulacao?.evidencias ?? []) {
      expect(conferirEvidencia(ler, ev), ev.caminho).toEqual({ ok: true });
    }
    expect(anulacao?.evidencias.some((e) => e.trecho.includes('ledger.push'))).toBe(true);
    // Só a isca traz texto de anulação.
    expect(todos.filter((d) => d.anulacao).map((d) => d.id)).toEqual(['cofre-pagar-duas-vezes']);
  });

  it('o Cofre do Anão tem uma Expedição inteira, com os três Formatos', () => {
    const cofre = DESAFIOS['cofre-anao'] ?? [];
    expect(cofre.length).toBeGreaterThanOrEqual(5);
    const formatos = new Set(cofre.map((d) => d.formato));
    expect([...formatos].sort()).toEqual(['apontar', 'multipla_escolha', 'tracar_fluxo']);
  });
});
