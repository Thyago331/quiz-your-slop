import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu, type ItemMenu } from './Menu.tsx';

const itens: ItemMenu[] = [
  { id: 'continuar', rotulo: 'Continuar' },
  { id: 'nova', rotulo: 'Nova Aventura' },
  { id: 'tutorial', rotulo: 'Tutorial' },
];

const cursor = () => screen.getAllByRole('menuitem').find((el) => el.dataset.cursor === 'true');

describe('Menu', () => {
  it('começa com o cursor ▶ no primeiro item', () => {
    render(<Menu rotulo="Menu" itens={itens} onEscolher={() => {}} />);
    expect(screen.getByRole('menu', { name: 'Menu' })).toBeTruthy();
    expect(cursor()?.textContent).toBe('Continuar');
  });

  it('↓ e ↑ movem o cursor e o foco, dando a volta nas pontas', async () => {
    const user = userEvent.setup();
    render(<Menu rotulo="Menu" itens={itens} onEscolher={() => {}} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(cursor()?.textContent).toBe('Nova Aventura');
    expect(document.activeElement).toBe(cursor());
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(cursor()?.textContent).toBe('Continuar');
    await user.keyboard('{ArrowUp}');
    expect(cursor()?.textContent).toBe('Tutorial');
  });

  it('Enter escolhe o item sob o cursor, uma vez só', async () => {
    const user = userEvent.setup();
    const onEscolher = vi.fn();
    render(<Menu rotulo="Menu" itens={itens} onEscolher={onEscolher} />);
    await user.tab();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onEscolher).toHaveBeenCalledTimes(1);
    expect(onEscolher).toHaveBeenCalledWith('nova');
  });

  it('o mouse leva o cursor ao passar e escolhe ao clicar', async () => {
    const user = userEvent.setup();
    const onEscolher = vi.fn();
    render(<Menu rotulo="Menu" itens={itens} onEscolher={onEscolher} />);
    await user.hover(screen.getByRole('menuitem', { name: 'Tutorial' }));
    expect(cursor()?.textContent).toBe('Tutorial');
    await user.click(screen.getByRole('menuitem', { name: 'Tutorial' }));
    expect(onEscolher).toHaveBeenCalledWith('tutorial');
  });

  it('pula itens desabilitados e não os escolhe', async () => {
    const user = userEvent.setup();
    const onEscolher = vi.fn();
    const comDesabilitado: ItemMenu[] = [
      itens[0]!,
      { ...itens[1]!, desabilitado: true },
      itens[2]!,
    ];
    render(<Menu rotulo="Menu" itens={comDesabilitado} onEscolher={onEscolher} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(cursor()?.textContent).toBe('Tutorial');
    await user.click(screen.getByRole('menuitem', { name: 'Nova Aventura' }));
    expect(onEscolher).not.toHaveBeenCalled();
  });

  it('se o item sob o cursor é desabilitado, o cursor vai para o primeiro disponível', () => {
    const { rerender } = render(<Menu rotulo="Menu" itens={itens} onEscolher={() => {}} />);
    rerender(
      <Menu
        rotulo="Menu"
        itens={[{ ...itens[0]!, desabilitado: true }, itens[1]!, itens[2]!]}
        onEscolher={() => {}}
      />,
    );
    expect(cursor()?.textContent).toBe('Nova Aventura');
  });

  it('na horizontal, ← e → movem o cursor', async () => {
    const user = userEvent.setup();
    render(<Menu rotulo="Menu" itens={itens} horizontal onEscolher={() => {}} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(cursor()?.textContent).toBe('Nova Aventura');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(cursor()?.textContent).toBe('Tutorial');
  });

  it('com autoFoco, o item sob o cursor recebe o foco ao aparecer', () => {
    render(<Menu rotulo="Menu" itens={itens} autoFoco onEscolher={() => {}} />);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Continuar' }));
  });
});
