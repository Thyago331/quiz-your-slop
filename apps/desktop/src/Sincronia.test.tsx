import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ESTATISTICAS_ZERADAS,
  lerEnvio,
  mesclarProgresso,
  montarAventura,
  tituloDoXp,
  type AventuraNoProjeto,
  type EnvioDeProgresso,
} from '@quiz/jogo';
import { Jogo } from './Jogo.tsx';
import * as sistema from './sistema.ts';
import type { EstadoDoEnvio, Sincronia } from './sistema.ts';
import { INTERVALO_DA_SINCRONIA, envioDoDesktop, useSincronia } from './sincronia.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  carregarAventuras: vi.fn(),
  salvarAventura: vi.fn(async () => null),
  sessaoAtual: vi.fn(),
  sincronizarProgresso: vi.fn(),
  estadoDoEnvio: vi.fn(),
}));

const ID = '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b';

function aventura(xp = 0, expedicoes = 0): AventuraNoProjeto {
  let n = 0;
  const a = montarAventura({
    id: ID,
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
  return {
    ...a,
    xp,
    estatisticas: { ...ESTATISTICAS_ZERADAS, expedicoes, acertos: expedicoes * 4 },
  };
}

/**
 * A camada Rust de mentira, com a mesma regra de src-tauri/src/envio.rs: grava o pendente, lê o
 * site, envia só se há algo novo e guarda o último envio; sem rede, o pendente fica.
 */
function ponteFalsa(inicio: { online?: boolean; conta?: boolean; site?: EnvioDeProgresso } = {}) {
  const p = {
    online: inicio.online ?? true,
    conta: inicio.conta ?? true,
    site: inicio.site ?? null,
    pendente: null as string | null,
    ultimo: null as { json: string; em: number } | null,
    servidor: null as EnvioDeProgresso | null,
    puts: [] as string[],
  };
  vi.mocked(sistema.estadoDoEnvio).mockImplementation(async (): Promise<EstadoDoEnvio> => ({
    ultimo: p.ultimo,
    pendente: p.pendente,
    servidor: p.servidor,
  }));
  vi.mocked(sistema.sincronizarProgresso).mockImplementation(async (json): Promise<Sincronia> => {
    const lido = lerEnvio(JSON.parse(json));
    if (!lido.ok) throw { codigo: 'argumento_recusado', detalhe: lido.erro };
    p.pendente = JSON.stringify(lido.envio);
    if (!p.conta) return { estado: 'desconectado' };
    if (!p.online) return { estado: 'sem_rede' };
    const mesclado = mesclarProgresso(p.site, lido.envio);
    const enviado = JSON.stringify(mesclado) !== JSON.stringify(p.site);
    if (enviado) {
      p.puts.push(p.pendente);
      p.ultimo = { json: p.pendente, em: Date.UTC(2026, 9, 25, 15, 0) };
      p.site = mesclado;
    }
    p.servidor = mesclado;
    p.pendente = null;
    return { estado: 'sincronizado', progresso: mesclado, enviado };
  });
  return p;
}

const conectado = {
  estado: 'conectado' as const,
  perfil: { login: 'viajante', nome: null, avatar_url: null },
};

beforeEach(() => {
  localStorage.setItem('quiz-your-slop:idioma', 'pt');
  vi.clearAllMocks();
  vi.mocked(sistema.carregarAventuras).mockResolvedValue([]);
  vi.mocked(sistema.sessaoAtual).mockResolvedValue({ estado: 'desconectado' });
});
afterEach(() => vi.useRealTimers());

describe('envioDoDesktop', () => {
  it('só números e ids: nada do Projeto (nomes, pastas, Regiões) vai no resumo', () => {
    const envio = envioDoDesktop(
      { xp: 80, estatisticas: { expedicoes: 1, acertos: 4, contestacoes_vencidas: 0 } },
      [aventura(80, 1)],
    );
    expect(envio).toEqual({
      xp: 80,
      titulo: 'Comitador Cego',
      estatisticas: { expedicoes: 1, acertos: 4, contestacoes_vencidas: 0 },
      aventuras: [{ id: ID, progresso: 0, classe: 'backend' }],
    });
    expect(JSON.stringify(envio)).not.toMatch(/loja|Rotas|Servidor|home|src/);
  });
});

describe('useSincronia', () => {
  it('o XP do Jogador parte do maior entre as Aventuras, o pendente e o site', async () => {
    const p = ponteFalsa({ online: false });
    p.servidor = {
      xp: 250,
      titulo: 'Leitor de Diff',
      estatisticas: { expedicoes: 5, acertos: 20, contestacoes_vencidas: 1 },
      aventuras: [{ id: 'tutorial', progresso: 25, classe: 'fullstack' }],
    };
    const { result } = renderHook(() => useSincronia(false));
    act(() => result.current.carregadas([aventura(80, 1)]));
    await waitFor(() => expect(result.current.jogador.xp).toBe(250));
    // Uma Expedição soma ao contador (o Tutorial que estava no site continua contando).
    act(() => result.current.registrar(aventura(160, 2)));
    expect(result.current.jogador).toEqual({
      xp: 330,
      estatisticas: { expedicoes: 6, acertos: 24, contestacoes_vencidas: 1 },
    });
  });

  it('sem rede: o envio fica na fila e sai na tentativa periódica, quando o site volta', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const p = ponteFalsa({ online: false });
    const { result } = renderHook(() => useSincronia(true));
    act(() => result.current.carregadas([aventura()]));
    await waitFor(() => expect(result.current.ultima).toBe('sem_rede'));

    act(() => result.current.registrar(aventura(80, 1)));
    await waitFor(() => expect(result.current.envio?.pendente).toContain('"xp":80'));
    expect(p.puts).toEqual([]);

    // O site volta; nada acontece até a próxima tentativa (o jogo não espera por ela).
    p.online = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALO_DA_SINCRONIA);
    });
    await waitFor(() => expect(result.current.ultima).toBe('sincronizado'));
    expect(p.puts).toHaveLength(1);
    expect(JSON.parse(p.puts[0]!)).toMatchObject({ xp: 80, estatisticas: { expedicoes: 1 } });
    expect(result.current.envio?.pendente).toBeNull();
    expect(result.current.envio?.ultimo?.json).toBe(p.puts[0]);

    // Sem pendente, a periódica não chama o site à toa.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALO_DA_SINCRONIA);
    });
    expect(vi.mocked(sistema.sincronizarProgresso)).toHaveBeenCalledTimes(3);
  });

  it('sem conta, fica pendente; entrar com o GitHub envia', async () => {
    const p = ponteFalsa({ conta: false });
    const { result, rerender } = renderHook(({ c }) => useSincronia(c), {
      initialProps: { c: false },
    });
    act(() => result.current.carregadas([aventura(80, 1)]));
    await waitFor(() => expect(result.current.ultima).toBe('desconectado'));
    p.conta = true;
    rerender({ c: true });
    await waitFor(() => expect(result.current.ultima).toBe('sincronizado'));
    expect(p.puts).toHaveLength(1);
  });

  it('uma falha da ponte não derruba nada: o jogo segue com o XP local', async () => {
    vi.mocked(sistema.estadoDoEnvio).mockRejectedValue(new Error('sem Tauri'));
    vi.mocked(sistema.sincronizarProgresso).mockRejectedValue({ codigo: 'io', detalhe: 'x' });
    const { result } = renderHook(() => useSincronia(true));
    act(() => result.current.carregadas([aventura(80, 1)]));
    await waitFor(() => expect(result.current.ultima).toBe('erro'));
    expect(result.current.jogador.xp).toBe(80);
  });
});

