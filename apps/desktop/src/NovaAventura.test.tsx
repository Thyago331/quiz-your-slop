import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AventuraNoProjeto } from '@quiz/jogo';
import { NovaAventura } from './NovaAventura.tsx';
import * as sistema from './sistema.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  escolherPasta: vi.fn(),
  rodarGit: vi.fn(),
  detectarMestre: vi.fn(),
  comandoDoMestre: vi.fn(),
  rodarMestre: vi.fn(),
  salvarAventura: vi.fn(),
}));

const COMANDO =
  'claude -p --output-format json --json-schema <schema> --tools Read,Grep,Glob --allowedTools Read,Grep,Glob --strict-mcp-config --no-session-persistence < <prompt>';

const envelope = (saida: unknown) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, structured_output: saida });

const CRIAR = {
  territorios: [{ nome: 'Servidor', resumo: 'A API.', raizes: ['.'] }],
  candidatas_entrada: [
    {
      nome: 'API de pedidos',
      resumo: 'Recebe pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'Servidor', raizes: ['.'] },
      arquivos_semente: ['src/pedidos.ts'],
      motivo: 'A rota principal.',
    },
    {
      nome: 'Banco',
      resumo: 'Guarda pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'Servidor', raizes: ['.'] },
      arquivos_semente: ['src/db.ts'],
      motivo: 'Onde os dados ficam.',
    },
  ],
  aviso_classe: 'O Projeto não tem front; sugerindo a entrada mais próxima.',
};
const DETALHAR = { resumo: 'Recebe e grava pedidos.', arquivos: ['src/pedidos.ts', 'src/db.ts'] };

const item = (nome: string | RegExp) => screen.getByRole('menuitem', { name: nome });

function preparar() {
  vi.mocked(sistema.escolherPasta).mockResolvedValue('/home/a/loja');
  vi.mocked(sistema.rodarGit).mockImplementation(async (_raiz, comando) =>
    comando.tipo === 'rev_parse_head' ? 'abc123\n' : 'src/pedidos.ts\0src/db.ts\0',
  );
  vi.mocked(sistema.detectarMestre).mockResolvedValue({ estado: 'pronta', versao: '2.1.310' });
  vi.mocked(sistema.comandoDoMestre).mockResolvedValue(COMANDO);
  vi.mocked(sistema.salvarAventura).mockResolvedValue(null);
  vi.mocked(sistema.rodarMestre).mockImplementation(async ({ prompt }) =>
    prompt.includes('Call: criar_aventura') ? envelope(CRIAR) : envelope(DETALHAR),
  );
}

