import { describe, expect, it } from 'vitest';
import type { Desafio } from '@quiz/jogo';
import { DESAFIOS } from '@quiz/taverna';
import {
  ESTADO_INICIAL,
  desafiosParaPartir,
  envioDoTutorial,
  estadoSalvo,
  podePartir,
  tutorial,
  type AcaoTutorial,
  type EstadoTutorial,
} from './estado';

const rodar = (acoes: AcaoTutorial[], estado = ESTADO_INICIAL) => acoes.reduce(tutorial, estado);
const banco = DESAFIOS['api-pedidos'] ?? [];
const primeiro = () => 0;

/** Uma resposta errada em qualquer Formato: no fluxo, a ordem do gabarito ao contrário. */
const errada = (desafio: Desafio) =>
  desafio.formato === 'tracar_fluxo'
    ? [...desafio.gabarito].reverse()
    : [desafio.opcoes.find((o) => !desafio.gabarito.includes(o.id))!.id];

/** Parte na API de Pedidos e responde em ordem (true = acerta). */
function batalhar(estado: EstadoTutorial, acertos: boolean[]): EstadoTutorial {
  const desafios = desafiosParaPartir(estado, 'api-pedidos', primeiro);
  let atual = tutorial(estado, { tipo: 'partir', regiaoId: 'api-pedidos', desafios });
  acertos.forEach((acerta, k) => {
    const desafio = desafios[k]!;
    const resposta = acerta ? desafio.gabarito : errada(desafio);
    atual = rodar([{ tipo: 'responder', resposta: [...resposta] }, { tipo: 'avancar' }], atual);
  });
  return atual;
}

const backend = rodar([{ tipo: 'escolherClasse', classe: 'backend' }]);

