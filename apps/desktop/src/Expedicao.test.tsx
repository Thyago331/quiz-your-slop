import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lerAventuraSalva, montarAventura } from '@quiz/jogo';
import { Jogo } from './Jogo.tsx';
import * as sistema from './sistema.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  carregarAventuras: vi.fn(),
  rodarGit: vi.fn(),
  rodarMestre: vi.fn(),
  lerArquivo: vi.fn(),
  salvarAventura: vi.fn(),
}));

const ARQUIVOS: Record<string, string> = {
  'src/rotas.ts':
    "import { criarPedido } from './pedidos';\n\napp.post('/orders', (req) => criarPedido(req.body));\n",
  'src/pedidos.ts': 'export function criarPedido(dados) {\n  return dados;\n}\n',
};

/** Uma Aventura guardada: a entrada (Rotas) desbloqueada e detalhada. */
function guardada() {
  let n = 0;
  const a = montarAventura({
    id: '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b',
    agora: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'backend',
    repositorios: [{ nome: 'loja', caminho_local: '/home/a/loja', commit: 'abc' }],
    saida: {
      territorios: [{ nome: 'Servidor', resumo: 'A API.', raizes: ['.'] }],
      candidatas_entrada: [
        {
          nome: 'Rotas',
          resumo: 'Recebe pedidos.',
          territorio_id: null,
          territorio_novo: { nome: 'Servidor', raizes: ['.'] },
          arquivos_semente: ['src/rotas.ts'],
          motivo: 'x',
        },
      ],
    },
    escolhida: 0,
    gerarId: () => `id-${++n}`,
  });
  return { ...a, regioes: a.regioes.map((r) => ({ ...r, arquivos: ['src/rotas.ts'] })) };
}

const evidencia = {
  caminho: 'src/rotas.ts',
  linha_inicio: 3,
  linha_fim: 3,
  trecho: "app.post('/orders', (req) => criarPedido(req.body));",
};
const multipla = (n: number, dificuldade: number) => ({
  formato: 'multipla_escolha',
  enunciado: `Qual rota cria o pedido? (${n})`,
  dificuldade,
  opcoes: [
    { id: 'a', texto: `POST /orders ${n}` },
    { id: 'b', texto: `GET /orders ${n}` },
  ],
  gabarito: ['a'],
  explicacao: 'A rota registra app.post.',
  evidencias: [evidencia],
});
const PREPARAR = {
  desafios: [
    multipla(1, 1),
    {
      formato: 'apontar',
      enunciado: 'Onde o pedido é criado?',
      dificuldade: 2,
      opcoes: [
        { id: 'a', caminho: 'src/pedidos.ts', simbolo: 'criarPedido' },
        { id: 'b', caminho: 'src/rotas.ts' },
      ],
      gabarito: ['a'],
      explicacao: 'A função mora no serviço.',
      evidencias: [
        {
          ...evidencia,
          caminho: 'src/pedidos.ts',
          linha_inicio: 1,
          linha_fim: 1,
          trecho: 'export function criarPedido(dados) {',
        },
      ],
    },
    multipla(3, 3),
    multipla(4, 4),
    {
      formato: 'tracar_fluxo',
      enunciado: 'Ordene o caminho.',
      dificuldade: 5,
      opcoes: [
        { id: 'p2', texto: 'O serviço cria', regiao_id: null, ligacao: 'dependencia' },
        { id: 'p1', texto: 'A rota recebe', regiao_id: 'id-2' },
        { id: 'p3', texto: 'Responde', regiao_id: 'id-2' },
      ],
      gabarito: ['p1', 'p2', 'p3'],
      explicacao: 'Rota → serviço.',
      evidencias: [evidencia],
    },
  ],
  ligacoes: [
    {
      tipo: 'dependencia',
      descricao: 'A rota chama criarPedido',
      destino: {
        nova: {
          nome: 'Serviço de pedidos',
          resumo: 'Cria pedidos.',
          territorio_id: 'id-1',
          arquivos_semente: ['src/pedidos.ts'],
        },
      },
      evidencias: [
        {
          ...evidencia,
          linha_inicio: 1,
          linha_fim: 1,
          trecho: "import { criarPedido } from './pedidos';",
        },
      ],
    },
  ],
};

const envelope = (saida: unknown) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, structured_output: saida });

