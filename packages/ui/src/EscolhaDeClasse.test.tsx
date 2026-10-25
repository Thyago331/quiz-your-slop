import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CLASSES } from './classes.ts';
import { EscolhaDeClasse } from './EscolhaDeClasse.tsx';

function montar() {
  const onEscolher = vi.fn();
  render(<EscolhaDeClasse classes={CLASSES} onEscolher={onEscolher} />);
  return onEscolher;
}

describe('EscolhaDeClasse', () => {
  it('mostra as três Classes, cada uma com sprite, nome e descrição', () => {
    montar();
    const itens = screen.getAllByRole('menuitem');
    expect(itens).toHaveLength(3);
    expect(
      itens.map((i) => i.querySelector('svg[role="img"]')?.getAttribute('aria-label')),
    ).toEqual(['Cavaleiro do Backend', 'Mago do Frontend', 'Bardo Fullstack']);
    for (const classe of CLASSES) expect(screen.getByText(classe.descricao)).toBeTruthy();
  });

  it('o teclado já funciona ao abrir: → move e Enter escolhe', async () => {
    const user = userEvent.setup();
    const onEscolher = montar();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onEscolher).toHaveBeenCalledWith('frontend');
  });

  it('clicar escolhe a Classe', async () => {
    const user = userEvent.setup();
    const onEscolher = montar();
    await user.click(screen.getByRole('menuitem', { name: /Bardo Fullstack/ }));
    expect(onEscolher).toHaveBeenCalledWith('fullstack');
  });
});
