import { describe, expect, it } from 'vitest';
import { contestacaoRoteirizada, contestar } from './contestacao.ts';
import type { Desafio } from './contrato.ts';
import { conferirEsquema } from './esquema.ts';
import { ErroDoMestre, NOVAS_TENTATIVAS, type EntradaContestar } from './mestre.ts';
import { arquivos, ev, falso, lerArquivo, repositorios } from './projetoDeTeste.ts';

const comum: Desafio = {
  id: 'd1',
  formato: 'multipla_escolha',
  enunciado: 'Qual rota cria o pedido?',
  dificuldade: 1,
  opcoes: [
    { id: 'a', texto: 'GET /items' },
    { id: 'b', texto: 'POST /orders' },
  ],
  gabarito: ['b'],
  explicacao: 'O `server.ts` registra a rota.',
  evidencias: [{ caminho: 'api/src/server.ts', linha_inicio: 10, linha_fim: 10, trecho: '…' }],
};
const anulacao = {
  explicacao: 'Nenhuma linha de `charge()` confere pedido repetido. O comentário mente.',
  evidencias: [
    { caminho: 'api/src/payments/dwarfVault.ts', linha_inicio: 24, linha_fim: 24, trecho: '…' },
  ],
};

describe('contestacaoRoteirizada (Tutorial, sem Mestre)', () => {
  it('Desafio comum: gabarito mantido, com a explicação e as Evidências do próprio Desafio', () => {
    expect(contestacaoRoteirizada(comum)).toEqual({
      veredito: 'mantido',
      explicacao: comum.explicacao,
      evidencias: comum.evidencias,
    });
  });

  it('o texto de anulação não muda o veredito de um Desafio comum', () => {
    expect(contestacaoRoteirizada(comum, anulacao).veredito).toBe('mantido');
  });

  it('Desafio-isca: anulado, com o texto fixo e o código de verdade', () => {
    expect(contestacaoRoteirizada({ ...comum, isca: true }, anulacao)).toEqual({
      veredito: 'anulado',
      ...anulacao,
    });
  });

  it('isca sem texto de anulação é erro de quem escreveu o Desafio', () => {
    expect(() => contestacaoRoteirizada({ ...comum, isca: true })).toThrow(/isca/);
  });
});

// ---------------------------------------------------------------------------------------------
// A Contestação real: o Mestre relê o código e o Jogo confere as Evidências do veredito.

const desafio: Desafio = {
  id: 'j-1',
  formato: 'multipla_escolha',
  enunciado: 'Qual rota cria o pedido?',
  dificuldade: 2,
  opcoes: [
    { id: 'a', texto: 'GET /orders' },
    { id: 'b', texto: 'POST /orders' },
  ],
  gabarito: ['a'],
  explicacao: 'A rota registra app.get.',
  evidencias: [ev(4, 4, "app.post('/orders', async (req, res) => {")],
};
const entrada: EntradaContestar = {
  idioma: 'es',
  desafio,
  resposta_jogador: ['b'],
  argumento: 'A linha 4 registra app.post, não app.get.',
};
const opcoesDaContestacao = { repositorios, arquivos, lerArquivo };
const provaBoa = ev(4, 4, "app.post('/orders', async (req, res) => {");
const provaInventada = ev(4, 4, "app.get('/orders', listar);");
const anulado = (...evidencias: unknown[]) => ({
  veredito: 'anulado',
  explicacao: 'A rota é POST: o gabarito errou.',
  evidencias,
});

