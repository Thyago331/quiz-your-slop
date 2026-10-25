import { describe, expect, it } from 'vitest';
import {
  ESTATISTICAS_ZERADAS,
  ID_AVENTURA_TUTORIAL,
  MAXIMO_DE_AVENTURAS,
  ehIdDeAventura,
  lerEnvio,
  mesclarProgresso,
  montarEnvio,
  somarExpedicao,
  type EnvioDeProgresso,
} from './envio.ts';
import { iniciarAventura } from './aventura.ts';
import { revelar, type EstruturaMapa } from './mapa.ts';

const UUID = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b';

const valido: EnvioDeProgresso = {
  xp: 140,
  titulo: 'Leitor de Diff',
  estatisticas: { expedicoes: 12, acertos: 47, contestacoes_vencidas: 2 },
  aventuras: [
    { id: ID_AVENTURA_TUTORIAL, progresso: 25, classe: 'fullstack' },
    { id: UUID, progresso: 43, classe: 'backend' },
  ],
};

const copia = (): Record<string, unknown> => JSON.parse(JSON.stringify(valido));

const erroDe = (dado: unknown) => {
  const lido = lerEnvio(dado);
  if (lido.ok) throw new Error('era para recusar');
  return lido.erro;
};

describe('lerEnvio: só progresso sem conteúdo passa (spec §8)', () => {
  it('aceita o envio completo e devolve uma cópia com as mesmas chaves', () => {
    const lido = lerEnvio(copia());
    expect(lido).toEqual({ ok: true, envio: valido });
  });

  it('aceita nenhuma Aventura', () => {
    expect(lerEnvio({ ...copia(), aventuras: [] }).ok).toBe(true);
  });

  it('recusa o que não é objeto', () => {
    for (const dado of [null, undefined, 'xp', 42, [valido]]) expect(lerEnvio(dado).ok).toBe(false);
  });

  it('recusa qualquer campo fora da lista, no topo', () => {
    expect(erroDe({ ...copia(), jogador: 'thyago331' })).toMatch(/jogador/);
    expect(erroDe({ ...copia(), mapa: { estados: {} } })).toMatch(/mapa/);
  });

  it('recusa campo a mais nas estatísticas e nas Aventuras', () => {
    const estatisticas = { ...valido.estatisticas, regiao: 'cofre-anao' };
    expect(erroDe({ ...copia(), estatisticas })).toMatch(/estatisticas\.regiao/);
    const aventuras = [{ ...valido.aventuras[0], nome: 'loja' }];
    expect(erroDe({ ...copia(), aventuras })).toMatch(/aventuras\[0\]\.nome/);
    const regioes = [{ ...valido.aventuras[0], regioes: { 'cofre-anao': 'revelada' } }];
    expect(erroDe({ ...copia(), aventuras: regioes })).toMatch(/regioes/);
  });

  it('recusa campo que falta', () => {
    const sem = copia();
    delete sem.estatisticas;
    expect(erroDe(sem)).toMatch(/estatisticas/);
    const aventuras = [{ id: UUID, classe: 'backend' }];
    expect(erroDe({ ...copia(), aventuras })).toMatch(/progresso/);
  });

  it('XP e estatísticas são inteiros não negativos', () => {
    for (const xp of [-1, 1.5, '140', Number.NaN, Number.MAX_SAFE_INTEGER + 2])
      expect(lerEnvio({ ...copia(), xp, titulo: 'Comitador Cego' }).ok).toBe(false);
    const estatisticas = { ...valido.estatisticas, acertos: -3 };
    expect(lerEnvio({ ...copia(), estatisticas }).ok).toBe(false);
  });

  it('Contestação vencida conta como acerto: não pode haver mais vencidas que acertos', () => {
    const estatisticas = { expedicoes: 1, acertos: 1, contestacoes_vencidas: 2 };
    expect(lerEnvio({ ...copia(), estatisticas }).ok).toBe(false);
  });

  it('o Título é o do XP enviado, não um texto livre', () => {
    expect(erroDe({ ...copia(), titulo: 'Cofre do Anão' })).toMatch(/titulo/);
    expect(erroDe({ ...copia(), titulo: 'Unslopper' })).toMatch(/titulo/);
  });

  it('o Progresso é um inteiro de 0 a 100 e a Classe uma das três', () => {
    for (const progresso of [-1, 101, 50.5, '50']) {
      const aventuras = [{ id: UUID, progresso, classe: 'backend' }];
      expect(lerEnvio({ ...copia(), aventuras }).ok).toBe(false);
    }
    const aventuras = [{ id: UUID, progresso: 10, classe: 'mago' }];
    expect(erroDe({ ...copia(), aventuras })).toMatch(/classe/);
  });

  it('o id da Aventura é opaco: "tutorial" ou um UUID, nunca um nome', () => {
    for (const id of ['cofre-anao', 'loja-front', 'Taverna do Slop', UUID.toUpperCase(), ''])
      expect(
        lerEnvio({ ...copia(), aventuras: [{ id, progresso: 0, classe: 'backend' }] }).ok,
      ).toBe(false);
  });

  it('recusa Aventura repetida e Aventuras demais', () => {
    const repetida = [valido.aventuras[1], valido.aventuras[1]];
    expect(erroDe({ ...copia(), aventuras: repetida })).toMatch(/repetid/);
    const muitas = Array.from({ length: MAXIMO_DE_AVENTURAS + 1 }, (_, k) => ({
      id: `00000000-0000-4000-8000-${String(k).padStart(12, '0')}`,
      progresso: 0,
      classe: 'backend',
    }));
    expect(lerEnvio({ ...copia(), aventuras: muitas }).ok).toBe(false);
  });
});

