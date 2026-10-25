import { describe, expect, it } from 'vitest';
import { conferirEsquema } from './esquema.ts';
import { ErroDoMestre, type EntradaPrepararExpedicao, type PedidoAoMestre } from './mestre.ts';
import {
  PoucosDesafios,
  esquemaPrepararExpedicao,
  formatosFaltando,
  prepararExpedicao,
  type OpcoesDaPreparacao,
} from './preparacao.ts';
import {
  apontar,
  arquivos,
  ev,
  falso,
  fluxo,
  lerArquivo,
  ligacaoNova,
  ligacaoTela,
  multipla,
  repositorios,
} from './projetoDeTeste.ts';

const entrada: EntradaPrepararExpedicao = {
  idioma: 'pt',
  regiao: {
    id: 'r-rotas',
    nome: 'Rotas de pedidos',
    resumo: 'Recebe POST /orders.',
    territorio_id: 't-api',
    estado: 'desbloqueada',
    arquivos: ['src/rotas/pedidos.ts'],
  },
  mapa: [
    {
      id: 'r-tela',
      nome: 'Tela',
      resumo: 'O front.',
      territorio_id: 't-web',
      estado: 'revelada',
      arquivos: ['web/App.tsx'],
    },
  ],
  classe: 'backend',
  desafios_anteriores: ['Pergunta antiga?'],
  ligacoes_conhecidas: false,
  quantidade: 5,
  territorios: [
    { id: 't-api', nome: 'API', resumo: 'O back.', raizes: ['src'] },
    { id: 't-web', nome: 'Web', resumo: 'O front.', raizes: ['web'] },
  ],
};

function opcoes(extra: Partial<OpcoesDaPreparacao> = {}): OpcoesDaPreparacao {
  let n = 0;
  return {
    repositorios,
    arquivos,
    lerArquivo,
    gerarId: () => `j-${++n}`,
    aleatorio: () => 0,
    ...extra,
  };
}

const cinco = [multipla(1, 1), apontar(2), fluxo(3), multipla(4, 5), multipla(5, 3)];

