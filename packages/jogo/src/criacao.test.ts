import { describe, expect, it } from 'vitest';
import { arquivosDoProjeto, nomearRepositorios } from './caminhos.ts';
import { desembrulharClaudeCode } from './claudeCode.ts';
import {
  aplicarDetalhe,
  aventuraMaisRecente,
  detalharNaAventura,
  lerAventuraSalva,
  montarAventura,
  regioesConhecidas,
  type AventuraNoProjeto,
} from './criacao.ts';
import { criarAventura, type PedidoAoMestre, type SaidaCriarAventura } from './mestre.ts';

// Projeto de dois repositórios: os caminhos levam o prefixo.
const repositorios = nomearRepositorios(['/p/loja-front', '/p/loja-api']).map((r) => ({
  ...r,
  commit: 'abc123',
}));
const arquivos = arquivosDoProjeto(repositorios, {
  'loja-front': 'src/Checkout.tsx\0src/api.ts\0',
  'loja-api': 'src/orders/route.ts\0src/orders/service.ts\0src/db.ts\0',
});

const saidaCriar: SaidaCriarAventura = {
  territorios: [
    { nome: 'Loja', resumo: 'O front.', raizes: ['loja-front:.'] },
    { nome: 'API', resumo: 'O back.', raizes: ['loja-api:src'] },
  ],
  candidatas_entrada: [
    {
      nome: 'Checkout',
      resumo: 'A tela que chama POST /orders.',
      territorio_id: null,
      territorio_novo: { nome: 'Loja', raizes: ['loja-front:.'] },
      arquivos_semente: ['loja-front:src/Checkout.tsx'],
      motivo: 'A travessia front ↔ back.',
    },
    {
      nome: 'API de pedidos',
      resumo: 'Recebe pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'API', raizes: ['loja-api:src'] },
      arquivos_semente: ['loja-api:src/orders/route.ts'],
      motivo: 'Rota principal.',
    },
  ],
  aviso_classe: 'Sem worker de fila.',
};

function contador() {
  let n = 0;
  return () => `id-${++n}`;
}

const ID = '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b';

function nova(escolhida = 1): AventuraNoProjeto {
  return montarAventura({
    id: ID,
    agora: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'backend',
    repositorios,
    saida: saidaCriar,
    escolhida,
    gerarId: contador(),
  });
}

describe('montarAventura', () => {
  it('o Jogo cria os ids; só a entrada existe no mapa, desbloqueada', () => {
    const a = nova();
    expect(a.territorios.map((t) => [t.id, t.nome])).toEqual([
      ['id-1', 'Loja'],
      ['id-2', 'API'],
    ]);
    expect(a.regioes).toEqual([
      {
        id: 'id-3',
        nome: 'API de pedidos',
        resumo: 'Recebe pedidos.',
        territorio_id: 'id-2',
        arquivos: [],
        arquivos_semente: ['loja-api:src/orders/route.ts'],
      },
    ]);
    expect(a.mapa.estados).toEqual({ 'id-3': 'desbloqueada' });
    expect(a.aviso_classe).toBe('Sem worker de fila.');
    expect(regioesConhecidas(a)[0]?.estado).toBe('desbloqueada');
  });
});

describe('aplicarDetalhe', () => {
  it('sem dividir, troca resumo e arquivos', () => {
    const { aventura, novas } = aplicarDetalhe(
      nova(),
      'id-3',
      { resumo: 'Melhor.', arquivos: ['loja-api:src/orders/route.ts'] },
      contador(),
    );
    expect(novas).toEqual([]);
    expect(aventura.regioes[0]?.resumo).toBe('Melhor.');
    expect(aventura.regioes[0]?.arquivos).toEqual(['loja-api:src/orders/route.ts']);
  });

  it('dividir troca a região pelas novas, no mesmo estado, e cria Território novo com id', () => {
    const gerar = (() => {
      let n = 100;
      return () => `id-${++n}`;
    })();
    const { aventura, novas } = aplicarDetalhe(
      nova(),
      'id-3',
      {
        resumo: 'x',
        arquivos: ['loja-api:src/db.ts'],
        dividir: [
          {
            nome: 'Rota',
            resumo: 'r',
            territorio_id: 'id-2',
            arquivos_semente: ['loja-api:src/orders/route.ts'],
          },
          {
            nome: 'Banco',
            resumo: 'b',
            territorio_id: null,
            territorio_novo: { nome: 'Banco', raizes: ['loja-api:src'] },
            arquivos_semente: ['loja-api:src/db.ts'],
          },
        ],
      },
      gerar,
    );
    expect(novas).toEqual(['id-101', 'id-103']);
    expect(aventura.regioes.map((r) => [r.id, r.territorio_id])).toEqual([
      ['id-101', 'id-2'],
      ['id-103', 'id-102'],
    ]);
    expect(aventura.territorios.at(-1)?.nome).toBe('Banco');
    expect(aventura.mapa.estados).toEqual({ 'id-101': 'desbloqueada', 'id-103': 'desbloqueada' });
  });
});

/**
 * A CLI de mentira, ponta a ponta: o transporte devolve o stdout do `claude -p` (envelope JSON) e o
 * Jogo desembrulha, confere, tenta de novo e monta a Aventura que vai para o disco.
 */
