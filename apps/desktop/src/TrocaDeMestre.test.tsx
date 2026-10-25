import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lerAventuraSalva, montarAventura, type AventuraNoProjeto } from '@quiz/jogo';
import { Jogo } from './Jogo.tsx';
import * as sistema from './sistema.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  carregarAventuras: vi.fn(),
  detectarMestre: vi.fn(),
  comandoDoMestre: vi.fn(),
  salvarAventura: vi.fn(),
  rodarMestre: vi.fn(),
  rodarGit: vi.fn(),
}));

// Ninguém conectado; o login tem os testes dele em Conta.test.tsx.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => ({ estado: 'desconectado' })),
}));

const COMANDO_CODEX =
  'codex exec --sandbox read-only -c approval_policy=never --ignore-rules --ephemeral --color never --cd /home/a/loja --output-schema <schema.json> --output-last-message <resposta.json> - < <prompt>';

/** Uma Aventura guardada com o Claude Code; a entrada ainda sem detalhe (o mapa oferece pedir). */
function guardada(): AventuraNoProjeto {
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
          nome: 'API de pedidos',
          resumo: 'Recebe pedidos.',
          territorio_id: null,
          territorio_novo: { nome: 'Servidor', raizes: ['.'] },
          arquivos_semente: ['src/pedidos.ts'],
          motivo: 'x',
        },
      ],
    },
    escolhida: 0,
    gerarId: () => `id-${++n}`,
  });
  return { ...a, xp: 120 };
}

const item = (nome: string | RegExp) => screen.getByRole('menuitem', { name: nome });

async function abrirATroca(aventura: AventuraNoProjeto) {
  vi.mocked(sistema.carregarAventuras).mockResolvedValue([JSON.stringify(aventura)]);
  const user = userEvent.setup();
  render(<Jogo />);
  await user.click(await screen.findByRole('menuitem', { name: /Continuar — loja/ }));
  await user.click(item('⇄ Trocar Mestre (Claude Code)'));
  return user;
}

describe('Trocar Mestre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('quiz-your-slop:idioma', 'pt');
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) => ({
      estado: 'pronta',
      versao: ia === 'codex' ? 'codex-cli 0.149.1' : '2.1.310',
    }));
    vi.mocked(sistema.comandoDoMestre).mockImplementation(async (ia) =>
      ia === 'codex' ? COMANDO_CODEX : 'claude -p …',
    );
    vi.mocked(sistema.salvarAventura).mockResolvedValue(null);
    vi.mocked(sistema.rodarGit).mockResolvedValue('src/pedidos.ts\0');
    vi.mocked(sistema.rodarMestre).mockResolvedValue(
      JSON.stringify({ resumo: 'Recebe e grava.', arquivos: ['src/pedidos.ts'], dividir: null }),
    );
  });

  it('troca para o Codex: só o campo mestre muda no arquivo, e o detalhe seguinte vai ao Codex', async () => {
    const antes = guardada();
    const user = await abrirATroca(antes);

    // O aviso e o comando exato do Codex, já escolhido (a outra IA pronta).
    expect(screen.getByText('O Mestre desta Aventura: Claude Code.')).toBeTruthy();
    expect(screen.getByText(/A memória da Aventura fica no Jogo/)).toBeTruthy();
    expect(await screen.findByText(COMANDO_CODEX)).toBeTruthy();
    expect(screen.getByText('🛡 O Mestre só pode LER.')).toBeTruthy();
    expect(screen.getByText(/OpenAI/)).toBeTruthy();
    expect(item(/Claude Code · encontrado 2.1.310 · atual/)).toBeTruthy();
    expect(sistema.comandoDoMestre).toHaveBeenCalledWith('codex', '/home/a/loja', []);
    await user.click(item('Trocar para Codex CLI ▶'));

    await waitFor(() => expect(sistema.salvarAventura).toHaveBeenCalledOnce());
    const [id, json] = vi.mocked(sistema.salvarAventura).mock.calls[0]!;
    const depois = lerAventuraSalva(json)!;
    expect(id).toBe(antes.id);
    expect(depois.mestre).toBe('codex');
    expect(depois.atualizada_em > antes.atualizada_em).toBe(true);
    const sem = ({ mestre, atualizada_em, ...resto }: AventuraNoProjeto) => {
      void [mestre, atualizada_em];
      return resto;
    };
    expect(sem(depois)).toEqual(sem(antes));

    // De volta ao mapa, com o novo Mestre no menu.
    expect(await screen.findByText('✔ Agora o Mestre é Codex CLI.')).toBeTruthy();
    expect(item('⇄ Trocar Mestre (Codex CLI)')).toBeTruthy();
    await user.click(item('Pedir o detalhe de novo'));
    await waitFor(() => expect(sistema.rodarMestre).toHaveBeenCalled());
    expect(vi.mocked(sistema.rodarMestre).mock.calls[0]![0].ia).toBe('codex');
  });

  it('só as IAs detectadas: sem o Codex, não há o que trocar; Voltar não grava nada', async () => {
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) =>
      ia === 'codex' ? { estado: 'ausente' } : { estado: 'pronta', versao: '2.1.310' },
    );
    const user = await abrirATroca(guardada());
    const codex = await screen.findByRole('menuitem', { name: /Codex CLI · não encontrado/ });
    expect((codex as HTMLButtonElement).disabled).toBe(true);
    expect((item(/Trocar para/) as HTMLButtonElement).disabled).toBe(true);
    await user.click(item('◀ Voltar ao mapa'));
    expect(item('⇄ Trocar Mestre (Claude Code)')).toBeTruthy();
    expect(sistema.salvarAventura).not.toHaveBeenCalled();
  });

  it('Codex sem modo restrito é recusado; Esc volta ao mapa', async () => {
    vi.mocked(sistema.detectarMestre).mockImplementation(async (ia) =>
      ia === 'codex'
        ? { estado: 'sem_modo_restrito', versao: 'codex-cli 0.1.0', faltando: ['read-only'] }
        : { estado: 'pronta', versao: '2.1.310' },
    );
    const user = await abrirATroca(guardada());
    expect(await screen.findByText(/faltam read-only\): recusado/)).toBeTruthy();
    expect((item(/Codex CLI/) as HTMLButtonElement).disabled).toBe(true);
    await user.keyboard('{Escape}');
    expect(item('⇄ Trocar Mestre (Claude Code)')).toBeTruthy();
    expect(sistema.salvarAventura).not.toHaveBeenCalled();
  });
});
