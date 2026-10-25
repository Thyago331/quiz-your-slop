import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IdiomaDaInterface } from './idioma.tsx';
import { TelaInicial } from './TelaInicial.tsx';

const itens = [
  { id: 'continuar', rotulo: 'Continuar', desabilitado: true },
  { id: 'nova', rotulo: 'Nova Aventura' },
  { id: 'tutorial', rotulo: 'Tutorial' },
];

describe('TelaInicial', () => {
  it('mostra o nome do Jogo e o hub, com o teclado já no primeiro item disponível', async () => {
    const user = userEvent.setup();
    const onEscolher = vi.fn();
    render(<TelaInicial itens={itens} onEscolher={onEscolher} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quiz your slop' })).toBeTruthy();
    expect(screen.getByRole('menu', { name: 'Menu principal' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Nova Aventura' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onEscolher).toHaveBeenCalledWith('tutorial');
  });

  it('fala o idioma da interface', () => {
    render(
      <IdiomaDaInterface idioma="es">
        <TelaInicial itens={itens} onEscolher={() => {}} />
      </IdiomaDaInterface>,
    );
    expect(screen.getByRole('menu', { name: 'Menú principal' })).toBeTruthy();
    expect(screen.getByText('Tu código nunca sale de tu máquina.')).toBeTruthy();
  });
});
