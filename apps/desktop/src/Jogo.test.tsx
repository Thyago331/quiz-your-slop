import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Jogo } from './Jogo.tsx';

const item = (nome: string) => screen.getByRole('menuitem', { name: nome });

describe('Jogo', () => {
  beforeEach(() => localStorage.setItem('quiz-your-slop:idioma', 'pt'));

  it('abre no hub com Continuar desabilitado sem Aventura', () => {
    render(<Jogo />);
    expect(screen.getByRole('menu', { name: 'Menu principal' })).toBeTruthy();
    const nomes = screen.getAllByRole('menuitem').map((el) => el.textContent);
    expect(nomes).toEqual([
      'Continuar',
      'Nova Aventura',
      'Tutorial',
      'Perfil',
      'O que é enviado',
      'Idioma: Português',
    ]);
    expect((item('Continuar') as HTMLButtonElement).disabled).toBe(true);
    expect(document.activeElement).toBe(item('Nova Aventura'));
  });

  it('com Aventura, Continuar fica disponível', () => {
    render(<Jogo haAventura />);
    expect((item('Continuar') as HTMLButtonElement).disabled).toBe(false);
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
