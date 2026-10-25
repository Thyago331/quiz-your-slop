import { describe, expect, it } from 'vitest';
import { conferirEsquema, type Esquema } from './esquema.ts';

const esquema: Esquema = {
  type: 'object',
  properties: {
    nome: { type: 'string', minLength: 1 },
    nivel: { type: 'integer', minimum: 1, maximum: 5 },
    tipo: { type: 'string', enum: ['a', 'b'] },
    talvez: { type: ['string', 'null'] },
    lista: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
    mapa: { type: 'object', additionalProperties: { type: 'boolean' } },
  },
  required: ['nome', 'lista'],
  additionalProperties: false,
};

describe('conferirEsquema', () => {
  it('aceita o que bate', () => {
    expect(
      conferirEsquema(esquema, {
        nome: 'x',
        nivel: 3,
        tipo: 'a',
        talvez: null,
        lista: ['1'],
        mapa: { q: true },
      }),
    ).toEqual([]);
  });

  it('diz onde está cada problema', () => {
    expect(
      conferirEsquema(esquema, {
        nome: '  ',
        nivel: 2.5,
        tipo: 'c',
        lista: [],
        extra: 1,
        mapa: { q: 'sim' },
      }),
    ).toEqual([
      '$.nome: texto vazio',
      '$.nivel: esperava integer, veio number',
      '$.tipo: fora de a, b',
      '$.lista: menos de 1 itens',
      '$.extra: campo desconhecido',
      '$.mapa.q: esperava boolean, veio string',
    ]);
    expect(conferirEsquema(esquema, { lista: ['1', '2', 3] })).toEqual([
      '$.nome: faltando',
      '$.lista: mais de 2 itens',
      '$.lista[2]: esperava string, veio integer',
    ]);
    expect(conferirEsquema(esquema, [])).toEqual(['$: esperava object, veio array']);
  });
});