describe('Nova Aventura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preparar();
  });

  it('percorre os 5 passos e guarda a Aventura com a entrada detalhada', async () => {
    const user = userEvent.setup();
    const onCriada = vi.fn();
    render(<NovaAventura onVoltar={() => {}} onCriada={onCriada} />);

    // 1. Projeto
    expect(screen.getByRole('list', { name: /Passo 1 de 5: Projeto/ })).toBeTruthy();
    expect((item('Próximo ▶') as HTMLButtonElement).disabled).toBe(true);
    await user.click(item('+ Adicionar pasta'));
    expect(await screen.findByText(/\/home\/a\/loja/)).toBeTruthy();
    expect(screen.getByText('· git ✔')).toBeTruthy();
    await user.click(item('Próximo ▶'));

    // 2. Mestre: aviso e comando exato
    expect(await screen.findByText(COMANDO)).toBeTruthy();
    expect(screen.getByText('🛡 O Mestre só pode LER.')).toBeTruthy();
    expect(screen.getByText(/Anthropic/)).toBeTruthy();
    expect(item(/Claude Code · encontrado 2.1.310/)).toBeTruthy();
    expect((item(/Codex CLI/) as HTMLButtonElement).disabled).toBe(true);
    expect(sistema.comandoDoMestre).toHaveBeenCalledWith('claude_code', '/home/a/loja', []);
    await user.click(item('Próximo ▶'));

    // 3. Classe → 4. Leitura → 5. Entrada
    await user.click(item(/Cavaleiro do Backend/));
    expect(await screen.findByText(/Por onde a sua Aventura começa/)).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('O Projeto não tem front');
    expect(item(/API de pedidos.*sugestão do Mestre/)).toBeTruthy();
    expect(item(/Banco/).textContent).not.toContain('sugestão');

    const criar = vi.mocked(sistema.rodarMestre).mock.calls[0]![0];
    expect(criar.ia).toBe('claude_code');
    expect(criar.raiz).toBe('/home/a/loja');
    expect(criar.prompt).toContain('"idioma": "pt"');
    expect(criar.prompt).toContain('"classe": "backend"');

    await user.click(item(/API de pedidos/));
    await waitFor(() => expect(onCriada).toHaveBeenCalledOnce());
    const aventura = onCriada.mock.calls[0]![0] as AventuraNoProjeto;
    expect(aventura.regioes).toHaveLength(1);
    expect(aventura.regioes[0]?.arquivos).toEqual(['src/pedidos.ts', 'src/db.ts']);
    expect(aventura.repositorios).toEqual([
      { nome: 'loja', caminho_local: '/home/a/loja', commit: 'abc123' },
    ]);
    expect(Object.values(aventura.mapa.estados)).toEqual(['desbloqueada']);
    expect(sistema.salvarAventura).toHaveBeenCalledWith(aventura.id, JSON.stringify(aventura));
  });

  it('recusa pasta que não é repositório git', async () => {
    vi.mocked(sistema.rodarGit).mockRejectedValue({
      codigo: 'falhou',
      detalhe: { codigo: 128, stderr: 'fatal: not a git repository' },
    });
    const user = userEvent.setup();
    render(<NovaAventura onVoltar={() => {}} onCriada={() => {}} />);
    await user.click(item('+ Adicionar pasta'));
    expect((await screen.findByRole('alert')).textContent).toContain('não é um repositório git');
    expect((item('Próximo ▶') as HTMLButtonElement).disabled).toBe(true);
  });

  it('CLI sem modo somente leitura é recusada', async () => {
    vi.mocked(sistema.detectarMestre).mockResolvedValue({
      estado: 'sem_modo_restrito',
      versao: '1.0.0',
      faltando: ['--json-schema'],
    });
    const user = userEvent.setup();
    render(<NovaAventura onVoltar={() => {}} onCriada={() => {}} />);
    await user.click(item('+ Adicionar pasta'));
    await user.click(await screen.findByRole('menuitem', { name: 'Próximo ▶' }));
    expect(await screen.findByText(/faltam --json-schema/)).toBeTruthy();
    expect((item(/Claude Code/) as HTMLButtonElement).disabled).toBe(true);
    expect((item('Próximo ▶') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Instale o Claude Code/)).toBeTruthy();
  });

  it('saída inválida 3 vezes vira erro claro, com Tentar de novo', async () => {
    vi.mocked(sistema.rodarMestre).mockResolvedValue(envelope({ territorios: [] }));
    const user = userEvent.setup();
    render(<NovaAventura onVoltar={() => {}} onCriada={() => {}} />);
    await user.click(item('+ Adicionar pasta'));
    await user.click(await screen.findByRole('menuitem', { name: 'Próximo ▶' }));
    await screen.findByText(COMANDO);
    await user.click(item('Próximo ▶'));
    await user.click(item(/Mago do Frontend/));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Depois de 3 tentativas');
    expect(sistema.rodarMestre).toHaveBeenCalledTimes(3);
    expect(screen.getAllByText(/Resposta recusada/)).toHaveLength(3);

    vi.mocked(sistema.rodarMestre).mockResolvedValue(envelope(CRIAR));
    await user.click(item('Tentar de novo'));
    expect(await screen.findByText(/Por onde a sua Aventura começa/)).toBeTruthy();
  });
});