describe('O que é enviado (desktop)', () => {
  const item = (nome: string) => screen.findByRole('menuitem', { name: nome });

  it('sem envio ainda: a lista clara e "nada enviado"', async () => {
    const p = ponteFalsa({ conta: false });
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(await item('O que é enviado'));
    expect(screen.getByRole('heading', { name: 'O que é enviado' })).toBeTruthy();
    expect(screen.getByText(/Nada enviado ainda/)).toBeTruthy();
    expect(screen.getByText(/✔ Seu XP, seu Título/)).toBeTruthy();
    expect(screen.getByText(/✘ Nunca: o seu código/)).toBeTruthy();
    expect(screen.getByText(/Nenhuma telemetria/)).toBeTruthy();
    expect(screen.queryByTestId('ultimo-envio')).toBeNull();
    // Sem conta, o resumo espera o login.
    expect(screen.getByRole('status').textContent).toMatch(/entre com o GitHub/);
    // Os bytes guardados, como estão: nada de recuo novo.
    expect(screen.getByTestId('envio-pendente').textContent).toBe(p.pendente);
    expect(p.pendente).toContain('"xp":0');
  });

  it('mostra o JSON exato do último envio, e o XP do site chega ao hub', async () => {
    const site: EnvioDeProgresso = {
      xp: 320,
      titulo: 'Arqueólogo de Código',
      estatisticas: { expedicoes: 7, acertos: 30, contestacoes_vencidas: 2 },
      aventuras: [
        { id: 'tutorial', progresso: 100, classe: 'fullstack' },
        { id: ID, progresso: 0, classe: 'backend' },
      ],
    };
    const p = ponteFalsa({ site });
    vi.mocked(sistema.sessaoAtual).mockResolvedValue(conectado);
    vi.mocked(sistema.carregarAventuras).mockResolvedValue([JSON.stringify(aventura(80, 1))]);
    const user = userEvent.setup();
    render(<Jogo />);
    // O site tinha mais XP (o Tutorial): o hub mostra o do Jogador, não só o desta máquina.
    expect(await screen.findByText('XP 320 · Arqueólogo de Código')).toBeTruthy();
    expect(tituloDoXp(320).atual.nome).toBe('Arqueólogo de Código');
    // Nada de novo para o site: só leu, não enviou.
    await waitFor(() => expect(sistema.sincronizarProgresso).toHaveBeenCalled());
    expect(p.puts).toEqual([]);

    p.ultimo = {
      json: '{"xp":80,"titulo":"Comitador Cego","estatisticas":{"expedicoes":1,"acertos":4,"contestacoes_vencidas":0},"aventuras":[]}',
      em: Date.UTC(2026, 9, 25, 15, 0),
    };
    await user.click(await item('O que é enviado'));
    expect(await screen.findByText('Último envio ao servidor · 25/10/2026, 12:00')).toBeTruthy();
    expect(screen.getByTestId('ultimo-envio').textContent).toBe(p.ultimo.json);
    expect(screen.queryByTestId('envio-pendente')).toBeNull();
  });

  it('em espanhol e inglês', async () => {
    ponteFalsa({ online: false });
    localStorage.setItem('quiz-your-slop:idioma', 'en');
    const user = userEvent.setup();
    const { unmount } = render(<Jogo />);
    await user.click(await item('What is sent'));
    expect(screen.getByText(/Nothing sent yet/)).toBeTruthy();
    unmount();
    localStorage.setItem('quiz-your-slop:idioma', 'es');
    render(<Jogo />);
    await user.click(await item('Lo que se envía'));
    expect(screen.getByText(/Nada enviado todavía/)).toBeTruthy();
  });
});