describe('contestar (Contestação real com o Mestre)', () => {
  it('pede ao Mestre que releia o código e julgue com justiça, no idioma do Jogador', async () => {
    const { transporte, pedidos } = falso(anulado(provaBoa));
    await contestar(transporte, entrada, opcoesDaContestacao);
    expect(pedidos).toHaveLength(1);
    const { chamada, prompt, schema } = pedidos[0]!;
    expect(chamada).toBe('contestar');
    expect(prompt).toContain('Call: contestar');
    expect(prompt).toContain('Reread the code');
    expect(prompt).toContain('The Player may be right and the answer key wrong');
    expect(prompt).toContain('Spanish (es)');
    const contexto = JSON.parse(prompt.split('Context (JSON):\n')[1]!);
    expect(contexto).toEqual({
      idioma: 'es',
      desafio: {
        formato: desafio.formato,
        enunciado: desafio.enunciado,
        dificuldade: desafio.dificuldade,
        opcoes: desafio.opcoes,
        gabarito: desafio.gabarito,
        explicacao: desafio.explicacao,
        evidencias: desafio.evidencias,
      },
      resposta_jogador: ['b'],
      argumento: entrada.argumento,
    });
    expect(conferirEsquema(schema, anulado(provaBoa))).toEqual([]);
    expect(conferirEsquema(schema, { ...anulado(provaBoa), veredito: 'talvez' })).not.toEqual([]);
  });

  it('anulado com Evidência que bate com o arquivo: o veredito vale (linhas corrigidas)', async () => {
    const { transporte } = falso(
      anulado(provaInventada, { ...provaBoa, linha_inicio: 9, linha_fim: 9 }),
    );
    const r = await contestar(transporte, entrada, opcoesDaContestacao);
    expect(r).toEqual({
      veredito: 'anulado',
      explicacao: 'A rota é POST: o gabarito errou.',
      evidencias: [provaBoa],
    });
  });

  it('anulado sem Evidência válida pede de novo, dizendo por quê', async () => {
    const { transporte, pedidos } = falso(anulado(provaInventada), anulado(provaBoa));
    const r = await contestar(transporte, entrada, opcoesDaContestacao);
    expect(pedidos).toHaveLength(2);
    expect(pedidos[1]!.prompt).toContain('Your previous answer was rejected');
    expect(pedidos[1]!.prompt).toContain('trecho_diferente');
    expect(r.veredito).toBe('anulado');
  });

  it('anulado sem prova depois das novas tentativas: o gabarito fica mantido, sem prova', async () => {
    const eventos: string[] = [];
    const { transporte, pedidos } = falso(anulado(ev(1, 1, 'nada', 'src/inexistente.ts')));
    const r = await contestar(transporte, entrada, {
      ...opcoesDaContestacao,
      aoAcompanhar: (e) => eventos.push(e.tipo),
    });
    expect(pedidos).toHaveLength(1 + NOVAS_TENTATIVAS);
    expect(eventos).toEqual([
      'tentativa',
      'recusada',
      'tentativa',
      'recusada',
      'tentativa',
      'recusada',
    ]);
    expect(r).toEqual({
      veredito: 'mantido',
      explicacao: desafio.explicacao,
      evidencias: desafio.evidencias,
      semProva: true,
    });
  });

  it('mantido: a explicação e só as Evidências que batem com o código', async () => {
    const { transporte, pedidos } = falso({
      veredito: 'mantido',
      explicacao: 'O gabarito está certo.',
      evidencias: [provaInventada, provaBoa],
    });
    const r = await contestar(transporte, entrada, opcoesDaContestacao);
    expect(pedidos).toHaveLength(1);
    expect(r).toEqual({
      veredito: 'mantido',
      explicacao: 'O gabarito está certo.',
      evidencias: [provaBoa],
    });
  });

  it('saída fora do schema tenta de novo; depois das tentativas, erro claro', async () => {
    const certo = falso('não é JSON', { veredito: 'anulado' }, anulado(provaBoa));
    expect((await contestar(certo.transporte, entrada, opcoesDaContestacao)).veredito).toBe(
      'anulado',
    );
    expect(certo.pedidos).toHaveLength(3);

    const quebrado = falso({ veredito: 'talvez', explicacao: 'x', evidencias: [provaBoa] });
    const erro = await contestar(quebrado.transporte, entrada, opcoesDaContestacao).catch(
      (e: unknown) => e,
    );
    expect(erro).toBeInstanceOf(ErroDoMestre);
    expect((erro as ErroDoMestre).chamada).toBe('contestar');
    expect(quebrado.pedidos).toHaveLength(1 + NOVAS_TENTATIVAS);
  });

  it('a falha mista (schema na última) não vira "mantido sem prova": é erro', async () => {
    const { transporte } = falso(anulado(provaInventada), anulado(provaInventada), '{}');
    await expect(contestar(transporte, entrada, opcoesDaContestacao)).rejects.toBeInstanceOf(
      ErroDoMestre,
    );
  });

  it('erro do transporte não tenta de novo; argumento vazio nem chama o Mestre', async () => {
    let chamadas = 0;
    const falha = async () => {
      chamadas++;
      throw new Error('CLI ausente');
    };
    await expect(contestar(falha, entrada, opcoesDaContestacao)).rejects.toThrow('CLI ausente');
    expect(chamadas).toBe(1);
    await expect(
      contestar(falha, { ...entrada, argumento: '   ' }, opcoesDaContestacao),
    ).rejects.toThrow(/argumento/);
    expect(chamadas).toBe(1);
  });
});