const item = (nome: string | RegExp) => screen.getByRole('menuitem', { name: nome });

function preparar(saidaPreparar: unknown = PREPARAR, saidaContestar?: unknown) {
  vi.mocked(sistema.carregarAventuras).mockResolvedValue([JSON.stringify(guardada())]);
  vi.mocked(sistema.rodarGit).mockResolvedValue(Object.keys(ARQUIVOS).join('\0'));
  vi.mocked(sistema.lerArquivo).mockImplementation(async (_raiz, caminho) => {
    const conteudo = ARQUIVOS[caminho];
    if (conteudo === undefined) throw { codigo: 'io', detalhe: 'não existe' };
    return conteudo;
  });
  vi.mocked(sistema.salvarAventura).mockResolvedValue(null);
  vi.mocked(sistema.rodarMestre).mockImplementation(async ({ prompt }) =>
    prompt.includes('Call: preparar_expedicao')
      ? envelope(saidaPreparar)
      : prompt.includes('Call: contestar')
        ? envelope(saidaContestar)
        : envelope({ resumo: 'Cria e devolve pedidos.', arquivos: ['src/pedidos.ts'] }),
  );
}

/** Abre a Aventura guardada e parte em Expedição até o primeiro Desafio. */
async function partir(user: ReturnType<typeof userEvent.setup>) {
  render(<Jogo />);
  await user.click(await screen.findByRole('menuitem', { name: 'Continuar — loja (0%)' }));
  await user.click(item('⚔ Partir em Expedição'));
  expect(await screen.findByText('Qual rota cria o pedido? (1)')).toBeTruthy();
}

/** Erra o primeiro Desafio e contesta com um argumento. */
async function contestarOPrimeiro(user: ReturnType<typeof userEvent.setup>) {
  await user.click(item('GET /orders 1'));
  expect(screen.getByRole('status').textContent).toMatch(/desviou/);
  await user.click(item('⚑ Contestar o gabarito'));
  await user.type(screen.getByLabelText('Por que o gabarito está errado?'), 'GET também cria');
  await user.click(screen.getByRole('button', { name: '⚑ Enviar Contestação' }));
}

const vidaDoGuardiao = () =>
  screen.getByRole('meter', { name: 'Vida do Guardião' }).getAttribute('aria-valuenow');

const ultimaSalva = () => {
  const salvas = vi.mocked(sistema.salvarAventura).mock.calls;
  return lerAventuraSalva(salvas[salvas.length - 1]![1])!;
};

