import { IDIOMAS } from '@quiz/jogo';
import { describe, expect, it } from 'vitest';
import { DESAFIOS, DESAFIOS_TRADUZIDOS, desafiosDaRegiao } from './desafios.ts';
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
  it('sem tradução, en e es jogam os Desafios em português (até o #30)', () => {
    for (const idioma of IDIOMAS) {
      const traduzidos = idioma === 'pt' ? undefined : DESAFIOS_TRADUZIDOS[idioma];
      if (traduzidos?.['cardapio']) continue;
      expect(desafiosDaRegiao('cardapio', idioma)).toBe(DESAFIOS['cardapio']);
    }
    expect(desafiosDaRegiao('nenhuma', 'en')).toEqual([]);
  });

  it('a tradução de uma Região mantém ids, Formatos, gabaritos e Evidências', () => {
    for (const porRegiao of Object.values(DESAFIOS_TRADUZIDOS)) {
      for (const [regiaoId, traduzidos] of Object.entries(porRegiao)) {
        const forma = (d: (typeof traduzidos)[number]) => ({
          id: d.id,
          formato: d.formato,
          gabarito: d.gabarito,
          opcoes: d.opcoes.map((o) => o.id),
          evidencias: d.evidencias,
          isca: d.isca,
        });
        expect(traduzidos.map(forma)).toEqual((DESAFIOS[regiaoId] ?? []).map(forma));
      }
    }
  });
});
