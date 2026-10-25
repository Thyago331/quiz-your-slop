import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARVORE_VAZIA, lerAventuraSalva, montarAventura } from '@quiz/jogo';
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

const REVELACAO = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const ARQUIVOS: Record<string, string> = {
  'src/rotas.ts':
    "import { criarPedido } from './pedidos';\n\napp.post('/orders', (req) => criarPedido(req.body));\n",
  'src/pedidos.ts': 'export function criarPedido(dados) {\n  return dados;\n}\n',
};
const DIFF = 'diff --git a/src/rotas.ts b/src/rotas.ts\n+app.post(...)\n';

/** Uma Aventura guardada (v3) com Rotas já revelada no commit REVELACAO. */
function guardada() {
  let n = 0;
  const a = montarAventura({
    id: '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b',
    agora: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'backend',
    repositorios: [{ nome: 'loja', caminho_local: '/home/a/loja', commit: REVELACAO }],
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
  return {
    ...a,
    regioes: a.regioes.map((r) => ({
      ...r,
      arquivos: ['src/rotas.ts'],
      revelada_em: { loja: REVELACAO },
    })),
    mapa: { ...a.mapa, estados: { 'id-2': 'revelada' as const } },
  };
}

/** O git do Projeto: desde a revelação, rotas.ts mudou 4 de 10 linhas e surgiu src/pedidos.ts. */
function git() {
  vi.mocked(sistema.rodarGit).mockImplementation(async (_raiz, c) => {
    if (c.tipo === 'rev_parse_head') return `${HEAD}\n`;
    if (c.tipo === 'ls_files') return Object.keys(ARQUIVOS).join('\0');
    if (c.tipo === 'diff') return DIFF;
    if (c.de === REVELACAO) return '3\t1\tsrc/rotas.ts\x005\t0\tsrc/pedidos.ts\0';
    if (c.ate === REVELACAO) return '10\t0\tsrc/rotas.ts\0';
    return '12\t0\tsrc/rotas.ts\0';
  });
}

const multipla = (n: number) => ({
  formato: 'multipla_escolha',
  enunciado: `O que mudou na rota? (${n})`,
  dificuldade: n,
  opcoes: [
    { id: 'a', texto: `Chama criarPedido ${n}` },
    { id: 'b', texto: `Nada ${n}` },
  ],
  gabarito: ['a'],
  explicacao: 'O diff mostra.',
  evidencias: [
    {
      caminho: 'src/rotas.ts',
      linha_inicio: 3,
      linha_fim: 3,
      trecho: "app.post('/orders', (req) => criarPedido(req.body));",
    },
  ],
});
const PREPARAR = {
  desafios: [
    multipla(1),
    {
      formato: 'apontar',
      enunciado: 'Onde mora o arquivo novo?',
      dificuldade: 2,
      opcoes: [
        { id: 'a', caminho: 'src/pedidos.ts', simbolo: 'criarPedido' },
        { id: 'b', caminho: 'src/rotas.ts' },
      ],
      gabarito: ['a'],
      explicacao: 'A função nova.',
      evidencias: [
        {
          caminho: 'src/pedidos.ts',
          linha_inicio: 1,
          linha_fim: 1,
          trecho: 'export function criarPedido(dados) {',
        },
      ],
    },
    multipla(3),
    multipla(4),
    multipla(5),
  ],
  ligacoes: [],
  arquivos_atualizados: ['src/rotas.ts', 'src/pedidos.ts', 'src/inventado.ts'],
};

const envelope = (saida: unknown) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, structured_output: saida });

const item = (nome: string | RegExp) => screen.getByRole('menuitem', { name: nome });

const ultimaSalva = () => {
  const salvas = vi.mocked(sistema.salvarAventura).mock.calls;
  return lerAventuraSalva(salvas[salvas.length - 1]![1])!;
};

