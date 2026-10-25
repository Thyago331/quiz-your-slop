import {
  avancar,
  iniciarExpedicao,
  responderDesafio,
  type Desafio,
  type ResultadoExpedicao,
} from '@quiz/jogo';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Batalha, ResumoExpedicao } from './Batalha.tsx';

const desafio = (id: string): Desafio => ({
  id,
  formato: 'multipla_escolha',
  enunciado: `Qual rota cria o pedido? (${id})`,
  dificuldade: 2,
  opcoes: [
    { id: 'a', texto: '`GET /items`' },
    { id: 'b', texto: '`POST /orders`' },
  ],
  gabarito: ['b'],
  explicacao: 'O `server.ts` registra a rota.',
  evidencias: [
    {
      caminho: 'api/src/server.ts',
      linha_inicio: 9,
      linha_fim: 10,
      trecho:
        "router.get('/items', listItemsHandler);\nrouter.post('/orders', createOrderHandler);",
    },
  ],
});
const inicio = iniciarExpedicao('api', ['d1', 'd2', 'd3', 'd4', 'd5'].map(desafio));

function montar(expedicao = inicio) {
  const onResponder = vi.fn();
  const onAvancar = vi.fn();
  render(
    <Batalha
      expedicao={expedicao}
      nomeRegiao="API de Pedidos"
      heroi="cavaleiro"
      onResponder={onResponder}
      onAvancar={onAvancar}
    />,
  );
  return { onResponder, onAvancar };
}

describe('Batalha', () => {
  it('mostra o Guardião com 4 vidas, o Desafio e as opções num menu', () => {
    montar();
    expect(screen.getByText(/GUARDIÃO · API DE PEDIDOS/)).toBeTruthy();
    expect(
      screen.getByRole('meter', { name: 'Vida do Guardião' }).getAttribute('aria-valuenow'),
    ).toBe('4');
    expect(screen.getByText(/DESAFIO 1\/5/)).toBeTruthy();
    expect(screen.getByText(/Qual rota cria o pedido\? \(d1\)/)).toBeTruthy();
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual([
      'GET /items',
      'POST /orders',
    ]);
  });

  it('escolher uma opção (teclado já focado, ou clique) é a resposta', async () => {
    const user = userEvent.setup();
    const { onResponder } = montar();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onResponder).toHaveBeenCalledWith(['b']);
  });

  it('depois do acerto: dano no Guardião, explicação, Evidência caminho:linha e o trecho', async () => {
    const user = userEvent.setup();
    const { onAvancar } = montar(responderDesafio(inicio, ['b']));
    expect(screen.getByRole('status').textContent).toMatch(/ACERTOU/);
    expect(
      screen.getByRole('meter', { name: 'Vida do Guardião' }).getAttribute('aria-valuenow'),
    ).toBe('3');
    expect(screen.getByText(/registra a rota/)).toBeTruthy();
    expect(screen.getByText('api/src/server.ts:9-10')).toBeTruthy();
    expect(screen.getByText(/router\.post\('\/orders', createOrderHandler\);/)).toBeTruthy();
    await user.click(screen.getByRole('menuitem', { name: 'Próximo Desafio' }));
    expect(onAvancar).toHaveBeenCalledTimes(1);
  });

  it('no erro o Guardião desvia, o Jogador não perde nada e a certa aparece marcada', () => {
    montar(responderDesafio(inicio, ['a']));
    expect(screen.getByRole('status').textContent).toMatch(/desviou.*não perde nada/);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '✘ GET /items',
      '✔ POST /orders',
    ]);
  });

  it('no último Desafio o botão encerra a batalha', () => {
    const ultimo = [0, 1, 2, 3].reduce((e) => avancar(responderDesafio(e, ['a'])), inicio);
    montar(responderDesafio(ultimo, ['a']));
    expect(screen.getByRole('menuitem', { name: 'Fim da batalha' })).toBeTruthy();
  });
});

describe('ResumoExpedicao', () => {
  const vitoria: ResultadoExpedicao = {
    regiaoId: 'api',
    venceu: true,
    acertos: 4,
    respondidos: 5,
    xp: 80,
    arquivosCitados: ['api/src/server.ts', 'api/src/orders/service.ts'],
  };

  it('na vitória: acertos, XP, região revelada, a Névoa recuando e os arquivos citados', async () => {
    const user = userEvent.setup();
    const onVoltar = vi.fn();
    render(
      <ResumoExpedicao
        resultado={vitoria}
        nomeRegiao="API de Pedidos"
        descobertas={['Cofre do Anão', 'Fogão']}
        novoTitulo="Leitor de Diff"
        onVoltar={onVoltar}
      />,
    );
    expect(screen.getByText('VITÓRIA!')).toBeTruthy();
    expect(screen.getByText(/Acertos: 4\/5/)).toBeTruthy();
    expect(screen.getByText(/\+80 XP/)).toBeTruthy();
    expect(screen.getByText(/API de Pedidos foi revelada/)).toBeTruthy();
    expect(screen.getByText(/Cofre do Anão, Fogão/)).toBeTruthy();
    expect(screen.getByText(/Novo Título: Leitor de Diff/)).toBeTruthy();
    expect(screen.getByText('api/src/orders/service.ts')).toBeTruthy();
    await user.keyboard('{Enter}');
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it('quando os Desafios acabam antes, o Guardião resiste e a região continua desbloqueada', () => {
    render(
      <ResumoExpedicao
        resultado={{ ...vitoria, venceu: false, acertos: 2, xp: 40 }}
        nomeRegiao="API de Pedidos"
        descobertas={[]}
        onVoltar={() => {}}
      />,
    );
    expect(screen.getByText('O GUARDIÃO RESISTIU')).toBeTruthy();
    expect(screen.getByText(/continua desbloqueada/)).toBeTruthy();
    expect(screen.queryByText(/revelada/)).toBeNull();
  });
});