describe('ehIdDeAventura', () => {
  it('aceita o Tutorial e UUIDs em minúsculas', () => {
    expect(ehIdDeAventura('tutorial')).toBe(true);
    expect(ehIdDeAventura(UUID)).toBe(true);
    expect(ehIdDeAventura('api-pedidos')).toBe(false);
  });
});

describe('somarExpedicao', () => {
  it('soma uma Expedição, seus acertos e as Contestações vencidas', () => {
    const depois = somarExpedicao(ESTATISTICAS_ZERADAS, { acertos: 4, contestacoesVencidas: 1 });
    expect(depois).toEqual({ expedicoes: 1, acertos: 4, contestacoes_vencidas: 1 });
    expect(somarExpedicao(depois, { acertos: 0, contestacoesVencidas: 0 })).toEqual({
      expedicoes: 2,
      acertos: 4,
      contestacoes_vencidas: 1,
    });
  });
});

describe('montarEnvio', () => {
  const estrutura: EstruturaMapa = {
    regioes: ['a', 'b', 'c'],
    ligacoes: [
      { id: 'l1', origem: 'a', destino: 'b' },
      { id: 'l2', origem: 'b', destino: 'c' },
    ],
  };

  it('tira do mapa só a porcentagem e da Aventura só a Classe', () => {
    const aventura = iniciarAventura(estrutura, 'frontend', {
      backend: 'a',
      frontend: 'a',
      fullstack: 'a',
    });
    const revelada = { ...aventura, mapa: revelar(aventura.mapa, 'a') };
    const envio = montarEnvio({
      xp: 100,
      estatisticas: { expedicoes: 1, acertos: 5, contestacoes_vencidas: 0 },
      aventuras: [{ id: ID_AVENTURA_TUTORIAL, aventura: revelada }],
    });
    // Revelada "a", "b" saiu da Névoa: 1 de 2 conhecidas.
    expect(envio).toEqual({
      xp: 100,
      titulo: 'Leitor de Diff',
      estatisticas: { expedicoes: 1, acertos: 5, contestacoes_vencidas: 0 },
      aventuras: [{ id: 'tutorial', progresso: 50, classe: 'frontend' }],
    });
    expect(lerEnvio(envio)).toEqual({ ok: true, envio });
  });
});

describe('mesclarProgresso', () => {
  it('sem nada guardado, o envio vira o progresso', () => {
    expect(mesclarProgresso(null, valido)).toEqual(valido);
  });

  it('XP e estatísticas nunca descem; o Título acompanha o XP', () => {
    const guardado: EnvioDeProgresso = {
      ...valido,
      xp: 320,
      titulo: 'Arqueólogo de Código',
      estatisticas: { expedicoes: 20, acertos: 10, contestacoes_vencidas: 1 },
    };
    const mesclado = mesclarProgresso(guardado, valido);
    expect(mesclado.xp).toBe(320);
    expect(mesclado.titulo).toBe('Arqueólogo de Código');
    expect(mesclado.estatisticas).toEqual({
      expedicoes: 20,
      acertos: 47,
      contestacoes_vencidas: 2,
    });
  });

  it('por Aventura vale o último envio (o Progresso pode cair); as que não vieram ficam', () => {
    const guardado: EnvioDeProgresso = {
      ...valido,
      aventuras: [
        { id: ID_AVENTURA_TUTORIAL, progresso: 80, classe: 'backend' },
        { id: UUID, progresso: 43, classe: 'backend' },
      ],
    };
    const envio: EnvioDeProgresso = {
      ...valido,
      aventuras: [{ id: ID_AVENTURA_TUTORIAL, progresso: 0, classe: 'frontend' }],
    };
    expect(mesclarProgresso(guardado, envio).aventuras).toEqual([
      { id: ID_AVENTURA_TUTORIAL, progresso: 0, classe: 'frontend' },
      { id: UUID, progresso: 43, classe: 'backend' },
    ]);
  });
});
