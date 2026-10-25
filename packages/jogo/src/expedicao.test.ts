import { describe, expect, it } from 'vitest';
import type { Desafio } from './contrato.ts';
import { CALIBRAGEM_PADRAO } from './progressao.ts';
import {
  avancar,
  desafioAtual,
  escolherDesafios,
  guardiaoDerrotado,
  iniciarExpedicao,
  responderDesafio,
  resultadoDaExpedicao,
  vidasDoGuardiao,
  type Expedicao,
} from './expedicao.ts';

// Desafios de Múltipla escolha cujo gabarito é sempre 'certa'.
function desafio(id: string, caminho = `api/${id}.ts`, dificuldade: Desafio['dificuldade'] = 1) {
  return {
    id,
    formato: 'multipla_escolha',
    enunciado: `Enunciado ${id}`,
    dificuldade,
    opcoes: [
      { id: 'certa', texto: 'Certa' },
      { id: 'errada', texto: 'Errada' },
    ],
    gabarito: ['certa'],
    explicacao: `Explicação ${id}`,
    evidencias: [{ caminho, linha_inicio: 1, linha_fim: 1, trecho: 'x' }],
  } satisfies Desafio;
}
const cinco = ['d1', 'd2', 'd3', 'd4', 'd5'].map((id) => desafio(id));

/** Responde e avança: o ritmo normal de uma Expedição. */
function jogar(expedicao: Expedicao, respostas: ('certa' | 'errada')[]): Expedicao {
  return respostas.reduce((e, r) => avancar(responderDesafio(e, [r])), expedicao);
}

describe('Expedição', () => {
  it('começa no primeiro Desafio, com o Guardião de 4 vidas', () => {
    const expedicao = iniciarExpedicao('api', cinco);
    expect(expedicao.fase).toBe('respondendo');
    expect(desafioAtual(expedicao).id).toBe('d1');
    expect(vidasDoGuardiao(expedicao)).toBe(4);
  });

  it('cada acerto tira uma vida do Guardião; o erro não custa nada', () => {
    const acerto = responderDesafio(iniciarExpedicao('api', cinco), ['certa']);
    expect(acerto.fase).toBe('corrigido');
    expect(acerto.respostas).toEqual([{ resposta: ['certa'], acertou: true }]);
    expect(vidasDoGuardiao(acerto)).toBe(3);

    const erro = responderDesafio(avancar(acerto), ['errada']);
    expect(erro.respostas[1]).toEqual({ resposta: ['errada'], acertou: false });
    expect(vidasDoGuardiao(erro)).toBe(3);
  });

  it('avançar leva ao próximo Desafio', () => {
    const expedicao = jogar(iniciarExpedicao('api', cinco), ['errada', 'certa']);
    expect(expedicao.fase).toBe('respondendo');
    expect(desafioAtual(expedicao).id).toBe('d3');
  });

  it('o quarto acerto derrota o Guardião e encerra a Expedição, mesmo com Desafio sobrando', () => {
    const expedicao = jogar(iniciarExpedicao('api', cinco), ['certa', 'certa', 'certa', 'certa']);
    expect(vidasDoGuardiao(expedicao)).toBe(0);
    expect(expedicao.fase).toBe('encerrada');
    expect(guardiaoDerrotado(expedicao)).toBe(true);
  });

  it('se os Desafios acabam antes de 4 acertos, o Guardião resiste', () => {
    const expedicao = jogar(iniciarExpedicao('api', cinco), [
      'certa',
      'errada',
      'certa',
      'errada',
      'certa',
    ]);
    expect(expedicao.fase).toBe('encerrada');
    expect(guardiaoDerrotado(expedicao)).toBe(false);
    expect(vidasDoGuardiao(expedicao)).toBe(1);
  });

  it('um erro no caminho não impede a vitória no quinto Desafio', () => {
    const expedicao = jogar(iniciarExpedicao('api', cinco), [
      'errada',
      'certa',
      'certa',
      'certa',
      'certa',
    ]);
    expect(guardiaoDerrotado(expedicao)).toBe(true);
  });

  it('cada passo na sua vez: não se responde duas vezes nem se avança sem responder', () => {
    const inicio = iniciarExpedicao('api', cinco);
    expect(() => avancar(inicio)).toThrow(/respond/);
    const corrigido = responderDesafio(inicio, ['certa']);
    expect(() => responderDesafio(corrigido, ['certa'])).toThrow(/corrigido/);
    const fim = jogar(inicio, ['certa', 'certa', 'certa', 'certa']);
    expect(() => responderDesafio(fim, ['certa'])).toThrow(/encerrada/);
  });

  it('não altera a Expedição recebida', () => {
    const inicio = iniciarExpedicao('api', cinco);
    const copia = structuredClone(inicio);
    jogar(inicio, ['certa', 'errada']);
    expect(inicio).toEqual(copia);
  });

  it('o resumo conta acertos, XP e os arquivos citados pelas Evidências dos Desafios jogados', () => {
    const desafios = [
      desafio('a', 'api/x.ts'),
      desafio('b', 'api/y.ts'),
      desafio('c', 'api/x.ts'),
      desafio('d', 'api/z.ts'),
      desafio('e', 'api/nunca-jogado.ts'),
    ];
    const fim = jogar(iniciarExpedicao('api', desafios), ['certa', 'certa', 'certa', 'certa']);
    expect(resultadoDaExpedicao(fim)).toEqual({
      regiaoId: 'api',
      venceu: true,
      acertos: 4,
      respondidos: 4,
      xp: 80,
      arquivosCitados: ['api/x.ts', 'api/y.ts', 'api/z.ts'],
    });
  });

  it('o XP do resumo segue a calibragem', () => {
    const fim = jogar(iniciarExpedicao('api', cinco), [
      'certa',
      'errada',
      'errada',
      'errada',
      'certa',
    ]);
    const calibragem = { ...CALIBRAGEM_PADRAO, xpPorAcerto: 7 };
    expect(resultadoDaExpedicao(fim, calibragem)).toMatchObject({
      venceu: false,
      acertos: 2,
      xp: 14,
    });
  });

  it('só há resumo de Expedição encerrada', () => {
    expect(() => resultadoDaExpedicao(iniciarExpedicao('api', cinco))).toThrow(/encerrada/);
  });
});