describe('Mestre de mentira, da Leitura ao arquivo local', () => {
  const envelope = (saida: unknown) =>
    JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: '',
      structured_output: saida,
    });

  it('cria, detalha (com uma resposta inválida no meio) e volta igual do disco', async () => {
    const respostas: Record<string, string[]> = {
      criar_aventura: [
        JSON.stringify({
          type: 'result',
          subtype: 'error_max_structured_output_retries',
          is_error: true,
        }),
        envelope(saidaCriar),
      ],
      detalhar_regiao: [
        envelope({ resumo: 'sem arquivos', arquivos: [] }),
        envelope({
          resumo: 'Recebe, valida e grava pedidos.',
          arquivos: [
            'loja-api:src/orders/route.ts',
            'loja-api:src/orders/service.ts',
            'loja-api:src/sumiu.ts',
          ],
        }),
      ],
    };
    const pedidos: PedidoAoMestre[] = [];
    const transporte = async (pedido: PedidoAoMestre) => {
      pedidos.push(pedido);
      return desembrulharClaudeCode(respostas[pedido.chamada]!.shift()!);
    };

    const saida = await criarAventura(
      transporte,
      {
        idioma: 'en',
        repositorios: repositorios.map(({ nome, caminho_local }) => ({ nome, caminho_local })),
        classe: 'backend',
      },
      { repositorios, arquivos },
    );
    const gerarId = contador();
    const criada = montarAventura({
      id: ID,
      agora: '2026-10-25T12:00:00.000Z',
      mestre: 'claude_code',
      classe: 'backend',
      repositorios,
      saida,
      escolhida: 1,
      gerarId,
    });
    const detalhada = await detalharNaAventura(transporte, criada, criada.regioes[0]!.id, {
      idioma: 'en',
      arquivos,
      gerarId,
    });

    expect(pedidos.map((p) => p.chamada)).toEqual([
      'criar_aventura',
      'criar_aventura',
      'detalhar_regiao',
      'detalhar_regiao',
    ]);
    expect(pedidos.every((p) => p.prompt.includes('"idioma": "en"'))).toBe(true);
    expect(pedidos[3]?.prompt).toContain('$.arquivos: menos de 1 itens');
    expect(detalhada.regioes[0]?.arquivos).toEqual([
      'loja-api:src/orders/route.ts',
      'loja-api:src/orders/service.ts',
    ]);
    expect(lerAventuraSalva(JSON.stringify(detalhada))).toEqual(detalhada);
  });
});

describe('lerAventuraSalva', () => {
  it('recusa o que não é uma Aventura inteira e coerente', () => {
    const a = nova();
    expect(lerAventuraSalva(JSON.stringify(a))).toEqual(a);
    for (const ruim of [
      'não é json',
      JSON.stringify({ ...a, id: 'tutorial' }),
      JSON.stringify({ ...a, versao: 4 }),
      // v2 sem um dos campos novos, ou v1 com eles: nenhum dos dois existe.
      JSON.stringify({ ...a, xp: undefined }),
      JSON.stringify({ ...a, versao: 1 }),
      JSON.stringify({
        ...a,
        ligacoes: [
          { id: 'l', origem: 'x', destino: 'y', tipo: 'evento', descricao: 'd', evidencias: [] },
        ],
      }),
      JSON.stringify({ ...a, extra: true }),
      JSON.stringify({ ...a, mapa: { ...a.mapa, estados: {} } }),
      JSON.stringify({ ...a, territorios: [] }),
    ]) {
      expect(lerAventuraSalva(ruim)).toBeUndefined();
    }
  });

  it('sobe um arquivo da v1 para a v2, sem XP nem Ligações', () => {
    const a = nova();
    const { xp, estatisticas, ligacoes, ligacoes_escondidas, ...resto } = a;
    expect([xp, ligacoes, ligacoes_escondidas, estatisticas.expedicoes]).toEqual([0, [], {}, 0]);
    const v1 = JSON.stringify({ ...resto, versao: 1 });
    expect(lerAventuraSalva(v1)).toEqual(a);
  });

  it('sobe a v2 para a v3: região revelada ganha o commit de criação como o da revelação', () => {
    const a = nova();
    const id = a.regioes[0]!.id;
    const v2 = { ...a, versao: 2, mapa: { ...a.mapa, estados: { [id]: 'revelada' } } };
    const lida = lerAventuraSalva(JSON.stringify(v2));
    expect(lida?.versao).toBe(3);
    expect(lida?.regioes[0]?.revelada_em).toEqual({ 'loja-front': 'abc123', 'loja-api': 'abc123' });
    // Desbloqueada não tem revelação; a v3 guarda a sua.
    expect(
      lerAventuraSalva(JSON.stringify({ ...a, versao: 2 }))?.regioes[0]?.revelada_em,
    ).toBeUndefined();
    const v3 = {
      ...v2,
      versao: 3,
      regioes: [{ ...a.regioes[0]!, revelada_em: { 'loja-front': 'f1' } }],
    };
    expect(lerAventuraSalva(JSON.stringify(v3))?.regioes[0]?.revelada_em).toEqual({
      'loja-front': 'f1',
    });
  });

  it('o Continuar abre a mexida por último', () => {
    const a = nova();
    const b = { ...a, atualizada_em: '2026-10-26T00:00:00.000Z' };
    expect(aventuraMaisRecente([a, b])).toBe(b);
    expect(aventuraMaisRecente([])).toBeUndefined();
  });
});
