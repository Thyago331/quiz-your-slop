import { conferirEvidencia } from '@quiz/jogo';
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

  it('a API de Pedidos tem Desafios para uma Expedição inteira, do mais fácil ao mais difícil', () => {
    const api = DESAFIOS['api-pedidos'] ?? [];
    expect(api.length).toBeGreaterThanOrEqual(5);
    expect(api.map((d) => d.dificuldade)).toContain(1);
    expect(api.map((d) => d.dificuldade)).toContain(5);
  });

  it('as Evidências da API de Pedidos ficam nos arquivos dela: nada da Névoa vaza', () => {
    const arquivos = REGIOES.find((r) => r.id === 'api-pedidos')?.arquivos ?? [];
    for (const desafio of DESAFIOS['api-pedidos'] ?? []) {
      for (const ev of desafio.evidencias) expect(arquivos, desafio.id).toContain(ev.caminho);
    }
  });
});
