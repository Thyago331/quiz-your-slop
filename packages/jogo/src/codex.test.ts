import { describe, expect, it } from 'vitest';
import { comNulos } from './cliDeMentira.ts';
import { desembrulharCodex, esquemaEstrito, tirarNulosOpcionais } from './codex.ts';
import { conferirEsquema, type Esquema } from './esquema.ts';
import { ESQUEMA_CRIAR_AVENTURA, SaidaInvalida, esquemaDetalharRegiao } from './mestre.ts';
import { esquemaPrepararExpedicao } from './preparacao.ts';
import { apontar, fluxo, ligacaoNova, multipla } from './projetoDeTeste.ts';

const esquema: Esquema = {
  type: 'object',
  properties: {
    nome: { type: 'string', minLength: 1 },
    tipo: { type: 'string', enum: ['a', 'b'] },
    talvez: { type: ['string', 'null'] },
    lista: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, extra: { type: 'integer' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  required: ['nome', 'lista'],
  additionalProperties: false,
};

/** Todo objeto do schema no modo estrito: todos os campos em required e nada a mais. */
function ehEstrito(e: Esquema): boolean {
  const filhos = [...Object.values(e.properties ?? {}), ...(e.items ? [e.items] : [])];
  const objetoOk =
    !e.properties ||
    (e.additionalProperties === false &&
      JSON.stringify(e.required) === JSON.stringify(Object.keys(e.properties)));
  return objetoOk && filhos.every(ehEstrito);
}

describe('esquemaEstrito', () => {
  it('campo opcional vira obrigatório e anulável; enum ganha null; o resto fica', () => {
    const estrito = esquemaEstrito(esquema);
    expect(estrito.required).toEqual(['nome', 'tipo', 'talvez', 'lista']);
    expect(estrito.properties?.nome).toEqual({ type: 'string', minLength: 1 });
    expect(estrito.properties?.tipo).toEqual({ type: ['string', 'null'], enum: ['a', 'b', null] });
    // Já aceitava null: não muda.
    expect(estrito.properties?.talvez).toEqual({ type: ['string', 'null'] });
    expect(estrito.properties?.lista?.items?.required).toEqual(['id', 'extra']);
    expect(estrito.properties?.lista?.items?.properties?.extra?.type).toEqual(['integer', 'null']);
    expect(ehEstrito(estrito)).toBe(true);
    // O original continua igual (os schemas do Jogo são constantes compartilhadas).
    expect(esquema.required).toEqual(['nome', 'lista']);
  });

  it('mapa (chave → valor) não cabe no modo estrito', () => {
    expect(() =>
      esquemaEstrito({ type: 'object', additionalProperties: { type: 'boolean' } }),
    ).toThrow(/mapa/);
  });

  it('os schemas de todas as chamadas do Mestre viram estritos', () => {
    for (const e of [
      ESQUEMA_CRIAR_AVENTURA,
      esquemaDetalharRegiao(true),
      esquemaDetalharRegiao(false),
      esquemaPrepararExpedicao(true),
      esquemaPrepararExpedicao(false),
    ]) {
      expect(ehEstrito(esquemaEstrito(e))).toBe(true);
    }
  });

  it('ida e volta: a saída com null passa no estrito e, sem os null, no original', () => {
    const casos: [Esquema, unknown][] = [
      [
        esquemaPrepararExpedicao(false),
        { desafios: [multipla(1), apontar(2), fluxo(3)], ligacoes: [ligacaoNova] },
      ],
      [esquemaPrepararExpedicao(true), { desafios: [multipla(1)] }],
      [esquemaDetalharRegiao(true), { resumo: 'x', arquivos: ['a.ts'] }],
    ];
    for (const [original, saida] of casos) {
      const estrito = esquemaEstrito(original);
      const doCodex = comNulos(estrito, saida);
      expect(conferirEsquema(estrito, doCodex)).toEqual([]);
      const volta = tirarNulosOpcionais(original, doCodex);
      expect(conferirEsquema(original, volta)).toEqual([]);
      // O mesmo que o Jogo leria sem o Codex (null e ausente valem igual nos opcionais).
      expect(volta).toEqual(tirarNulosOpcionais(original, saida));
    }
  });
});

describe('tirarNulosOpcionais', () => {
  it('tira o null de campo opcional', () => {
    expect(
      tirarNulosOpcionais(esquema, {
        nome: 'x',
        tipo: null,
        talvez: null,
        lista: [{ id: '1', extra: null }],
      }),
    ).toEqual({ nome: 'x', lista: [{ id: '1' }] });
    // null em campo obrigatório continua lá: a conferência recusa.
    const errado = tirarNulosOpcionais(esquema, { nome: null, lista: [] });
    expect(conferirEsquema(esquema, errado)).toEqual(['$.nome: esperava string, veio null']);
  });
});

describe('desembrulharCodex', () => {
  // A última mensagem real do `codex exec --output-schema ... --output-last-message` (v0.149.1):
  // o JSON puro, sem envelope e sem quebra de linha no fim.
  const real = '{"resumo":"Função soma dois números.","arquivos":["soma.ts"],"dividir":null}';

  it('a última mensagem é a saída; o null do opcional some', () => {
    expect(JSON.parse(desembrulharCodex(real, esquemaDetalharRegiao(true)))).toEqual({
      resumo: 'Função soma dois números.',
      arquivos: ['soma.ts'],
    });
    expect(desembrulharCodex(`${real}\n`, esquemaDetalharRegiao(true))).toBe(
      '{"resumo":"Função soma dois números.","arquivos":["soma.ts"]}',
    );
  });

  it('mensagem vazia ou que não é JSON vira SaidaInvalida (vale nova tentativa)', () => {
    for (const ruim of ['', '  \n', 'Não consigo ler o Projeto.', '{"resumo":']) {
      expect(() => desembrulharCodex(ruim, esquemaDetalharRegiao(true))).toThrow(SaidaInvalida);
    }
  });
});