describe('escolherDesafios', () => {
  const banco = [
    desafio('f3', 'f', 3),
    desafio('f1', 'f', 1),
    desafio('f5', 'f', 5),
    desafio('f2', 'f', 2),
    desafio('f4', 'f', 4),
    desafio('f2b', 'f', 2),
    desafio('f1b', 'f', 1),
  ];
  const ids = (desafios: readonly Desafio[]) => desafios.map((d) => d.id);
  // Sempre o primeiro da lista: o sorteio vira "na ordem do banco", fácil de prever.
  const primeiro = () => 0;

  it('traz a quantidade pedida, em dificuldade crescente', () => {
    const escolhidos = escolherDesafios(banco, [], 5, primeiro);
    expect(escolhidos).toHaveLength(5);
    const dificuldades = escolhidos.map((d) => d.dificuldade);
    expect(dificuldades).toEqual([...dificuldades].sort((a, b) => a - b));
  });

  it('prefere os Desafios ainda não vistos e completa com os já vistos', () => {
    const vistos = ['f3', 'f1', 'f5', 'f2'];
    const escolhidos = ids(escolherDesafios(banco, vistos, 5, primeiro));
    expect(escolhidos).toEqual(expect.arrayContaining(['f4', 'f2b', 'f1b']));
    expect(escolhidos.filter((id) => vistos.includes(id!))).toHaveLength(2);
  });

  it('com o banco menor que a quantidade, traz o banco todo', () => {
    expect(escolherDesafios(banco.slice(0, 3), [], 5, primeiro)).toHaveLength(3);
  });

  it('o sorteio decide quais entram quando há sobra', () => {
    const ultimo = () => 0.999;
    expect(ids(escolherDesafios(banco, [], 2, primeiro))).not.toEqual(
      ids(escolherDesafios(banco, [], 2, ultimo)),
    );
  });

  it('não altera o banco recebido', () => {
    const copia = structuredClone(banco);
    escolherDesafios(banco, ['f1'], 5);
    expect(banco).toEqual(copia);
  });
});
