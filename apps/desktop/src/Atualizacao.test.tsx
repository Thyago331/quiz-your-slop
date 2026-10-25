import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Idioma } from '@quiz/i18n';
import { IdiomaDaInterface } from '@quiz/ui';
import { AvisoDeAtualizacao, useAtualizacao } from './Atualizacao.tsx';
import * as sistema from './sistema.ts';

vi.mock('./sistema.ts', () => ({
  verificarAtualizacao: vi.fn(),
  instalarAtualizacao: vi.fn(),
}));

const verificar = vi.mocked(sistema.verificarAtualizacao);
const instalar = vi.mocked(sistema.instalarAtualizacao);

function Hub() {
  return <AvisoDeAtualizacao {...useAtualizacao()} />;
}

const abrir = (idioma: Idioma = 'pt') =>
  render(
    <IdiomaDaInterface idioma={idioma}>
      <Hub />
    </IdiomaDaInterface>,
  );

const NOVA = { disponivel: true, versao: '0.2.0', notas: 'Correções.' } as const;

describe('AvisoDeAtualizacao', () => {
  beforeEach(() => {
    verificar.mockReset();
    instalar.mockReset();
  });

  it('em dia, não mostra nada', async () => {
    verificar.mockResolvedValue({ disponivel: false, versao: null, notas: null });
    const { container } = abrir();
    await act(async () => {});
    expect(verificar).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('');
  });

  it('sem conseguir verificar, só uma linha discreta', async () => {
    verificar.mockRejectedValue({ codigo: 'atualizacao', detalhe: 'rede' });
    abrir();
    expect(await screen.findByText('Não deu para verificar atualizações.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('com versão nova, atualiza com um clique e mostra o andamento', async () => {
    verificar.mockResolvedValue(NOVA);
    let progredir: Parameters<typeof sistema.instalarAtualizacao>[0] = () => {};
    instalar.mockImplementation((ao) => {
      progredir = ao;
      return new Promise(() => {});
    });
    abrir();
    expect(await screen.findByText('Nova versão 0.2.0')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(instalar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Baixando a versão 0.2.0…')).toBeTruthy();
    expect(screen.queryByRole('meter')).toBeNull();

    act(() => progredir({ etapa: 'baixando', porcentagem: 47 }));
    expect(screen.getByRole('meter', { name: 'Progresso do download' }).ariaValueNow).toBe('5');

    act(() => progredir({ etapa: 'instalando' }));
    expect(screen.getByText('Instalando a versão 0.2.0; o Jogo reinicia sozinho.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('se a instalação falha, avisa e oferece de novo', async () => {
    verificar.mockResolvedValue(NOVA);
    instalar.mockRejectedValue({ codigo: 'atualizacao', detalhe: 'assinatura' });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Atualizar' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Não deu para instalar a atualização. Tente de novo.',
    );
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeTruthy();
  });

  it('fala o idioma da interface', async () => {
    verificar.mockResolvedValue(NOVA);
    abrir('es');
    expect(await screen.findByText('Nueva versión 0.2.0')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeTruthy();
  });
});
