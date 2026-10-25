import {
  avancar,
  contestarDesafio,
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

const estados = { api: 'desbloqueada', livro: 'nevoa', cofre: 'revelada' } as const;

function montar(expedicao = inicio, comContestacao = false) {
  const onResponder = vi.fn();
  const onAvancar = vi.fn();
  const onContestar = vi.fn();
  render(
    <Batalha
      expedicao={expedicao}
      estados={estados}
      nomeRegiao="API de Pedidos"
      heroi="cavaleiro"
      onResponder={onResponder}
      onAvancar={onAvancar}
      onContestar={comContestacao ? onContestar : undefined}
    />,
  );
  return { onResponder, onAvancar, onContestar };
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

describe('Batalha — Apontar no código', () => {
  const apontar: Desafio = {
    ...desafio('a1'),
    formato: 'apontar',
    enunciado: 'Onde o imposto do rei é aplicado?',
    opcoes: [
      { id: 'a', caminho: 'api/src/routes/orders.ts', simbolo: 'createOrderHandler' },
      { id: 'b', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
      { id: 'c', caminho: 'shared/money.ts' },
    ],
    gabarito: ['b'],
  };
  const expedicao = iniciarExpedicao('api', [apontar]);

  it('as opções são arquivo → função, como código', () => {
    montar(expedicao);
    const opcoes = screen.getAllByRole('menuitem');
    expect(opcoes.map((b) => b.textContent)).toEqual([
      'api/src/routes/orders.ts → createOrderHandler',
      'api/src/orders/service.ts → validateOrder',
      'shared/money.ts',
    ]);
    expect(opcoes[1]?.querySelectorAll('code')).toHaveLength(2);
  });

  it('apontar um lugar é a resposta', async () => {
    const user = userEvent.setup();
    const { onResponder } = montar(expedicao);
    await user.click(screen.getByRole('menuitem', { name: /validateOrder/ }));
    expect(onResponder).toHaveBeenCalledWith(['b']);
  });

  it('na correção o lugar certo fica marcado', () => {
    montar(responderDesafio(expedicao, ['c']));
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '· api/src/routes/orders.ts → createOrderHandler',
      '✔ api/src/orders/service.ts → validateOrder',
      '✘ shared/money.ts',
    ]);
  });
});

describe('Batalha — Traçar o fluxo', () => {
  const fluxo: Desafio = {
    ...desafio('t1'),
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que acontece depois que `POST /orders` chega:',
    opcoes: [
      { id: 'cobra', texto: '`charge()` cobra', regiao_id: 'cofre', ligacao: 'dependencia' },
      { id: 'recebe', texto: 'o handler recebe', regiao_id: 'api' },
      { id: 'grava', texto: 'INSERT grava', regiao_id: 'livro', ligacao: 'consulta' },
    ],
    gabarito: ['recebe', 'cobra', 'grava'],
  };
  const expedicao = iniciarExpedicao('api', [fluxo]);

  it('passo em região na Névoa mostra só o tipo da Ligação; os outros, o nome', () => {
    montar(expedicao);
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual([
      'charge() cobra',
      'o handler recebe',
      '??? (Consulta → região desconhecida)',
      '⚔ ATACAR (confirmar a ordem)',
      '↺ Recomeçar a ordem',
    ]);
    expect(screen.queryByText(/INSERT grava/)).toBeNull();
  });

  it('montar a ordem e atacar responde com a ordem', async () => {
    const user = userEvent.setup();
    const { onResponder } = montar(expedicao);
    await user.click(screen.getByRole('menuitem', { name: 'o handler recebe' }));
    await user.click(screen.getByRole('menuitem', { name: 'charge() cobra' }));
    await user.click(screen.getByRole('menuitem', { name: /região desconhecida/ }));
    await user.click(screen.getByRole('menuitem', { name: /ATACAR/ }));
    expect(onResponder).toHaveBeenCalledWith(['recebe', 'cobra', 'grava']);
  });

  it('na correção mostra a ordem certa, marcando o que ficou fora do lugar, sem tirar a Névoa', () => {
    montar(responderDesafio(expedicao, ['cobra', 'recebe', 'grava']));
    const certa = screen.getByRole('list', { name: 'Ordem certa' });
    expect([...certa.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      '✘ o handler recebe',
      '✘ charge() cobra',
      '✔ ??? (Consulta → região desconhecida)',
    ]);
    expect(screen.getByRole('status').textContent).toMatch(/desviou/);
  });
});

describe('Batalha — Contestação', () => {
  const errou = responderDesafio(inicio, ['a']);
  const codigoReal = {
    caminho: 'api/src/payments/dwarfVault.ts',
    linha_inicio: 24,
    linha_fim: 24,
    trecho: '  ledger.push(receipt);',
  };

  it('depois da correção, contestar abre o argumento; enviar só com texto', async () => {
    const user = userEvent.setup();
    const { onContestar, onAvancar } = montar(errou, true);
    await user.click(screen.getByRole('menuitem', { name: '⚑ Contestar o gabarito' }));
    const campo = screen.getByRole('textbox', { name: 'Por que o gabarito está errado?' });
    expect(document.activeElement).toBe(campo);
    expect(campo.getAttribute('maxlength')).toBe('280');
    const enviar = screen.getByRole('button', { name: /Enviar Contestação/ }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    await user.type(campo, 'O comentário mente');
    expect(screen.getByText('18/280')).toBeTruthy();
    await user.click(enviar);
    expect(onContestar).toHaveBeenCalledWith('O comentário mente');
    expect(onAvancar).not.toHaveBeenCalled();
  });

  it('cancelar volta ao menu sem contestar', async () => {
    const user = userEvent.setup();
    const { onContestar } = montar(errou, true);
    await user.click(screen.getByRole('menuitem', { name: '⚑ Contestar o gabarito' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Próximo Desafio' })).toBeTruthy();
    expect(onContestar).not.toHaveBeenCalled();
  });

  it('sem onContestar (ou antes da correção) não há Contestação', () => {
    montar(errou);
    expect(screen.queryByRole('menuitem', { name: /Contestar/ })).toBeNull();
  });

  it('anulado: GOLPE CRÍTICO, o código de verdade e o texto que explica a mecânica', () => {
    const anulado = contestarDesafio(errou, 'O comentário mente', {
      veredito: 'anulado',
      explicacao: 'Nenhuma linha confere pedido repetido.',
      evidencias: [codigoReal],
    });
    montar(anulado, true);
    expect(screen.getByRole('status').textContent).toBe(
      'GOLPE CRÍTICO! Desafio anulado — Caçador de Slop! +50 XP',
    );
    expect(
      screen.getByRole('meter', { name: 'Vida do Guardião' }).getAttribute('aria-valuenow'),
    ).toBe('3');
    expect(screen.getByText(/Nenhuma linha confere pedido repetido/)).toBeTruthy();
    expect(screen.getByText('api/src/payments/dwarfVault.ts:24')).toBeTruthy();
    expect(screen.getByText(/Comentário também é código, e pode mentir/)).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: /Contestar/ })).toBeNull();
  });

  it('mantido: GABARITO MANTIDO com a explicação; não se contesta de novo', () => {
    const mantido = contestarDesafio(errou, 'Discordo', {
      veredito: 'mantido',
      explicacao: 'O `server.ts` registra a rota.',
      evidencias: [],
    });
    montar(mantido, true);
    expect(screen.getByText('⚑ GABARITO MANTIDO')).toBeTruthy();
    expect(screen.getAllByText(/registra a rota/)).toHaveLength(2);
    expect(screen.getByRole('status').textContent).toMatch(/desviou/);
    expect(screen.queryByRole('menuitem', { name: /Contestar/ })).toBeNull();
  });
});

describe('ResumoExpedicao', () => {
  const vitoria: ResultadoExpedicao = {
    regiaoId: 'api',
    venceu: true,
    acertos: 4,
    respondidos: 5,
    xp: 80,
    contestacoesVencidas: 0,
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

  it('a Contestação vencida aparece como bônus de Caçador de Slop', () => {
    render(
      <ResumoExpedicao
        resultado={{ ...vitoria, xp: 130, contestacoesVencidas: 1 }}
        nomeRegiao="Cofre do Anão"
        descobertas={[]}
        onVoltar={() => {}}
      />,
    );
    expect(screen.getByText(/\+130 XP/)).toBeTruthy();
    expect(
      screen.getByText(/Caçador de Slop: 1 Contestação vencida \(\+50 XP de bônus\)/),
    ).toBeTruthy();
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
