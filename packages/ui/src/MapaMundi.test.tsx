import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MapaMundi, type MapaMundiProps, type RegiaoNoMapa } from './MapaMundi.tsx';

const regioes: RegiaoNoMapa[] = [
  { id: 'a', nome: 'Alfa', estado: 'revelada', coluna: 2, linha: 2, sprite: 'quadro' },
  { id: 'b', nome: 'Beta', estado: 'desbloqueada', coluna: 8, linha: 2, sprite: 'castelo' },
  { id: 'c', nome: 'Gama', estado: 'desatualizada', coluna: 2, linha: 7, sprite: 'livro' },
  { id: 'd', nome: 'Delta', estado: 'nevoa', coluna: 8, linha: 7, sprite: 'fogao' },
];

function montar(props: Partial<MapaMundiProps> = {}) {
  const onSelecionar = vi.fn();
  render(
    <MapaMundi
      colunas={12}
      linhas={10}
      ilhas={[{ id: 't', nome: 'Ilha', coluna: 0, linha: 0, largura: 12, altura: 10 }]}
      regioes={regioes}
      ligacoes={[{ id: 'a-b', origem: 'a', destino: 'b', tipo: 'evento', descricao: 'order.paid' }]}
      selecionada="a"
      onSelecionar={onSelecionar}
      {...props}
    />,
  );
  return onSelecionar;
}

describe('MapaMundi', () => {
  it('cada região conhecida é um botão com nome e estado; a Névoa não tem nome nem botão', () => {
    montar();
    expect(screen.getByRole('button', { name: 'Alfa, revelada' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Beta, desbloqueada' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gama, desatualizada' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Delta/ })).toBeNull();
    expect(screen.queryByText(/Delta/)).toBeNull();
    expect(screen.getByText('???')).toBeTruthy();
  });

  it('a estrada de uma Ligação conhecida leva o tipo', () => {
    montar();
    expect(screen.getByText('Evento')).toBeTruthy();
  });

  it('clicar seleciona; as setas andam até a região mais próxima naquela direção', async () => {
    const user = userEvent.setup();
    const onSelecionar = montar();
    await user.click(screen.getByRole('button', { name: 'Beta, desbloqueada' }));
    expect(onSelecionar).toHaveBeenLastCalledWith('b');

    screen.getByRole('button', { name: 'Alfa, revelada' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onSelecionar).toHaveBeenLastCalledWith('c');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Gama, desatualizada' }),
    );
  });

  it('só a região selecionada entra na ordem do Tab', () => {
    montar({ selecionada: 'b' });
    expect(screen.getByRole('button', { name: 'Beta, desbloqueada' }).tabIndex).toBe(0);
    expect(screen.getByRole('button', { name: 'Alfa, revelada' }).tabIndex).toBe(-1);
  });

  it('clicar ou Enter ativa a região (para partir em Expedição); as setas só selecionam', async () => {
    const user = userEvent.setup();
    const onAtivar = vi.fn();
    montar({ onAtivar });
    await user.click(screen.getByRole('button', { name: 'Beta, desbloqueada' }));
    expect(onAtivar).toHaveBeenLastCalledWith('b');
    screen.getByRole('button', { name: 'Alfa, revelada' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onAtivar).toHaveBeenCalledTimes(1);
    await user.keyboard('{Enter}');
    expect(onAtivar).toHaveBeenLastCalledWith('c');
  });
});