describe('estado do Tutorial', () => {
  it('começa sem Aventura (na escolha da Classe) e com 0 XP', () => {
    expect(ESTADO_INICIAL).toMatchObject({ xp: 0, aventura: null, expedicao: null });
  });

  it('escolher a Classe abre a Aventura na região de entrada dela', () => {
    expect(backend.aventura?.classe).toBe('backend');
    expect(backend.aventura?.mapa.estados['api-pedidos']).toBe('desbloqueada');
  });

  it('só se parte de região desbloqueada', () => {
    expect(podePartir(backend, 'api-pedidos')).toBe(true);
    expect(podePartir(backend, 'cofre-anao')).toBe(false); // na Névoa
    const frontend = rodar([{ tipo: 'escolherClasse', classe: 'frontend' }]);
    expect(podePartir(frontend, 'cardapio')).toBe(true);
  });

  it('a vitória revela a região, soma o XP e mostra o que saiu da Névoa', () => {
    const fim = batalhar(backend, [true, false, true, true, true]);
    expect(fim.expedicao?.fase).toBe('encerrada');
    expect(fim.xp).toBe(80);
    expect(fim.aventura?.mapa.estados['api-pedidos']).toBe('revelada');
    expect(fim.descobertas).toEqual(
      expect.arrayContaining(['cardapio', 'carrinho-checkout', 'cofre-anao', 'grimorio']),
    );
    expect(rodar([{ tipo: 'voltarAoMapa' }], fim).expedicao).toBeNull();
  });

  it('o Guardião que resiste deixa a região desbloqueada, mas o XP dos acertos fica', () => {
    const fim = batalhar(backend, [true, false, false, true, false]);
    expect(fim.xp).toBe(40);
    expect(fim.aventura?.mapa.estados['api-pedidos']).toBe('desbloqueada');
    expect(fim.descobertas).toEqual([]);
  });

  it('a Expedição da API de Pedidos mistura os Formatos: Apontar e Traçar o fluxo', () => {
    for (const aleatorio of [primeiro, () => 0.5, () => 0.999]) {
      const formatos = desafiosParaPartir(backend, 'api-pedidos', aleatorio).map((d) => d.formato);
      expect(formatos).toHaveLength(5);
      expect(formatos).toContain('apontar');
      expect(formatos).toContain('tracar_fluxo');
    }
  });

  it('a nova tentativa traz primeiro os Desafios ainda não vistos', () => {
    const primeira = rodar(
      [{ tipo: 'voltarAoMapa' }],
      batalhar(backend, [false, false, false, false, false]),
    );
    const vistos = new Set(primeira.aventura?.vistos['api-pedidos']);
    expect(vistos.size).toBe(5);
    const nova = desafiosParaPartir(primeira, 'api-pedidos', primeiro).map((d) => d.id);
    const naoVistos = banco.filter((d) => !vistos.has(d.id));
    expect(naoVistos.length).toBeGreaterThanOrEqual(5);
    // Só a mistura mínima de Formatos pode trazer de volta um já visto.
    expect(nova.filter((id) => !vistos.has(id ?? '')).length).toBeGreaterThanOrEqual(4);
  });

  describe('Contestação roteirizada no Cofre do Anão', () => {
    // Backend vence a API de Pedidos e desbloqueia o Cofre.
    const comCofre = rodar([{ tipo: 'voltarAoMapa' }], batalhar(backend, [true, true, true, true]));
    const partirNoCofre = (aleatorio = primeiro) => {
      const desafios = desafiosParaPartir(comCofre, 'cofre-anao', aleatorio);
      return {
        desafios,
        estado: tutorial(comCofre, { tipo: 'partir', regiaoId: 'cofre-anao', desafios }),
      };
    };
    /** Joga até a isca, acertando o resto, e responde a isca com a resposta de verdade. */
    function ateAIsca() {
      const { desafios, estado } = partirNoCofre();
      const k = desafios.findIndex((d) => d.isca);
      let atual = estado;
      for (const desafio of desafios.slice(0, k)) {
        atual = rodar(
          [{ tipo: 'responder', resposta: [...desafio.gabarito] }, { tipo: 'avancar' }],
          atual,
        );
      }
      return { desafios, k, estado: tutorial(atual, { tipo: 'responder', resposta: ['c'] }) };
    }

    it('a primeira Expedição do Cofre sempre traz a isca, com a mistura mínima', () => {
      expect(podePartir(comCofre, 'cofre-anao')).toBe(true);
      for (const aleatorio of [primeiro, () => 0.5, () => 0.999]) {
        const desafios = desafiosParaPartir(comCofre, 'cofre-anao', aleatorio);
        expect(desafios).toHaveLength(5);
        expect(desafios.filter((d) => d.isca)).toHaveLength(1);
        expect(desafios.map((d) => d.formato)).toEqual(
          expect.arrayContaining(['apontar', 'tracar_fluxo']),
        );
      }
    });

    it('quem acerta de verdade a isca erra pelo gabarito; contestando, o Desafio é anulado', () => {
      const { estado, k } = ateAIsca();
      expect(estado.expedicao?.respostas[k]?.acertou).toBe(false);
      const contestado = tutorial(estado, {
        tipo: 'contestar',
        argumento: 'charge() não confere nada',
      });
      expect(contestado.expedicao?.respostas[k]?.contestacao).toMatchObject({
        veredito: 'anulado',
        argumento: 'charge() não confere nada',
      });
      expect(contestado.expedicao?.respostas[k]?.contestacao?.evidencias[0]?.trecho).toMatch(
        /ledger\.push/,
      );
    });

    it('a Contestação vencida dá o bônus de Caçador de Slop no fim da Expedição', () => {
      const { estado, desafios, k } = ateAIsca();
      let atual = rodar(
        [{ tipo: 'contestar', argumento: 'O comentário mente.' }, { tipo: 'avancar' }],
        estado,
      );
      for (const desafio of desafios.slice(k + 1)) {
        if (atual.expedicao?.fase === 'encerrada') break;
        atual = rodar(
          [{ tipo: 'responder', resposta: errada(desafio) }, { tipo: 'avancar' }],
          atual,
        );
      }
      expect(atual.expedicao?.fase).toBe('encerrada');
      // k acertos antes da isca + a isca anulada, cada um 20 XP, e 50 do bônus.
      expect(atual.xp - comCofre.xp).toBe((k + 1) * 20 + 50);
    });

    it('contestar um Desafio comum mantém o gabarito, com a explicação do Desafio', () => {
      const { desafios, estado } = partirNoCofre();
      const comum = desafios.find((d) => !d.isca)!;
      expect(desafios[0]).toBe(comum);
      const corrigido = tutorial(estado, { tipo: 'responder', resposta: errada(comum) });
      const contestado = tutorial(corrigido, { tipo: 'contestar', argumento: 'Discordo.' });
      expect(contestado.expedicao?.respostas[0]?.contestacao).toMatchObject({
        veredito: 'mantido',
        explicacao: comum.explicacao,
      });
      expect(contestado.expedicao?.respostas[0]?.acertou).toBe(false);
    });

    it('sem argumento, ou fora da correção, contestar não faz nada', () => {
      const { estado } = partirNoCofre();
      expect(tutorial(estado, { tipo: 'contestar', argumento: 'Antes da hora' })).toBe(estado);
      const { estado: corrigido } = ateAIsca();
      expect(tutorial(corrigido, { tipo: 'contestar', argumento: '   ' })).toBe(corrigido);
    });
  });

  it('recomeçar volta à escolha da Classe; o XP é do Jogador e fica', () => {
    const fim = rodar(
      [{ tipo: 'voltarAoMapa' }, { tipo: 'recomecar' }],
      batalhar(backend, [true, true, true, true]),
    );
    expect(fim).toMatchObject({ xp: 80, aventura: null, expedicao: null });
    expect(fim.estatisticas).toEqual({ expedicoes: 1, acertos: 4, contestacoes_vencidas: 0 });
  });

  it('cada Expedição encerrada soma às estatísticas do Jogador', () => {
    const uma = rodar(
      [{ tipo: 'voltarAoMapa' }],
      batalhar(backend, [true, false, true, false, false]),
    );
    expect(uma.estatisticas).toEqual({ expedicoes: 1, acertos: 2, contestacoes_vencidas: 0 });
    const duas = batalhar(uma, [true, true, true, true]);
    expect(duas.estatisticas).toEqual({ expedicoes: 2, acertos: 6, contestacoes_vencidas: 0 });
  });

  describe('guardar e retomar', () => {
    const jogado = rodar([{ tipo: 'voltarAoMapa' }], batalhar(backend, [true, true, true, true]));

    it('o estado salvo em JSON volta igual, no mapa', () => {
      const salvo = JSON.parse(JSON.stringify(jogado));
      expect(estadoSalvo(salvo)).toEqual({
        ...jogado,
        descobertas: [],
      });
    });

    it('uma Expedição em curso não volta: retoma no mapa', () => {
      const meio = batalhar(backend, [true, false]);
      const salvo = JSON.parse(JSON.stringify(meio));
      expect(estadoSalvo(salvo)).toMatchObject({ xp: 0, expedicao: null, descobertas: [] });
      expect(estadoSalvo(salvo)?.aventura).toEqual(meio.aventura);
    });

    it('lixo ou um mapa de outra Taverna é ignorado', () => {
      for (const salvo of [null, 'x', { xp: -1 }, { ...jogado, estatisticas: undefined }])
        expect(estadoSalvo(salvo)).toBeNull();
      const outroMapa = {
        ...jogado,
        aventura: {
          ...jogado.aventura,
          mapa: { ...jogado.aventura!.mapa, estados: { a: 'nevoa' } },
        },
      };
      expect(estadoSalvo(outroMapa)).toBeNull();
    });

    it('o progresso do servidor só faz o XP e as estatísticas subirem; o mapa fica', () => {
      const servidor = {
        ...envioDoTutorial(jogado),
        xp: 300,
        titulo: 'Arqueólogo de Código',
        estatisticas: { expedicoes: 9, acertos: 2, contestacoes_vencidas: 1 },
      };
      const depois = tutorial(jogado, { tipo: 'sincronizar', servidor });
      expect(depois.xp).toBe(300);
      expect(depois.estatisticas).toEqual({ expedicoes: 9, acertos: 4, contestacoes_vencidas: 1 });
      expect(depois.aventura).toBe(jogado.aventura);
      const menor = { ...servidor, xp: 0, titulo: 'Comitador Cego' };
      expect(tutorial(jogado, { tipo: 'sincronizar', servidor: menor }).xp).toBe(80);
    });
  });

  it('o envio do Tutorial: id fixo, Progresso em % e Classe', () => {
    expect(envioDoTutorial(ESTADO_INICIAL)).toEqual({
      xp: 0,
      titulo: 'Comitador Cego',
      estatisticas: { expedicoes: 0, acertos: 0, contestacoes_vencidas: 0 },
      aventuras: [],
    });
    const venceu = batalhar(backend, [true, true, true, true]);
    // API de Pedidos revelada e todas as outras seis fora da Névoa: 1 de 7.
    expect(envioDoTutorial(venceu)).toEqual({
      xp: 80,
      titulo: 'Comitador Cego',
      estatisticas: { expedicoes: 1, acertos: 4, contestacoes_vencidas: 0 },
      aventuras: [{ id: 'tutorial', progresso: 14, classe: 'backend' }],
    });
  });

  it('o estado inteiro sobrevive a JSON, para ser guardado depois', () => {
    const meio = batalhar(backend, [true, false]);
    expect(JSON.parse(JSON.stringify(meio))).toEqual(meio);
  });

  it.each(['frontend', 'backend', 'fullstack'] as const)(
    'o Tutorial inteiro é jogável: %s, acertando tudo, revela as 7 regiões',
    (classe) => {
      let estado = rodar([{ tipo: 'escolherClasse', classe }]);
      const estados = () => Object.entries(estado.aventura?.mapa.estados ?? {});
      for (let expedicoes = 0; expedicoes < 7; expedicoes++) {
        const [regiaoId] = estados().find(([id]) => podePartir(estado, id)) ?? [];
        if (!regiaoId) break;
        const desafios = desafiosParaPartir(estado, regiaoId, () => 0.5);
        estado = tutorial(estado, { tipo: 'partir', regiaoId, desafios });
        while (estado.expedicao?.fase === 'respondendo') {
          const k = estado.expedicao.atual;
          const resposta = [...desafios[k]!.gabarito];
          estado = rodar([{ tipo: 'responder', resposta }, { tipo: 'avancar' }], estado);
        }
        expect(estado.aventura?.mapa.estados[regiaoId], regiaoId).toBe('revelada');
        estado = tutorial(estado, { tipo: 'voltarAoMapa' });
      }
      expect(estados().map(([, e]) => e)).toEqual(Array(7).fill('revelada'));
    },
  );
});
