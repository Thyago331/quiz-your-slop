import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarAventura } from '@quiz/jogo';
import { Jogo } from './Jogo.tsx';
import * as sistema from './sistema.ts';

vi.mock('./sistema.ts', async (original) => ({
  ...(await original<typeof import('./sistema.ts')>()),
  carregarAventuras: vi.fn(async () => []),
}));

/** Uma Aventura guardada: um Território, a entrada desbloqueada e detalhada. */
function guardada() {
  let n = 0;
  const a = montarAventura({
    id: '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b',
    agora: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'fullstack',
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
  return { ...a, regioes: a.regioes.map((r) => ({ ...r, arquivos: ['src/pedidos.ts'] })) };
}

// Ninguém conectado; o login tem os testes dele em Conta.test.tsx.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => ({ estado: 'desconectado' })),
}));

const item = (nome: string) => screen.getByRole('menuitem', { name: nome });

describe('Jogo', () => {
  beforeEach(() => localStorage.setItem('quiz-your-slop:idioma', 'pt'));

  it('abre no hub com Continuar desabilitado sem Aventura', async () => {
    render(<Jogo />);
    await screen.findByRole('menuitem', { name: 'Entrar com GitHub' });
    expect(screen.getByRole('menu', { name: 'Menu principal' })).toBeTruthy();
    const nomes = screen.getAllByRole('menuitem').map((el) => el.textContent);
    expect(nomes).toEqual([
      'Continuar',
      'Nova Aventura',
      'Tutorial',
      'Perfil',
      'O que é enviado',
      'Idioma: Português',
      'Entrar com GitHub',
    ]);
    expect((item('Continuar') as HTMLButtonElement).disabled).toBe(true);
    expect(document.activeElement).toBe(item('Nova Aventura'));
  });

  it('com Aventura guardada, Continuar fica disponível e abre o mapa do Projeto', async () => {
    vi.mocked(sistema.carregarAventuras).mockResolvedValueOnce([
      'estragado',
      JSON.stringify(guardada()),
    ]);
    const user = userEvent.setup();
    render(<Jogo />);
    const continuar = await screen.findByRole('menuitem', { name: 'Continuar — loja (0%)' });
    expect((continuar as HTMLButtonElement).disabled).toBe(false);
    await user.click(continuar);
    expect(screen.getByRole('heading', { name: 'API DE PEDIDOS' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'API de pedidos, desbloqueada' })).toBeTruthy();
    expect(screen.getByText('src/pedidos.ts')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(item('Continuar — loja (0%)'));
  });

  it('Nova Aventura abre o passo 1', async () => {
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(item('Nova Aventura'));
    expect(screen.getByText('Quais repositórios formam o seu Projeto?')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(item('Nova Aventura'));
  });

  it('cada item leva à sua tela, e Esc ou Voltar trazem o cursor de volta a ele', async () => {
    const user = userEvent.setup();
    render(<Jogo />);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
    expect(screen.getByRole('heading', { name: 'O que é enviado' })).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(item('O que é enviado'));

    await user.click(item('Tutorial'));
    expect(screen.getByRole('heading', { name: 'Tutorial' })).toBeTruthy();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(item('Tutorial'));
  });

  it('Idioma troca a interface inteira e guarda a escolha', async () => {
    const user = userEvent.setup();
    render(<Jogo />);
    await user.click(item('Idioma: Português'));
    expect(document.activeElement).toBe(item('Português'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('menu', { name: 'Main menu' })).toBeTruthy();
    expect(item('New Adventure')).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('quiz-your-slop:idioma')).toBe('en');
  });
});
