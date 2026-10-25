import { IDIOMAS } from '@quiz/jogo';
import { describe, expect, it } from 'vitest';
import {
  DESAFIOS,
  DESAFIOS_TRADUZIDOS,
  TEXTOS_TRADUZIDOS,
  desafiosDaRegiao,
  type DesafioTaverna,
} from './desafios.ts';
import { mapaNoIdioma } from './idioma.ts';
import { LIGACOES, REGIOES, TERRITORIOS } from './mapa.ts';
import { TRADUCOES_DO_MAPA } from './traducoes.ts';

const ids = (lista: readonly { id: string }[]) => lista.map((x) => x.id).sort();

describe('traduções do mapa', () => {
  it.each(Object.entries(TRADUCOES_DO_MAPA))('%s cobre exatamente os ids do mapa', (_, t) => {
    expect(Object.keys(t.territorios).sort()).toEqual(ids(TERRITORIOS));
    expect(Object.keys(t.regioes).sort()).toEqual(ids(REGIOES));
    expect(Object.keys(t.ligacoes).sort()).toEqual(ids(LIGACOES));
    const textos = [
      ...Object.values(t.territorios).flatMap((x) => [x.nome, x.resumo]),
      ...Object.values(t.regioes).flatMap((x) => [x.nome, x.resumo]),
      ...Object.values(t.ligacoes),
    ];
    expect(textos.filter((x) => !x.trim())).toEqual([]);
  });

  it('mapaNoIdioma troca só os textos', () => {
    const en = mapaNoIdioma('en');
    expect(en.regioes.find((r) => r.id === 'cofre-anao')?.nome).toBe("Dwarf's Vault");
    expect(en.territorios.find((t) => t.id === 'adega')?.nome).toBe('Cellar');
    expect(mapaNoIdioma('es').regioes.find((r) => r.id === 'fogao')?.nome).toBe('Fogón');
    expect(en.regioes.map((r) => r.arquivos)).toEqual(REGIOES.map((r) => r.arquivos));
    expect(en.ligacoes.map((l) => [l.tipo, l.evidencias])).toEqual(
      LIGACOES.map((l) => [l.tipo, l.evidencias]),
    );
    expect(mapaNoIdioma('pt').regioes).toBe(REGIOES);
  });
});

describe('Desafios por idioma', () => {
  const traduzidos = Object.entries(TEXTOS_TRADUZIDOS) as [
    keyof typeof TEXTOS_TRADUZIDOS,
    (typeof TEXTOS_TRADUZIDOS)[keyof typeof TEXTOS_TRADUZIDOS],
  ][];

  it('en e es cobrem todos os idiomas além do português', () => {
    expect(Object.keys(TEXTOS_TRADUZIDOS).sort()).toEqual(IDIOMAS.filter((i) => i !== 'pt').sort());
  });

  it.each(traduzidos)(
    '%s traduz cada Desafio de cada Região, sem sobrar nem faltar texto',
    (_, porRegiao) => {
      expect(Object.keys(porRegiao).sort()).toEqual(Object.keys(DESAFIOS).sort());
      for (const [regiaoId, lista] of Object.entries(DESAFIOS)) {
        const textos = porRegiao[regiaoId] ?? {};
        expect(Object.keys(textos).sort(), regiaoId).toEqual(ids(lista));
        for (const d of lista) {
          const t = textos[d.id];
          const comTexto = d.opcoes.filter((o) => 'texto' in o).map((o) => o.id);
          expect(Object.keys(t?.opcoes ?? {}).sort(), d.id).toEqual(comTexto.sort());
          expect(t?.anulacao !== undefined, d.id).toBe(d.anulacao !== undefined);
          const vazios = [t?.enunciado, t?.explicacao, ...Object.values(t?.opcoes ?? {})];
          expect(
            vazios.filter((x) => !x?.trim()),
            d.id,
          ).toEqual([]);
        }
      }
    },
  );

  it('desafiosDaRegiao dá o banco do idioma', () => {
    expect(desafiosDaRegiao('cardapio', 'pt')).toBe(DESAFIOS['cardapio']);
    for (const idioma of ['en', 'es'] as const) {
      expect(desafiosDaRegiao('cardapio', idioma)).toBe(DESAFIOS_TRADUZIDOS[idioma]['cardapio']);
    }
    expect(desafiosDaRegiao('nenhuma', 'en')).toEqual([]);
  });

  it.each(Object.entries(DESAFIOS_TRADUZIDOS))(
    '%s mantém ids, Formatos, gabaritos, opções de Apontar, Evidências e isca',
    (_, porRegiao) => {
      const forma = (d: DesafioTaverna) => ({
        id: d.id,
        formato: d.formato,
        dificuldade: d.dificuldade,
        gabarito: d.gabarito,
        opcoes: d.opcoes.map((o) => ('texto' in o ? { ...o, texto: undefined } : o)),
        evidencias: d.evidencias,
        isca: d.isca,
        anulacao: d.anulacao?.evidencias,
      });
      for (const [regiaoId, lista] of Object.entries(DESAFIOS)) {
        expect((porRegiao[regiaoId] ?? []).map(forma)).toEqual(lista.map(forma));
      }
    },
  );

  // Texto igual ao português é natural quando é só código (fora o que está entre crases ou aspas
  // — rotas, símbolos, frases da tela da Taverna — não sobra palavra) e acontece, raro, numa opção
  // curta que o espanhol diz igual ("11 segundos"). Enunciado, explicação e anulação são prosa:
  // iguais, são texto esquecido sem tradução.
  const soCodigo = (texto: string) =>
    !/\p{L}{2,}/u.test(texto.replace(/`[^`]*`/g, '').replace(/"[^"]*"/g, ''));

  it.each(Object.entries(DESAFIOS_TRADUZIDOS))(
    '%s traduz de fato: a prosa muda toda, e quase toda opção com palavras',
    (_, porRegiao) => {
      const prosaIgual: string[] = [];
      const opcoesIguais: string[] = [];
      let opcoesComPalavras = 0;
      for (const [regiaoId, lista] of Object.entries(DESAFIOS)) {
        lista.forEach((pt, k) => {
          const tr = porRegiao[regiaoId]?.[k];
          const prosa = [
            [pt.enunciado, tr?.enunciado],
            [pt.explicacao, tr?.explicacao],
            [pt.anulacao?.explicacao, tr?.anulacao?.explicacao],
          ];
          for (const [original, traducao] of prosa) {
            if (original && original === traducao) prosaIgual.push(`${pt.id}: ${original}`);
          }
          pt.opcoes.forEach((o, j) => {
            const outra = tr?.opcoes[j];
            if (!('texto' in o) || soCodigo(o.texto)) return;
            opcoesComPalavras++;
            if (outra && 'texto' in outra && outra.texto === o.texto) {
              opcoesIguais.push(`${pt.id}/${o.id}: ${o.texto}`);
            }
          });
        });
      }
      expect(prosaIgual).toEqual([]);
      expect(opcoesComPalavras).toBeGreaterThan(150);
      expect(opcoesIguais.length / opcoesComPalavras, opcoesIguais.join('\n')).toBeLessThan(0.05);
    },
  );
});