describe('Região desatualizada (desktop)', () => {
  beforeEach(() => {
    localStorage.setItem('quiz-your-slop:idioma', 'pt');
    vi.clearAllMocks();
    vi.mocked(sistema.carregarAventuras).mockResolvedValue([JSON.stringify(guardada())]);
    vi.mocked(sistema.salvarAventura).mockResolvedValue(null);
    vi.mocked(sistema.lerArquivo).mockImplementation(async (_raiz, caminho) => {
      const conteudo = ARQUIVOS[caminho];
      if (conteudo === undefined) throw { codigo: 'io', detalhe: 'não existe' };
      return conteudo;
    });
    vi.mocked(sistema.rodarMestre).mockResolvedValue(envelope(PREPARAR));
    git();
  });

  it('ao abrir a Aventura, o git marca a região e o mapa avisa o que mudou', async () => {
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(await screen.findByRole('menuitem', { name: 'Continuar — loja (100%)' }));
    expect(await screen.findByRole('button', { name: 'Rotas, desatualizada' })).toBeTruthy();
    const aviso = screen.getByRole('status', { name: '⟳ O código mudou desde a revelação' });
    expect(aviso.textContent).toContain('2 arquivos · +3 −1 linhas (40% da região)');
    expect(within(aviso).getByText('✎ src/rotas.ts (+3 −1)')).toBeTruthy();
    expect(within(aviso).getByText('✚ novo: src/pedidos.ts')).toBeTruthy();
    expect(screen.getByText(/Região desatualizada: o código mudou/)).toBeTruthy();
    // Só git, só leituras, nada de IA; a Aventura guardada já sai desatualizada.
    expect(sistema.rodarMestre).not.toHaveBeenCalled();
    expect(vi.mocked(sistema.rodarGit).mock.calls.map(([, c]) => c)).toEqual([
      { tipo: 'diff_numstat', de: REVELACAO, ate: 'HEAD', caminhos: ['src'] },
      {
        tipo: 'diff_numstat',
        de: ARVORE_VAZIA.sha1,
        ate: REVELACAO,
        caminhos: ['src/rotas.ts', 'src/pedidos.ts'],
      },
      { tipo: 'diff_numstat', de: ARVORE_VAZIA.sha1, ate: 'HEAD', caminhos: ['src/rotas.ts'] },
    ]);
    await waitFor(() => expect(ultimaSalva().mapa.estados['id-2']).toBe('desatualizada'));
  });

  it('a Expedição recebe o diff, e vencer revela de novo com o commit e os arquivos novos', async () => {
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(await screen.findByRole('menuitem', { name: 'Continuar — loja (100%)' }));
    await screen.findByRole('button', { name: 'Rotas, desatualizada' });
    await user.click(item('⚔ Partir em Expedição'));
    expect(await screen.findByText('O que mudou na rota? (1)')).toBeTruthy();
    expect(vi.mocked(sistema.rodarMestre)).toHaveBeenCalledTimes(1);
    const [pedido] = vi.mocked(sistema.rodarMestre).mock.calls[0]!;
    const contexto = JSON.parse(pedido.prompt.split('Context (JSON):\n')[1]!);
    expect(contexto.mudancas).toEqual({
      diff: DIFF,
      arquivos_alterados: ['src/rotas.ts', 'src/pedidos.ts'],
    });
    expect(contexto.ligacoes_conhecidas).toBe(false);
    expect((pedido.schema.required as string[]).includes('arquivos_atualizados')).toBe(true);

    await user.click(item('Chama criarPedido 1'));
    await user.click(item('Próximo Desafio'));
    await user.click(item(/src\/pedidos\.ts → criarPedido/));
    await user.click(item('Próximo Desafio'));
    await user.click(item('Chama criarPedido 3'));
    await user.click(item('Próximo Desafio'));
    await user.click(item('Chama criarPedido 4'));
    await user.click(item('Fim da batalha'));
    expect(screen.getByText('VITÓRIA!')).toBeTruthy();

    const salva = ultimaSalva();
    expect(salva.mapa.estados['id-2']).toBe('revelada');
    expect(salva.regioes[0]?.revelada_em).toEqual({ loja: HEAD });
    expect(salva.regioes[0]?.arquivos).toEqual(['src/rotas.ts', 'src/pedidos.ts']);
  });
});
