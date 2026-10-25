import { describe, expect, it } from 'vitest';
import type { Desafio, SaidaContestar } from './contrato.ts';
import { CALIBRAGEM_PADRAO } from './progressao.ts';
import {
  ARGUMENTO_MAXIMO,
  argumentoValido,
  avancar,
  contestacoesVencidas,
  contestarDesafio,
  podeContestar,
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
/** O mesmo Desafio, noutro Formato (o gabarito continua 'certa'). */
const em = (formato: Desafio['formato'], d: Desafio): Desafio => ({ ...d, formato });
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
      contestacoesVencidas: 0,
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

describe('Contestação', () => {
  const anulado: SaidaContestar = {
    veredito: 'anulado',
    explicacao: 'O comentário mente.',
    evidencias: [],
  };
  const mantido: SaidaContestar = { veredito: 'mantido', explicacao: 'Releia.', evidencias: [] };
  const errou = responderDesafio(iniciarExpedicao('api', cinco), ['errada']);

  it('depois da correção o Jogador pode contestar, uma vez por Desafio', () => {
    expect(podeContestar(iniciarExpedicao('api', cinco))).toBe(false);
    expect(podeContestar(errou)).toBe(true);
    const contestado = contestarDesafio(errou, 'O código não confere nada.', mantido);
    expect(podeContestar(contestado)).toBe(false);
    expect(() => contestarDesafio(contestado, 'De novo!', mantido)).toThrow(/contestado/);
  });

  it('só se contesta o Desafio já corrigido', () => {
    expect(() => contestarDesafio(iniciarExpedicao('api', cinco), 'x', mantido)).toThrow(
      /corrigido/,
    );
  });

  it('guarda o argumento e o veredito na resposta, e continua no mesmo Desafio', () => {
    const contestado = contestarDesafio(errou, '  O código não confere nada.  ', mantido);
    expect(contestado.fase).toBe('corrigido');
    expect(contestado.respostas[0]).toEqual({
      resposta: ['errada'],
      acertou: false,
      contestacao: { argumento: 'O código não confere nada.', ...mantido },
    });
  });

  it('o argumento é curto e não vazio', () => {
    expect(() => contestarDesafio(errou, '   ', mantido)).toThrow(/argumento/);
    const longo = 'x'.repeat(ARGUMENTO_MAXIMO + 1);
    expect(() => contestarDesafio(errou, longo, mantido)).toThrow(/argumento/);
    expect(() => contestarDesafio(errou, 'x'.repeat(ARGUMENTO_MAXIMO), mantido)).not.toThrow();
  });

  it('argumentoValido diz de antemão o que contestarDesafio aceita (sem lançar)', () => {
    for (const argumento of ['   ', '', 'x'.repeat(ARGUMENTO_MAXIMO + 1)])
      expect(argumentoValido(argumento)).toBe(false);
    for (const argumento of ['ok', `  ${'x'.repeat(ARGUMENTO_MAXIMO)}  `])
      expect(argumentoValido(argumento)).toBe(true);
  });

  it('gabarito mantido não muda nada no placar', () => {
    const contestado = contestarDesafio(errou, 'Acho que está errado.', mantido);
    expect(vidasDoGuardiao(contestado)).toBe(4);
    expect(contestacoesVencidas(contestado)).toBe(0);
  });

  it('Desafio anulado conta como acerto na regra dos 4: o Guardião perde uma vida', () => {
    const contestado = contestarDesafio(errou, 'O comentário mente.', anulado);
    expect(vidasDoGuardiao(contestado)).toBe(3);
    expect(contestacoesVencidas(contestado)).toBe(1);
  });

  it('anular um Desafio que o Jogador já tinha acertado não conta o acerto duas vezes', () => {
    const acertou = responderDesafio(iniciarExpedicao('api', cinco), ['certa']);
    const contestado = contestarDesafio(acertou, 'Desconfio do comentário.', anulado);
    expect(vidasDoGuardiao(contestado)).toBe(3);
    expect(contestacoesVencidas(contestado)).toBe(1);
  });

  it('o anulado pode ser o golpe que derruba o Guardião', () => {
    const tres = jogar(iniciarExpedicao('api', cinco), ['certa', 'certa', 'certa']);
    const ultimo = contestarDesafio(responderDesafio(tres, ['errada']), 'Mente!', anulado);
    expect(guardiaoDerrotado(ultimo)).toBe(true);
    expect(avancar(ultimo).fase).toBe('encerrada');
  });

  it('o resumo soma o bônus de Caçador de Slop e conta as Contestações vencidas', () => {
    const contestado = contestarDesafio(errou, 'O comentário mente.', anulado);
    const fim = jogar(avancar(contestado), ['certa', 'errada', 'errada', 'errada']);
    expect(resultadoDaExpedicao(fim)).toMatchObject({
      venceu: false,
      acertos: 2,
      contestacoesVencidas: 1,
      xp: 2 * 20 + 50,
    });
    const calibragem = { ...CALIBRAGEM_PADRAO, xpPorAcerto: 10, xpCacadorDeSlop: 99 };
    expect(resultadoDaExpedicao(fim, calibragem).xp).toBe(2 * 10 + 99);
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
    const escolhidos = escolherDesafios(banco, [], { aleatorio: primeiro });
    expect(escolhidos).toHaveLength(5);
    const dificuldades = escolhidos.map((d) => d.dificuldade);
    expect(dificuldades).toEqual([...dificuldades].sort((a, b) => a - b));
  });

  it('prefere os Desafios ainda não vistos e completa com os já vistos', () => {
    const vistos = ['f3', 'f1', 'f5', 'f2'];
    const escolhidos = ids(escolherDesafios(banco, vistos, { aleatorio: primeiro }));
    expect(escolhidos).toEqual(expect.arrayContaining(['f4', 'f2b', 'f1b']));
    expect(escolhidos.filter((id) => vistos.includes(id!))).toHaveLength(2);
  });

  it('com o banco menor que a quantidade, traz o banco todo', () => {
    expect(escolherDesafios(banco.slice(0, 3), [], { aleatorio: primeiro })).toHaveLength(3);
  });

  it('o sorteio decide quais entram quando há sobra', () => {
    const ultimo = () => 0.999;
    expect(ids(escolherDesafios(banco, [], { quantidade: 2, aleatorio: primeiro }))).not.toEqual(
      ids(escolherDesafios(banco, [], { quantidade: 2, aleatorio: ultimo })),
    );
  });

  it('não altera o banco recebido', () => {
    const copia = structuredClone(banco);
    escolherDesafios(banco, ['f1'], { temLigacoes: true });
    expect(banco).toEqual(copia);
  });

  describe('mistura mínima (contrato, Validação 4)', () => {
    const formatos = (desafios: readonly Desafio[]) => desafios.map((d) => d.formato);
    // j = i no embaralhamento: a prioridade fica exatamente na ordem do banco.
    const naOrdem = () => 0.999;
    // Só Múltipla escolha nos primeiros do banco: o sorteio "na ordem" deixaria os outros de fora.
    const misturado = [
      desafio('m1', 'f', 1),
      desafio('m2', 'f', 2),
      desafio('m3', 'f', 3),
      desafio('m4', 'f', 4),
      desafio('m5', 'f', 5),
      em('apontar', desafio('a1', 'f', 2)),
      em('tracar_fluxo', desafio('t1', 'f', 4)),
      em('tracar_fluxo', desafio('t2', 'f', 5)),
    ];

    it('sempre ao menos um Apontar no código, quando o banco tem', () => {
      const escolhidos = escolherDesafios(misturado, [], { aleatorio: naOrdem });
      expect(escolhidos).toHaveLength(5);
      expect(formatos(escolhidos)).toContain('apontar');
      expect(formatos(escolhidos)).not.toContain('tracar_fluxo');
    });

    it('ao menos um Traçar o fluxo quando a região tem Ligações', () => {
      const escolhidos = escolherDesafios(misturado, [], { aleatorio: naOrdem, temLigacoes: true });
      expect(escolhidos).toHaveLength(5);
      expect(formatos(escolhidos).filter((f) => f === 'apontar')).toHaveLength(1);
      expect(formatos(escolhidos).filter((f) => f === 'tracar_fluxo')).toHaveLength(1);
    });

    it('a troca tira o último sorteado, nunca o único de outro Formato exigido', () => {
      // Os dois Traçar o fluxo já foram vistos: só a troca traz um deles de volta.
      const vistos = ['m1', 't1', 't2'];
      const escolhidos = ids(
        escolherDesafios(misturado, vistos, { aleatorio: naOrdem, temLigacoes: true }),
      );
      // Prioridade: a1 m2 m3 m4 m5 (não vistos) e depois m1 t1 t2. O Traçar o fluxo entra no lugar
      // de m5, não de a1.
      expect(escolhidos).toEqual(['a1', 'm2', 'm3', 'm4', 't1']);
    });

    it('guarda um inédito de cada Formato exigido para a próxima tentativa', () => {
      // Na ordem do banco, um sorteio cego pegaria t1 e t2 juntos e a próxima tentativa
      // precisaria repetir um Traçar o fluxo.
      const banco = [
        em('tracar_fluxo', desafio('t1', 'f', 1)),
        em('tracar_fluxo', desafio('t2', 'f', 2)),
        em('apontar', desafio('a1', 'f', 3)),
        em('apontar', desafio('a2', 'f', 4)),
        ...['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((id) => desafio(id, 'f', 3)),
      ];
      const primeira = ids(escolherDesafios(banco, [], { aleatorio: naOrdem, temLigacoes: true }));
      expect(primeira).toEqual(expect.arrayContaining(['t1', 'a1']));
      expect(primeira).not.toContain('t2');
      expect(primeira).not.toContain('a2');
      const segunda = ids(
        escolherDesafios(banco, primeira as string[], { aleatorio: naOrdem, temLigacoes: true }),
      );
      expect(segunda.filter((id) => primeira.includes(id))).toEqual([]);
      expect(segunda).toEqual(expect.arrayContaining(['t2', 'a2']));
    });

    it('não repete Desafio enquanto houver inéditos, em qualquer sorteio', () => {
      const banco = [
        em('tracar_fluxo', desafio('t1', 'f', 4)),
        em('tracar_fluxo', desafio('t2', 'f', 5)),
        em('tracar_fluxo', desafio('t3', 'f', 2)),
        em('apontar', desafio('a1', 'f', 1)),
        em('apontar', desafio('a2', 'f', 3)),
        { ...desafio('isca', 'f', 3), isca: true },
        ...([1, 2, 3, 4, 5] as const).map((n) => desafio(`m${n}`, 'f', n)),
      ];
      for (let semente = 1; semente <= 200; semente++) {
        let s = semente;
        // Gerador congruente simples: sorteios diferentes e reproduzíveis.
        const aleatorio = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
        const vistos = new Set<string>();
        for (let tentativa = 0; vistos.size < banco.length; tentativa++) {
          expect(tentativa, `semente ${semente}`).toBeLessThan(3);
          const ineditos = ids(banco.filter((d) => !vistos.has(d.id ?? '')));
          const escolhidos = ids(
            escolherDesafios(banco, [...vistos], { aleatorio, temLigacoes: true }),
          );
          expect(formatos(banco.filter((d) => escolhidos.includes(d.id)))).toEqual(
            expect.arrayContaining(['apontar', 'tracar_fluxo']),
          );
          // Só repete quando todos os inéditos já entraram.
          if (escolhidos.some((id) => vistos.has(id!))) {
            expect(escolhidos, `semente ${semente}`).toEqual(expect.arrayContaining(ineditos));
          }
          for (const id of escolhidos) vistos.add(id!);
        }
      }
    });

    it('continua em dificuldade crescente depois das trocas', () => {
      const escolhidos = escolherDesafios(misturado, [], { aleatorio: naOrdem, temLigacoes: true });
      const dificuldades = escolhidos.map((d) => d.dificuldade);
      expect(dificuldades).toEqual([...dificuldades].sort((a, b) => a - b));
    });

    it('sem o Formato no banco, a Expedição sai sem ele', () => {
      const soMultipla = misturado.filter((d) => d.formato === 'multipla_escolha');
      const escolhidos = escolherDesafios(soMultipla, [], { temLigacoes: true });
      expect(formatos(escolhidos)).toEqual(Array(5).fill('multipla_escolha'));
    });

    it('o Desafio-isca ainda não visto sempre entra na Expedição', () => {
      const comIsca = [...misturado, { ...desafio('isca', 'f', 3), isca: true }];
      for (const aleatorio of [naOrdem, () => 0, () => 0.5]) {
        const escolhidos = escolherDesafios(comIsca, [], { aleatorio, temLigacoes: true });
        expect(ids(escolhidos)).toContain('isca');
        expect(formatos(escolhidos)).toContain('apontar');
        expect(formatos(escolhidos)).toContain('tracar_fluxo');
      }
    });

    it('a isca já vista volta ao sorteio como qualquer outro', () => {
      const comIsca = [{ ...desafio('isca', 'f', 3), isca: true }, ...misturado];
      const escolhidos = escolherDesafios(comIsca, ['isca'], { aleatorio: naOrdem });
      expect(ids(escolhidos)).not.toContain('isca');
    });

    it('a troca não tira o único representante de outro Formato exigido', () => {
      const banco = [
        em('apontar', desafio('a1', 'f', 1)),
        desafio('m1', 'f', 2),
        em('tracar_fluxo', desafio('t1', 'f', 3)),
      ];
      const escolhidos = escolherDesafios(banco, [], {
        quantidade: 1,
        aleatorio: naOrdem,
        temLigacoes: true,
      });
      // Com um Desafio só não cabem os dois; fica o primeiro sorteado.
      expect(ids(escolhidos)).toEqual(['a1']);
    });
  });
});