describe('Expedição no Projeto (desktop)', () => {
  beforeEach(() => {
    localStorage.setItem('quiz-your-slop:idioma', 'pt');
    vi.clearAllMocks();
  });

  it('prepara, batalha com o código ao lado, vence e as vizinhas aparecem detalhadas', async () => {
    preparar();
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(await screen.findByRole('menuitem', { name: 'Continuar — loja (0%)' }));
    expect(screen.getByText('XP 0 · Comitador Cego')).toBeTruthy();
    // O Mestre só responde quando o teste deixar: dá para ver a tela de preparação.
    let liberar = () => {};
    const espera = new Promise<void>((r) => (liberar = r));
    const responder = vi.mocked(sistema.rodarMestre).getMockImplementation()!;
    vi.mocked(sistema.rodarMestre).mockImplementation(async (pedido) => {
      await espera;
      return responder(pedido);
    });
    await user.click(item('⚔ Partir em Expedição'));
    expect(screen.getByText('O Mestre prepara a Expedição…')).toBeTruthy();
    expect(await screen.findByText(/Pedindo 5 Desafios sobre Rotas/)).toBeTruthy();
    liberar();

    // A batalha: a entrada já tem o código aberto no explorador.
    expect(await screen.findByText('Qual rota cria o pedido? (1)')).toBeTruthy();
    expect(screen.getByText('📜 src/rotas.ts')).toBeTruthy();
    await user.click(item('POST /orders 1'));
    expect(item('⚑ Contestar o gabarito')).toBeTruthy();
    // A Evidência abre o arquivo de verdade nas linhas dela.
    await user.click(screen.getAllByRole('button', { name: 'src/rotas.ts:3' })[0]!);
    expect(screen.getByLabelText('Código de src/rotas.ts, linhas 3 destacadas')).toBeTruthy();
    await user.click(item('Próximo Desafio'));

    await user.click(item(/src\/pedidos\.ts → criarPedido/));
    await user.click(item('Próximo Desafio'));
    await user.click(item('POST /orders 3'));
    await user.click(item('Próximo Desafio'));
    await user.click(item('POST /orders 4'));
    await user.click(item('Fim da batalha'));

    expect(screen.getByText('VITÓRIA!')).toBeTruthy();
    expect(screen.getByText('Serviço de pedidos')).toBeTruthy();
    expect(await screen.findByText('✔ Serviço de pedidos detalhada')).toBeTruthy();

    const chamadas = vi
      .mocked(sistema.rodarMestre)
      .mock.calls.map(([p]) => p.prompt.match(/Call: (\w+)/)?.[1]);
    expect(chamadas).toEqual(['preparar_expedicao', 'detalhar_regiao']);
    const salvas = vi.mocked(sistema.salvarAventura).mock.calls;
    const ultima = lerAventuraSalva(salvas[salvas.length - 1]![1])!;
    expect(ultima.xp).toBe(80);
    expect(ultima.regioes.find((r) => r.nome === 'Serviço de pedidos')?.arquivos).toEqual([
      'src/pedidos.ts',
    ]);

    await user.click(item('Voltar ao mapa'));
    expect(screen.getByRole('button', { name: 'Rotas, revelada' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Serviço de pedidos, desbloqueada' })).toBeTruthy();
    expect(screen.getByText('XP 80 · Comitador Cego')).toBeTruthy();
  });

  it('Contestação anulada: o Mestre relê o código, GOLPE CRÍTICO, e o resumo conta o bônus', async () => {
    preparar(PREPARAR, {
      veredito: 'anulado',
      explicacao: 'As duas rotas existem; o enunciado é ambíguo.',
      evidencias: [evidencia, { ...evidencia, trecho: 'inventado' }],
    });
    const user = userEvent.setup();
    await partir(user);
    // O Mestre só responde quando o teste deixar: dá para ver a espera.
    let liberar = () => {};
    const espera = new Promise<void>((r) => (liberar = r));
    const responder = vi.mocked(sistema.rodarMestre).getMockImplementation()!;
    vi.mocked(sistema.rodarMestre).mockImplementation(async (pedido) => {
      await espera;
      return responder(pedido);
    });
    await contestarOPrimeiro(user);
    expect(screen.getByText('O Mestre relê o código…')).toBeTruthy();
    expect(screen.queryByRole('menuitem')).toBeNull();
    liberar();

    expect(await screen.findByText('🏹 GOLPE CRÍTICO — CAÇADOR DE SLOP')).toBeTruthy();
    expect(
      screen.getByText(/GOLPE CRÍTICO! Desafio anulado — Caçador de Slop! \+50 XP/),
    ).toBeTruthy();
    expect(screen.getByText(/o enunciado é ambíguo/)).toBeTruthy();
    expect(screen.getByText(/O Mestre releu o código e deu razão a você/)).toBeTruthy();
    expect(vidaDoGuardiao()).toBe('3');
    expect(screen.queryByRole('menuitem', { name: /Contestar/ })).toBeNull();

    const pedido = vi
      .mocked(sistema.rodarMestre)
      .mock.calls.map(([p]) => p)
      .find((p) => p.prompt.includes('Call: contestar'))!;
    expect(pedido.prompt).toContain('Brazilian Portuguese (pt)');
    const contexto = JSON.parse(pedido.prompt.split('Context (JSON):\n')[1]!);
    expect(contexto).toMatchObject({
      idioma: 'pt',
      resposta_jogador: ['b'],
      argumento: 'GET também cria',
      desafio: { enunciado: 'Qual rota cria o pedido? (1)', gabarito: ['a'] },
    });

    await user.click(item('Próximo Desafio'));
    await user.click(item(/src\/pedidos\.ts → criarPedido/));
    await user.click(item('Próximo Desafio'));
    await user.click(item('POST /orders 3'));
    await user.click(item('Próximo Desafio'));
    await user.click(item('POST /orders 4'));
    await user.click(item('Fim da batalha'));

    expect(screen.getByText('VITÓRIA!')).toBeTruthy();
    expect(
      screen.getByText('🏹 Caçador de Slop: 1 Contestação vencida (+50 XP de bônus)'),
    ).toBeTruthy();
    expect(screen.getByText('+130 XP')).toBeTruthy();
    const salva = ultimaSalva();
    expect(salva.xp).toBe(130);
    expect(salva.estatisticas).toEqual({ expedicoes: 1, acertos: 4, contestacoes_vencidas: 1 });
  });

  it('Contestação mantida: a explicação e as Evidências do Mestre, que abrem no explorador', async () => {
    preparar(PREPARAR, {
      veredito: 'mantido',
      explicacao: 'Só o POST chama criarPedido.',
      evidencias: [
        {
          caminho: 'src/pedidos.ts',
          linha_inicio: 1,
          linha_fim: 1,
          trecho: 'export function criarPedido(dados) {',
        },
      ],
    });
    const user = userEvent.setup();
    await partir(user);
    await contestarOPrimeiro(user);
    expect(await screen.findByText('⚑ GABARITO MANTIDO')).toBeTruthy();
    expect(screen.getByText('Só o POST chama criarPedido.')).toBeTruthy();
    expect(vidaDoGuardiao()).toBe('4');
    await user.click(screen.getByRole('button', { name: 'src/pedidos.ts:1' }));
    expect(screen.getByLabelText('Código de src/pedidos.ts, linhas 1 destacadas')).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: /Contestar/ })).toBeNull();
  });

  it('a Contestação falha: erro claro, tentar de novo; ou desistir sem perder nada', async () => {
    preparar(PREPARAR, {
      veredito: 'anulado',
      explicacao: 'O gabarito errou.',
      evidencias: [evidencia],
    });
    const user = userEvent.setup();
    await partir(user);
    const responder = vi.mocked(sistema.rodarMestre).getMockImplementation()!;
    vi.mocked(sistema.rodarMestre).mockImplementation(async (pedido) => {
      if (pedido.prompt.includes('Call: contestar'))
        throw { codigo: 'tempo_esgotado', detalhe: { segundos: 600 } };
      return responder(pedido);
    });
    await contestarOPrimeiro(user);
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toBe(
      'O Mestre não conseguiu reavaliar o gabarito. O Mestre demorou demais (mais de 600 s).',
    );

    // Desistir: volta ao menu, sem veredito e sem perder nada.
    await user.click(item('Desistir da Contestação (sem perder nada)'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(vidaDoGuardiao()).toBe('4');
    expect(item('Próximo Desafio')).toBeTruthy();

    // Contestar de novo; falha outra vez; agora o Mestre responde e o tentar de novo vale.
    await user.click(item('⚑ Contestar o gabarito'));
    await user.type(screen.getByLabelText('Por que o gabarito está errado?'), 'De novo');
    await user.click(screen.getByRole('button', { name: '⚑ Enviar Contestação' }));
    await screen.findByRole('alert');
    vi.mocked(sistema.rodarMestre).mockImplementation(responder);
    await user.click(item('Tentar de novo'));
    expect(await screen.findByText('🏹 GOLPE CRÍTICO — CAÇADOR DE SLOP')).toBeTruthy();
    expect(vidaDoGuardiao()).toBe('3');
    const ultimo = vi.mocked(sistema.rodarMestre).mock.calls.at(-1)![0];
    expect(ultimo.prompt).toContain('"argumento": "De novo"');
  });

  it('com menos de 3 Desafios conferidos, erro claro e tentar de novo', async () => {
    const quebrado = { ...multipla(9, 1), evidencias: [{ ...evidencia, trecho: 'inventado' }] };
    preparar({ desafios: [multipla(1, 1), multipla(2, 2), quebrado], ligacoes: [] });
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(await screen.findByRole('menuitem', { name: 'Continuar — loja (0%)' }));
    await user.click(item('⚔ Partir em Expedição'));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Só 2 Desafios passaram na conferência do código');
    const linhas = within(screen.getByRole('list'))
      .getAllByRole('listitem')
      .map((l) => l.textContent);
    expect(linhas).toContain('✘ 2 de 5 Desafios conferidos no código · 1 descartados');
    expect(vi.mocked(sistema.rodarMestre)).toHaveBeenCalledTimes(3);

    vi.mocked(sistema.rodarMestre).mockResolvedValue(envelope(PREPARAR));
    await user.click(item('Tentar de novo'));
    await waitFor(() => expect(screen.getByText('Qual rota cria o pedido? (1)')).toBeTruthy());
  });
});
