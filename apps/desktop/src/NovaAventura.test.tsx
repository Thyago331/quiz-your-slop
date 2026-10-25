import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AventuraNoProjeto, IaDoMestre } from '@quiz/jogo';
import { NovaAventura, linhaDoErro } from './NovaAventura.tsx';
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
const COMANDO_CODEX =
  'codex exec --sandbox read-only -c approval_policy=never --ignore-rules --ephemeral --color never --cd /home/a/loja --output-schema <schema.json> --output-last-message <resposta.json> - < <prompt>';
const COMANDOS = { claude_code: COMANDO, codex: COMANDO_CODEX } as const;

const envelope = (saida: unknown) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, structured_output: saida });
/** O que cada CLI imprime: o envelope do Claude Code ou a última mensagem do Codex (estrita). */
const saidaDa = (ia: IaDoMestre, saida: object, nulos: object = {}) =>
  ia === 'claude_code' ? envelope(saida) : JSON.stringify({ ...nulos, ...saida });

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
  vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) => ({
    estado: 'pronta',
    versao: ia === 'codex' ? 'codex-cli 0.149.1' : '2.1.310',
  }));
  vi.mocked(sistema.comandoDoMestre).mockImplementation(async (ia) => COMANDOS[ia]);
  vi.mocked(sistema.salvarAventura).mockResolvedValue(null);
  vi.mocked(sistema.rodarMestre).mockImplementation(async ({ ia, prompt }) =>
    prompt.includes('Call: criar_aventura')
      ? saidaDa(ia, CRIAR)
      : saidaDa(ia, DETALHAR, { dividir: null }),
  );
}

describe('Nova Aventura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preparar();
  });

  it.each(['claude_code', 'codex'] as const)(
    'percorre os 5 passos com o Mestre %s e guarda a Aventura com a entrada detalhada',
    async (ia) => {
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

      // 2. Mestre: as duas CLIs, o aviso e o comando exato da escolhida
      expect(await screen.findByText(COMANDO)).toBeTruthy();
      expect(screen.getByText('🛡 O Mestre só pode LER.')).toBeTruthy();
      expect(screen.getByText(/Anthropic/)).toBeTruthy();
      expect(item(/◆ Claude Code · encontrado 2.1.310/)).toBeTruthy();
      expect(item(/◇ Codex CLI · encontrado codex-cli 0.149.1/)).toBeTruthy();
      expect(sistema.comandoDoMestre).toHaveBeenCalledWith('claude_code', '/home/a/loja', []);
      expect(sistema.comandoDoMestre).toHaveBeenCalledWith('codex', '/home/a/loja', []);
      if (ia === 'codex') {
        await user.click(item(/Codex CLI/));
        expect(await screen.findByText(COMANDO_CODEX)).toBeTruthy();
        expect(screen.queryByText(COMANDO)).toBeNull();
        expect(screen.getByText(/OpenAI/)).toBeTruthy();
        expect(item(/◆ Codex CLI/)).toBeTruthy();
      }
      await user.click(item('Próximo ▶'));

      // 3. Classe → 4. Leitura → 5. Entrada
      await user.click(item(/Cavaleiro do Backend/));
      expect(await screen.findByText(/Por onde a sua Aventura começa/)).toBeTruthy();
      expect(screen.getByRole('note').textContent).toContain('O Projeto não tem front');
      expect(item(/API de pedidos.*sugestão do Mestre/)).toBeTruthy();
      expect(item(/Banco/).textContent).not.toContain('sugestão');

      const criar = vi.mocked(sistema.rodarMestre).mock.calls[0]![0];
      expect(criar.ia).toBe(ia);
      // O Codex recebe o schema estrito: todo campo obrigatório.
      expect(criar.schema.required).toEqual(
        ia === 'codex'
          ? ['territorios', 'candidatas_entrada', 'aviso_classe']
          : ['territorios', 'candidatas_entrada'],
      );
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
      expect(aventura.mestre).toBe(ia);
      expect(vi.mocked(sistema.rodarMestre).mock.calls.every(([p]) => p.ia === ia)).toBe(true);
      expect(sistema.salvarAventura).toHaveBeenCalledWith(aventura.id, JSON.stringify(aventura));
    },
  );

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

  it('Codex sem --output-schema é recusado, com o comando à vista; o Claude Code segue', async () => {
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) =>
      ia === 'codex'
        ? { estado: 'sem_modo_restrito', versao: 'codex-cli 0.1.0', faltando: ['--output-schema'] }
        : { estado: 'pronta', versao: '2.1.310' },
    );
    const user = userEvent.setup();
    render(<NovaAventura onVoltar={() => {}} onCriada={() => {}} />);
    await user.click(item('+ Adicionar pasta'));
    await user.click(await screen.findByRole('menuitem', { name: 'Próximo ▶' }));
    expect(await screen.findByText(/faltam --output-schema\): recusado/)).toBeTruthy();
    expect((item(/Codex CLI/) as HTMLButtonElement).disabled).toBe(true);
    expect((item(/Claude Code/) as HTMLButtonElement).disabled).toBe(false);
    expect((item('Próximo ▶') as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/Instale o Claude Code/)).toBeNull();
  });

  it('só o Codex instalado: ele já vem escolhido, com o comando dele', async () => {
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) =>
      ia === 'codex' ? { estado: 'pronta', versao: 'codex-cli 0.149.1' } : { estado: 'ausente' },
    );
    const user = userEvent.setup();
    render(<NovaAventura onVoltar={() => {}} onCriada={() => {}} />);
    await user.click(item('+ Adicionar pasta'));
    await user.click(await screen.findByRole('menuitem', { name: 'Próximo ▶' }));
    expect(await screen.findByText(COMANDO_CODEX)).toBeTruthy();
    expect(item(/Claude Code · não encontrado/)).toBeTruthy();
    expect((item(/Claude Code/) as HTMLButtonElement).disabled).toBe(true);
    expect(item(/◆ Codex CLI/)).toBeTruthy();
    await user.click(item('Próximo ▶'));
    await user.click(item(/Cavaleiro do Backend/));
    await screen.findByText(/Por onde a sua Aventura começa/);
    expect(vi.mocked(sistema.rodarMestre).mock.calls[0]![0].ia).toBe('codex');
  });

  it('CLI sem modo somente leitura é recusada', async () => {
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) =>
      ia === 'codex'
        ? { estado: 'ausente' }
        : { estado: 'sem_modo_restrito', versao: '1.0.0', faltando: ['--json-schema'] },
    );
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

describe('linhaDoErro', () => {
  it('do stderr do Codex, a última linha ERROR (o cabeçalho fica de fora)', () => {
    const stderr = [
      'OpenAI Codex v0.149.1',
      '--------',
      'workdir: /home/a/loja',
      'model: gpt-x',
      'ERROR: {"type":"error","status":400,"error":{"message":"model not supported"}}',
      '',
    ].join('\n');
    expect(linhaDoErro(stderr)).toBe(
      'ERROR: {"type":"error","status":400,"error":{"message":"model not supported"}}',
    );
    expect(linhaDoErro('  algo deu errado\n')).toBe('algo deu errado');
  });
});
