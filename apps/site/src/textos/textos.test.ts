// Paridade dos textos do site: cada idioma tem exatamente as chaves (e listas do mesmo tamanho) do
// português, nenhum texto vazio e os mesmos {marcadores}. O tipo já obriga as chaves; o teste pega
// o que o tipo não vê (listas, Records por id).
import { describe, expect, it } from 'vitest';
import { IDIOMAS, chavesDe, textosVazios, type PorIdioma } from '@quiz/i18n';
import { BAIXAR, PAGINA as PAGINA_BAIXAR } from './baixar';
import { COMO_FUNCIONA, PAGINA as PAGINA_COMO_FUNCIONA } from './como-funciona';
import { ENTRAR } from './entrar';
import { ENTRAR_DESKTOP } from './entrar-desktop';
import { PAGINA as PAGINA_FAQ, PERGUNTAS } from './faq';
import { INICIO, PAGINA as PAGINA_INICIO } from './inicio';
import { LISTA } from './lista-de-espera';
import { ENVIADO, PERFIL } from './perfil';
import { PAGINA as PAGINA_PRIVACIDADE, PRIVACIDADE } from './privacidade';
import { SITE } from './site';
import { PAGINA as PAGINA_TAVERNA, TAVERNA } from './taverna';
import { TUTORIAL } from './tutorial';
import { PAGINA as PAGINA_VERIFICAR, VERIFICAR } from './verificar';

const TEXTOS: Record<string, PorIdioma<unknown>> = {
  SITE,
  INICIO,
  COMO_FUNCIONA,
  PERGUNTAS,
  PRIVACIDADE,
  TAVERNA,
  LISTA,
  PERFIL,
  ENVIADO,
  ENTRAR,
  ENTRAR_DESKTOP,
  TUTORIAL,
  BAIXAR,
  VERIFICAR,
  'PAGINA /': PAGINA_INICIO.textos,
  'PAGINA /como-funciona': PAGINA_COMO_FUNCIONA.textos,
  'PAGINA /faq': PAGINA_FAQ.textos,
  'PAGINA /privacidade': PAGINA_PRIVACIDADE.textos,
  'PAGINA /taverna-do-slop': PAGINA_TAVERNA.textos,
  'PAGINA /baixar': PAGINA_BAIXAR.textos,
  'PAGINA /verificar': PAGINA_VERIFICAR.textos,
};

const marcadores = (valor: unknown): string[] =>
  typeof valor === 'string'
    ? [...valor.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!)
    : typeof valor === 'object' && valor !== null
      ? Object.values(valor).flatMap(marcadores)
      : [];

describe.each(Object.entries(TEXTOS))('%s', (_, porIdioma) => {
  it.each(IDIOMAS)('%s tem as chaves do português, sem texto vazio', (idioma) => {
    expect(chavesDe(porIdioma[idioma])).toEqual(chavesDe(porIdioma.pt));
    expect(textosVazios(porIdioma[idioma])).toEqual([]);
    expect(marcadores(porIdioma[idioma])).toEqual(marcadores(porIdioma.pt));
  });
});

describe('ids e links', () => {
  it('perguntas e seções têm os mesmos ids e links em todo idioma', () => {
    const ids = (lista: readonly { id: string }[]) => lista.map((x) => x.id);
    for (const idioma of IDIOMAS) {
      expect(ids(PERGUNTAS[idioma])).toEqual(ids(PERGUNTAS.pt));
      expect(PERGUNTAS[idioma].map((p) => p.link?.href)).toEqual(
        PERGUNTAS.pt.map((p) => p.link?.href),
      );
      expect(ids(COMO_FUNCIONA[idioma].secoes)).toEqual(ids(COMO_FUNCIONA.pt.secoes));
      expect(ids(VERIFICAR[idioma].secoes)).toEqual(ids(VERIFICAR.pt.secoes));
      expect(SITE[idioma].navegacao.map((n) => n.href)).toEqual(
        SITE.pt.navegacao.map((n) => n.href),
      );
    }
  });
});
