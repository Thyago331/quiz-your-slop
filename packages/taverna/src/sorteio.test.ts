// O sorteio do Tutorial com o banco de verdade: cada tentativa traz 5 Desafios com a mistura
// mínima, em dificuldade crescente, e só repete um já visto quando os inéditos acabam.
import { escolherDesafios, type Aleatorio } from '@quiz/jogo';
import { describe, expect, it } from 'vitest';
import { DESAFIOS } from './desafios.ts';
import { LIGACOES, REGIOES } from './mapa.ts';

/** Gerador congruente simples: sorteios diferentes e reproduzíveis. */
function gerador(semente: number): Aleatorio {
  let s = semente;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('sorteio das Expedições da Taverna', () => {
  for (const regiao of REGIOES) {
    const banco = DESAFIOS[regiao.id] ?? [];
    const temLigacoes = LIGACOES.some(
      (l) => l.origem.regiao_id === regiao.id || l.destino.regiao_id === regiao.id,
    );

    it(`${regiao.nome}: tentativas seguidas esgotam o banco sem repetir antes da hora`, () => {
      for (let semente = 1; semente <= 100; semente++) {
        const aleatorio = gerador(semente);
        const vistos = new Set<string>();
        const tentativas = Math.ceil(banco.length / 5);
        for (let k = 0; k < tentativas; k++) {
          const ineditos = banco.filter((d) => !vistos.has(d.id)).map((d) => d.id);
          const escolhidos = escolherDesafios(banco, [...vistos], { aleatorio, temLigacoes });
          const ids = escolhidos.map((d) => d.id ?? '');
          const onde = `${regiao.id}, semente ${semente}, tentativa ${k + 1}`;

          expect(escolhidos, onde).toHaveLength(5);
          const formatos = escolhidos.map((d) => d.formato);
          expect(formatos, onde).toContain('apontar');
          if (temLigacoes) expect(formatos, onde).toContain('tracar_fluxo');
          const dificuldades = escolhidos.map((d) => d.dificuldade);
          expect(dificuldades, onde).toEqual([...dificuldades].sort((a, b) => a - b));
          // Repetir só vale quando todos os inéditos já entraram nesta tentativa.
          if (ids.some((id) => vistos.has(id))) {
            expect(ids, onde).toEqual(expect.arrayContaining(ineditos));
          }
          for (const id of ids) vistos.add(id);
        }
        expect(vistos.size, `${regiao.id}, semente ${semente}`).toBe(banco.length);
      }
    });
  }
});
