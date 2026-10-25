import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Jogo } from './Jogo.tsx';
import * as sistema from './sistema.ts';
import type { Sessao } from './sistema.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  entrar: vi.fn(),
  cancelarEntrada: vi.fn(),
  sessaoAtual: vi.fn(),
  sair: vi.fn(),
}));

const item = (nome: string) => screen.findByRole('menuitem', { name: nome });
const conectado: Sessao = {
  estado: 'conectado',
  perfil: { login: 'viajante', nome: 'Viajante', avatar_url: null },
};

/** A camada Rust de mentira: `entrar` fica pendurado até o teste resolver ou rejeitar. */
function camada(sessao: Sessao) {
  let resolver: (valor: Sessao) => void = () => {};
  let rejeitar: (erro: unknown) => void = () => {};
  vi.mocked(sistema.sessaoAtual).mockResolvedValue(sessao);
  vi.mocked(sistema.sair).mockResolvedValue({ estado: 'desconectado' });
  vi.mocked(sistema.cancelarEntrada).mockImplementation(async () => {
    rejeitar({ codigo: 'cancelado' });
    return null;
  });
  vi.mocked(sistema.entrar).mockImplementation(
    () =>
      new Promise((ok, falha) => {
        resolver = ok;
        rejeitar = falha;
      }),
  );
  return { resolver: (v: Sessao) => resolver(v), rejeitar: (e: unknown) => rejeitar(e) };
}

describe('Conta no Jogo desktop', () => {
  beforeEach(() => {
    localStorage.setItem('quiz-your-slop:idioma', 'pt');
    vi.clearAllMocks();
  });

  it('desconectado: Entrar abre a espera, no idioma do Jogo, e volta conectado', async () => {
    const user = userEvent.setup();
    const { resolver } = camada({ estado: 'desconectado' });
    render(<Jogo />);
    await user.click(await item('Entrar com GitHub'));
    expect(sistema.entrar).toHaveBeenCalledWith('pt');
    expect(screen.getByRole('heading', { name: 'Entrar com GitHub' })).toBeTruthy();
    expect(screen.getByText(/Abrimos o navegador/)).toBeTruthy();

    resolver(conectado);
    expect(await screen.findByText('Conectado como Viajante (@viajante)')).toBeTruthy();
    expect(document.activeElement).toBe(await item('Sair'));
  });

  it('Cancelar (ou Esc) na espera interrompe o login sem mostrar erro', async () => {
    const user = userEvent.setup();
    camada({ estado: 'desconectado' });
    render(<Jogo />);
    await user.click(await item('Entrar com GitHub'));
    await user.keyboard('{Escape}');
    expect(sistema.cancelarEntrada).toHaveBeenCalled();
    expect(await item('Entrar com GitHub')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('o erro do login aparece no hub', async () => {
    const user = userEvent.setup();
    const { rejeitar } = camada({ estado: 'desconectado' });
    render(<Jogo />);
    await user.click(await item('Entrar com GitHub'));
    rejeitar({ codigo: 'tempo_esgotado', detalhe: { segundos: 300 } });
    expect((await screen.findByRole('alert')).textContent).toBe(
      'O tempo de espera acabou. Tente de novo.',
    );
  });

  it('conectado: mostra quem é, e Sair desconecta', async () => {
    const user = userEvent.setup();
    camada(conectado);
    render(<Jogo />);
    expect(await screen.findByText('Conectado como Viajante (@viajante)')).toBeTruthy();
    await user.click(await item('Sair'));
    expect(sistema.sair).toHaveBeenCalled();
    expect(await item('Entrar com GitHub')).toBeTruthy();
  });

  it('sem rede, segue conectado e pode sair', async () => {
    camada({ estado: 'sem_rede' });
    render(<Jogo />);
    expect(await item('Sair')).toBeTruthy();
    expect(screen.getByText(/o site não respondeu agora/)).toBeTruthy();
  });

  it('sem a camada Rust, o hub segue desconectado', async () => {
    vi.mocked(sistema.sessaoAtual).mockRejectedValue(new Error('sem Tauri'));
    render(<Jogo />);
    expect(await item('Entrar com GitHub')).toBeTruthy();
  });

  it('em inglês', async () => {
    localStorage.setItem('quiz-your-slop:idioma', 'en');
    camada(conectado);
    render(<Jogo />);
    expect(await item('Sign out')).toBeTruthy();
    expect(screen.getByText('Signed in as Viajante (@viajante)')).toBeTruthy();
  });
});