describe('prepararExpedicao', () => {
  it('pede 5 Desafios com a lente da Classe, a mistura e o que já foi visto; ids do Jogo', async () => {
    const { transporte, pedidos, contexto } = falso({
      desafios: cinco,
      ligacoes: [ligacaoNova, ligacaoTela],
    });
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(pedidos).toHaveLength(1);
    const { prompt, schema, chamada } = pedidos[0]!;
    expect(chamada).toBe('preparar_expedicao');
    expect(prompt).toContain('Call: preparar_expedicao');
    expect(prompt).toContain('exactly 5 new Challenges');
    expect(prompt).toContain('backend → contracts');
    expect(prompt).toContain('at least 1 "apontar"');
    expect(prompt).toContain('"ligacoes": every concrete communication');
    expect(prompt).toContain('Brazilian Portuguese (pt)');
    expect(contexto(0)).toMatchObject({
      quantidade: 5,
      ligacoes_conhecidas: false,
      desafios_anteriores: ['Pergunta antiga?'],
    });
    expect(schema.required).toEqual(['desafios', 'ligacoes']);

    expect(r.pedidos).toBe(1);
    expect(r.descartados).toEqual([]);
    expect(r.desafios.map((d) => d.dificuldade)).toEqual([1, 3, 3, 4, 5]);
    expect(r.desafios.every((d) => d.id?.startsWith('j-'))).toBe(true);
    // Caminho normalizado e Opção só com os campos do Formato.
    const ap = r.desafios.find((d) => d.formato === 'apontar')!;
    expect(ap.opcoes[2]).toEqual({
      id: 'c',
      caminho: 'src/rotas/pedidos.ts',
      simbolo: 'rotaPedidos',
    });
    const me = r.desafios.find((d) => d.formato === 'multipla_escolha')!;
    expect(me.opcoes[0]).toEqual({ id: 'a', texto: 'POST /orders' });
    expect(r.ligacoes?.map((l) => [l.id.startsWith('j-'), l.destino])).toEqual([
      [true, ligacaoNova.destino],
      [true, { regiao_id: 'r-tela' }],
    ]);
  });

  it('as lentes de Frontend e Fullstack mudam o ângulo', async () => {
    for (const [classe, trecho] of [
      ['frontend', 'frontend → state'],
      ['fullstack', 'more "tracar_fluxo"'],
    ] as const) {
      const { transporte, pedidos } = falso({ desafios: cinco, ligacoes: [] });
      await prepararExpedicao(transporte, { ...entrada, classe }, opcoes());
      expect(pedidos[0]!.prompt).toContain(trecho);
    }
  });

  it('confere as Evidências: arquivo, intervalo e trecho (ignorando espaços); linhas trocadas são corrigidas', async () => {
    const espacos = {
      ...multipla(6),
      evidencias: [ev(4, 4, "   app.post('/orders',   async (req, res) =>  {  ")],
    };
    const deslocada = {
      ...multipla(7),
      evidencias: [ev(9, 9, "app.post('/orders', async (req, res) => {")],
    };
    const semArquivo = { ...multipla(8), evidencias: [ev(1, 1, 'x', 'src/nao-existe.ts')] };
    const outroTrecho = { ...multipla(9), evidencias: [ev(4, 4, 'app.get(...)')] };
    const absoluto = { ...multipla(10), evidencias: [ev(1, 1, 'x', '/etc/passwd')] };
    const { transporte } = falso({
      desafios: [apontar(1), espacos, deslocada, semArquivo, outroTrecho, absoluto],
      ligacoes: [],
    });
    const r = await prepararExpedicao(transporte, { ...entrada, quantidade: 3 }, opcoes());
    expect(r.desafios.map((d) => d.enunciado).sort()).toEqual([
      'Onde o pedido é gravado? (1)',
      'Qual rota cria o pedido? (6)',
      'Qual rota cria o pedido? (7)',
    ]);
    expect(r.desafios.find((d) => d.enunciado.endsWith('(7)'))!.evidencias[0]).toMatchObject({
      linha_inicio: 4,
      linha_fim: 4,
    });
    expect(r.descartados.map((d) => d.problemas.join(' '))).toEqual([
      expect.stringContaining('src/nao-existe.ts:1: arquivo_inexistente'),
      expect.stringContaining('trecho_diferente'),
      expect.stringContaining('caminho absoluto'),
    ]);
  });

  it('descarta Apontar com símbolo ou arquivo que não existem, gabarito fora das opções e passo em região desconhecida', async () => {
    const semArquivo = apontar(4);
    semArquivo.opcoes[1] = { id: 'b', caminho: 'src/cache.ts', simbolo: 'db' };
    const foraDoGabarito = { ...multipla(5), gabarito: ['z'] };
    const doisCertos = { ...multipla(6), gabarito: ['a', 'b'] };
    const semOrdem = { ...fluxo(7), gabarito: ['p1', 'p2'] };
    const { transporte } = falso({
      desafios: [
        multipla(1),
        apontar(2),
        fluxo(3, 'r-tela'),
        apontar(8, 'gravarPedido'),
        semArquivo,
        foraDoGabarito,
        doisCertos,
        fluxo(9, 'r-inventada'),
        semOrdem,
      ],
      ligacoes: [],
    });
    const r = await prepararExpedicao(transporte, { ...entrada, quantidade: 3 }, opcoes());
    expect(r.desafios).toHaveLength(3);
    expect(r.descartados.map((d) => d.problemas[0])).toEqual([
      'desafios[3].opcoes[0] src/servicos/pedidos.ts → gravarPedido: simbolo_inexistente',
      'desafios[4].opcoes[1] src/cache.ts → db: arquivo_inexistente',
      'desafios[5].gabarito: ids fora das opcoes: z',
      'desafios[6].gabarito: precisa de exatamente 1 id',
      'desafios[7].opcoes[0].regiao_id: id desconhecido: r-inventada',
      'desafios[8].gabarito: precisa da ordem completa dos passos',
    ]);
  });

  it('Traçar o fluxo que chega na ordem certa é embaralhado pelo Jogo', async () => {
    const emOrdem = fluxo(1);
    emOrdem.opcoes = [emOrdem.opcoes[1]!, emOrdem.opcoes[0]!, emOrdem.opcoes[2]!];
    const { transporte } = falso({ desafios: [emOrdem, apontar(2), multipla(3)], ligacoes: [] });
    const r = await prepararExpedicao(transporte, { ...entrada, quantidade: 3 }, opcoes());
    const f = r.desafios.find((d) => d.formato === 'tracar_fluxo')!;
    expect(f.opcoes.map((o) => o.id)).not.toEqual(f.gabarito);
    expect([...f.opcoes.map((o) => o.id)].sort()).toEqual(['p1', 'p2', 'p3']);
  });

  it('descarta os inválidos e pede só os que faltam, com as Ligações já conhecidas', async () => {
    const ruim = { ...multipla(4), evidencias: [ev(4, 4, 'inventado')] };
    const { transporte, pedidos, contexto } = falso(
      {
        desafios: [
          multipla(1),
          apontar(2),
          fluxo(3),
          ruim,
          { ...ruim, enunciado: 'Pergunta antiga?' },
        ],
        ligacoes: [ligacaoTela],
      },
      { desafios: [multipla(5), multipla(6, 5)] },
    );
    const eventos: unknown[] = [];
    const r = await prepararExpedicao(
      transporte,
      entrada,
      opcoes({ aoPreparar: (e) => eventos.push(e) }),
    );
    expect(pedidos).toHaveLength(2);
    expect(contexto(1)).toMatchObject({ quantidade: 2, ligacoes_conhecidas: true });
    expect(contexto(1).desafios_anteriores).toEqual([
      'Pergunta antiga?',
      'Qual rota cria o pedido? (1)',
      'Onde o pedido é gravado? (2)',
      'Ordene o caminho do pedido. (3)',
    ]);
    expect(pedidos[1]!.prompt).toContain('exactly 2 new Challenges');
    expect(pedidos[1]!.prompt).toContain('Do not return "ligacoes"');
    expect(pedidos[1]!.prompt).toContain(
      'desafios[3].evidencias[0] src/rotas/pedidos.ts:4: trecho_diferente',
    );
    expect(pedidos[1]!.prompt).toContain('desafios[4]: enunciado repetido');
    expect(pedidos[1]!.schema.required).toEqual(['desafios']);
    expect(r.desafios).toHaveLength(5);
    expect(r.ligacoes).toHaveLength(1);
    expect(r.pedidos).toBe(2);
    expect(eventos).toEqual([
      { tipo: 'pedido', numero: 1, quantidade: 5 },
      { tipo: 'conferida', validos: 3, descartados: 2, quantidade: 5 },
      { tipo: 'pedido', numero: 2, quantidade: 2 },
      { tipo: 'conferida', validos: 5, descartados: 0, quantidade: 5 },
    ]);
  });

  it('com 3 válidos depois de 2 reposições, a Expedição roda', async () => {
    const ruim = { ...multipla(9), evidencias: [ev(1, 1, 'x', 'nada.ts')] };
    const { transporte, pedidos } = falso(
      { desafios: [apontar(1), ruim, ruim], ligacoes: [] },
      { desafios: [multipla(2), ruim] },
      { desafios: [multipla(3, 1), ruim] },
    );
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(pedidos).toHaveLength(3);
    expect(r.desafios.map((d) => d.enunciado)).toEqual([
      'Qual rota cria o pedido? (3)',
      'Qual rota cria o pedido? (2)',
      'Onde o pedido é gravado? (1)',
    ]);
  });

  it('com 2 válidos, erro claro (PoucosDesafios) depois de 3 pedidos', async () => {
    const ruim = { ...multipla(9), evidencias: [ev(1, 1, 'x', 'nada.ts')] };
    const { transporte, pedidos } = falso(
      { desafios: [apontar(1), multipla(2), ruim], ligacoes: [] },
      { desafios: [ruim] },
    );
    const erro = await prepararExpedicao(transporte, entrada, opcoes()).catch((e: unknown) => e);
    expect(pedidos).toHaveLength(3);
    expect(erro).toBeInstanceOf(PoucosDesafios);
    expect(erro).toBeInstanceOf(ErroDoMestre);
    expect((erro as PoucosDesafios).validos).toBe(2);
    expect((erro as PoucosDesafios).problemas[0]).toContain('nada.ts:1: arquivo_inexistente');
  });

  it('saída inteira inválida (JSON, schema) tenta a mesma chamada de novo, até 2 vezes', async () => {
    const { transporte, pedidos } = falso(
      'não é json',
      { desafios: [] },
      { desafios: cinco, ligacoes: [] },
    );
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(pedidos).toHaveLength(3);
    expect(pedidos[2]!.prompt).toContain('$.desafios: menos de 1 itens');
    expect(contextoDe(pedidos[2]!).quantidade).toBe(5);
    expect(r.desafios).toHaveLength(5);

    const sempre = falso({ desafios: 'nada' });
    const erro = await prepararExpedicao(sempre.transporte, entrada, opcoes()).catch(
      (e: unknown) => e,
    );
    expect(sempre.pedidos).toHaveLength(3);
    expect(erro).toBeInstanceOf(ErroDoMestre);
    expect(erro).not.toBeInstanceOf(PoucosDesafios);
  });

  it('uma reposição que falha inteira não estraga os 3 válidos', async () => {
    const ruim = { ...multipla(9), evidencias: [ev(1, 1, 'x', 'nada.ts')] };
    const { transporte, pedidos } = falso(
      { desafios: [apontar(1), multipla(2), multipla(3), ruim], ligacoes: [] },
      'quebrado',
    );
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(pedidos).toHaveLength(4);
    expect(r.desafios).toHaveLength(3);
  });

  it('confere as Ligações: destino conhecido ou região nova com arquivos fora desta região', async () => {
    const paraSi = { ...ligacaoTela, destino: { regiao_id: 'r-rotas' } };
    const desconhecida = { ...ligacaoTela, destino: { regiao_id: 'r-x' } };
    const dosDois = {
      ...ligacaoTela,
      destino: { regiao_id: 'r-tela', nova: ligacaoNova.destino.nova },
    };
    const semente = (arquivos_semente: string[]) => ({
      ...ligacaoNova,
      destino: { nova: { ...ligacaoNova.destino.nova, arquivos_semente } },
    });
    const evidenciaRuim = { ...ligacaoTela, evidencias: [ev(1, 1, 'nada')] };
    const umaBoa = { ...ligacaoTela, evidencias: [ev(1, 1, 'nada'), ...ligacaoTela.evidencias] };
    const territorio = {
      ...ligacaoNova,
      destino: { nova: { ...ligacaoNova.destino.nova, territorio_id: 't-x' } },
    };
    const { transporte } = falso({
      desafios: cinco,
      ligacoes: [
        paraSi,
        desconhecida,
        dosDois,
        semente(['src/rotas/pedidos.ts']),
        semente(['src/nao-existe.ts']),
        semente(['src/db.ts', 'src/rotas/pedidos.ts']),
        evidenciaRuim,
        umaBoa,
        territorio,
      ],
    });
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(r.ligacoes?.map((l) => l.destino)).toEqual([
      { nova: { ...ligacaoNova.destino.nova, arquivos_semente: ['src/db.ts'] } },
      { regiao_id: 'r-tela' },
    ]);
    expect(r.ligacoes?.[1]?.evidencias).toEqual(ligacaoTela.evidencias);
    expect(r.descartados.map((d) => d.problemas[0])).toEqual([
      'ligacoes[0].destino: a própria região',
      'ligacoes[1].destino.regiao_id: id desconhecido: r-x',
      'ligacoes[2].destino: precisa de regiao_id ou nova (um dos dois)',
      'ligacoes[3].destino.nova.arquivos_semente: só arquivos desta região',
      'ligacoes[4].destino.nova.arquivos_semente: nenhum arquivo existe no Projeto: src/nao-existe.ts',
      'ligacoes[6].evidencias[0] src/rotas/pedidos.ts:1: trecho_diferente',
      'ligacoes[8].destino.nova.territorio_id: id desconhecido: t-x',
    ]);
  });

  it('Ligações todas recusadas continuam desconhecidas: a reposição pede de novo', async () => {
    const ruim = { ...multipla(9), evidencias: [ev(1, 1, 'x', 'nada.ts')] };
    const { transporte, contexto } = falso(
      {
        desafios: [...cinco.slice(0, 4), ruim],
        ligacoes: [{ ...ligacaoTela, destino: { regiao_id: 'r-x' } }],
      },
      { desafios: [multipla(6)], ligacoes: [] },
    );
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(contexto(1).ligacoes_conhecidas).toBe(false);
    expect(r.ligacoes).toEqual([]);
  });

  it('com Ligações já conhecidas, não as pede; se vierem, são ignoradas', async () => {
    const { transporte, pedidos } = falso({ desafios: cinco, ligacoes: [ligacaoTela] });
    const r = await prepararExpedicao(
      transporte,
      { ...entrada, ligacoes_conhecidas: true },
      opcoes({ temLigacoes: true }),
    );
    expect(pedidos[0]!.prompt).toContain('Do not return "ligacoes"');
    expect(pedidos[0]!.schema.required).toEqual(['desafios']);
    expect(r.ligacoes).toBeUndefined();
  });

  it('falta a mistura mínima: pede um Desafio do Formato que falta e monta os 5 com ele', async () => {
    const { transporte, pedidos, contexto } = falso(
      {
        desafios: [multipla(1), multipla(2), multipla(3), multipla(4), fluxo(5)],
        ligacoes: [ligacaoTela],
      },
      { desafios: [apontar(6)] },
    );
    const r = await prepararExpedicao(transporte, entrada, opcoes());
    expect(contexto(1).quantidade).toBe(1);
    expect(pedidos[1]!.prompt).toContain('at least one Challenge of each format: "apontar"');
    expect(r.desafios).toHaveLength(5);
    expect(formatosFaltando(r.desafios, true)).toEqual([]);
  });
});

describe('esquemaPrepararExpedicao', () => {
  it('aceita a saída do contrato e recusa campos a mais', () => {
    const saida = { desafios: cinco, ligacoes: [ligacaoNova, ligacaoTela] };
    expect(conferirEsquema(esquemaPrepararExpedicao(false), saida)).toEqual([]);
    expect(conferirEsquema(esquemaPrepararExpedicao(true), { desafios: cinco })).toEqual([]);
    expect(conferirEsquema(esquemaPrepararExpedicao(false), { desafios: cinco })).toEqual([
      '$.ligacoes: faltando',
    ]);
    expect(
      conferirEsquema(esquemaPrepararExpedicao(true), {
        desafios: [{ ...multipla(1), isca: true }],
      }),
    ).toEqual(['$.desafios[0].isca: campo desconhecido']);
  });
});

function contextoDe(pedido: PedidoAoMestre) {
  return JSON.parse(pedido.prompt.split('Context (JSON):\n')[1]!) as EntradaPrepararExpedicao;
}
