import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrdemDoFluxo, type PassoOrdenavel } from './OrdemDoFluxo.tsx';

const passos: PassoOrdenavel[] = [
  { id: 'cobra', rotulo: 'cobra' },
  { id: 'recebe', rotulo: 'recebe' },
  { id: 'grava', rotulo: '??? (Consulta → região desconhecida)', naNevoa: true },
];

function montar() {
  const onConfirmar = vi.fn();
  render(<OrdemDoFluxo passos={passos} onConfirmar={onConfirmar} />);
  return { onConfirmar };
}

const monte = () =>
  within(screen.getByRole('menu', { name: 'Passos que faltam' }))
    .getAllByRole('menuitem')
    .map((b) => b.textContent);
const ordem = () =>
  within(screen.getByRole('list', { name: 'Ordem escolhida' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);
const acao = (nome: RegExp) => screen.getByRole('menuitem', { name: nome }) as HTMLButtonElement;

describe('OrdemDoFluxo', () => {
  it('começa com a ordem vazia, todos os passos no monte e nada para confirmar', () => {
    montar();
    expect(screen.getByText('(vazia)')).toBeTruthy();
    expect(monte()).toEqual(['cobra', 'recebe', '??? (Consulta → região desconhecida)']);
    expect(acao(/ATACAR/).disabled).toBe(true);
    expect(acao(/Recomeçar/).disabled).toBe(true);
  });

  it('com o mouse: cada clique tira o passo do monte e o põe no fim da ordem', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = montar();
    await user.click(screen.getByRole('menuitem', { name: 'recebe' }));
    expect(ordem()).toEqual(['recebe']);
    expect(monte()).toEqual(['cobra', '??? (Consulta → região desconhecida)']);
    await user.click(screen.getByRole('menuitem', { name: 'cobra' }));
    await user.click(screen.getByRole('menuitem', { name: /região desconhecida/ }));
    expect(ordem()).toEqual(['recebe', 'cobra', '??? (Consulta → região desconhecida)']);
    expect(screen.queryByRole('menu', { name: 'Passos que faltam' })).toBeNull();
    await user.click(acao(/ATACAR/));
    expect(onConfirmar).toHaveBeenCalledWith(['recebe', 'cobra', 'grava']);
  });

  it('só pelo teclado: ↓ Enter escolhe, o foco volta ao monte e termina no ATACAR', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = montar();
    await user.keyboard('{ArrowDown}{Enter}'); // recebe
    await user.keyboard('{Enter}'); // cobra (o primeiro do que sobrou)
    expect(ordem()).toEqual(['recebe', 'cobra']);
    await user.keyboard('{Enter}'); // grava
    expect(document.activeElement).toBe(acao(/ATACAR/));
    await user.keyboard('{Enter}');
    expect(onConfirmar).toHaveBeenCalledWith(['recebe', 'cobra', 'grava']);
  });

  it('recomeçar devolve todos os passos ao monte, e dá para montar outra ordem', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = montar();
    await user.click(screen.getByRole('menuitem', { name: 'cobra' }));
    await user.click(screen.getByRole('menuitem', { name: 'recebe' }));
    await user.click(acao(/Recomeçar/));
    expect(screen.getByText('(vazia)')).toBeTruthy();
    expect(monte()).toHaveLength(3);
    expect(acao(/Recomeçar/).disabled).toBe(true);
    expect(document.activeElement?.textContent).toBe('cobra');

    await user.click(screen.getByRole('menuitem', { name: 'recebe' }));
    await user.click(screen.getByRole('menuitem', { name: 'cobra' }));
    await user.click(screen.getByRole('menuitem', { name: /região desconhecida/ }));
    await user.click(acao(/ATACAR/));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).toHaveBeenCalledWith(['recebe', 'cobra', 'grava']);
  });

  it('não confirma ordem incompleta', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = montar();
    await user.click(screen.getByRole('menuitem', { name: 'cobra' }));
    await user.click(acao(/ATACAR/));
    expect(onConfirmar).not.toHaveBeenCalled();
  });
});
