import { describe, expect, it } from 'vitest';
import {
  aplicarDetalhe,
  lerAventuraSalva,
  montarAventura,
  type AventuraNoProjeto,
} from './criacao.ts';
import { avancar, iniciarExpedicao, responderDesafio, type Expedicao } from './expedicao.ts';
import {
  concluirNaAventura,
  detalharVizinhas,
  podePartir,
  prepararNaAventura,
  regioesDoExplorador,
} from './expedicaoNoProjeto.ts';
import { arvoreDoExplorador } from './explorador.ts';
import type { EntradaDetalharRegiao, EntradaPrepararExpedicao, PedidoAoMestre } from './mestre.ts';
import {
  ARQUIVOS,
  apontar,
  arquivos,
  fluxo,
  lerArquivo,
  ligacaoNova,
  multipla,
  repositorios,
} from './projetoDeTeste.ts';

function contador(prefixo = 'id') {
  let n = 0;
  return () => `${prefixo}-${++n}`;
}

/** Rotas de pedidos (entrada, detalhada) e a Tela, já revelada, no outro Território. */
function aventura(): AventuraNoProjeto {
  const a = montarAventura({
    id: '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b',
    agora: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'backend',
    repositorios: repositorios.map((r) => ({ ...r, commit: 'abc' })),
    saida: {
      territorios: [
        { nome: 'API', resumo: 'O back.', raizes: ['src'] },
        { nome: 'Web', resumo: 'O front.', raizes: ['web'] },
      ],
      candidatas_entrada: [
        {
          nome: 'Rotas de pedidos',
          resumo: 'Recebe POST /orders.',
          territorio_id: null,
          territorio_novo: { nome: 'API', raizes: ['src'] },
          arquivos_semente: ['src/rotas/pedidos.ts'],
          motivo: 'x',
        },
      ],
    },
    escolhida: 0,
    gerarId: (() => {
      const ids = ['t-api', 't-web', 'r-rotas'];
      return () => ids.shift()!;
    })(),
  });
  return {
    ...a,
    regioes: [
      { ...a.regioes[0]!, arquivos: ['src/rotas/pedidos.ts'] },
      {
        id: 'r-tela',
        nome: 'Tela',
        resumo: 'O front.',
        territorio_id: 't-web',
        arquivos: ['web/App.tsx'],
        arquivos_semente: ['web/App.tsx'],
      },
    ],
    mapa: { ...a.mapa, estados: { ...a.mapa.estados, 'r-tela': 'revelada' } },
  };
}

const ROTAS = 'r-rotas';

const ligacaoTela = {
  tipo: 'chamada',
  descricao: 'A tela chama POST /orders',
  destino: { regiao_id: 'r-tela' },
  evidencias: [
    { caminho: 'web/App.tsx', linha_inicio: 2, linha_fim: 2, trecho: "return fetch('/orders');" },
  ],
};
const novaComTerritorio = {
  ...ligacaoNova,
  tipo: 'consulta',
  descricao: 'O serviço grava no banco',
  destino: {
    nova: {
      nome: 'Banco',
      resumo: 'Guarda pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'Dados', raizes: ['src'] },
      arquivos_semente: ['src/db.ts'],
    },
  },
};
const cinco = [multipla(1, 1), apontar(2), fluxo(3), multipla(4, 5), multipla(5, 3)];

/** Um Mestre por chamada: preparar devolve as respostas na ordem; detalhar responde por região. */
function mestre(preparar: unknown[], detalhar: (e: EntradaDetalharRegiao) => unknown) {
  const pedidos: PedidoAoMestre[] = [];
  let p = 0;
  const transporte = async (pedido: PedidoAoMestre) => {
    pedidos.push(pedido);
    const contexto = JSON.parse(pedido.prompt.split('Context (JSON):\n')[1]!);
    const r =
      pedido.chamada === 'preparar_expedicao'
        ? preparar[Math.min(p++, preparar.length - 1)]
        : detalhar(contexto);
    return JSON.stringify(r);
  };
  const contextos = (chamada: string) =>
    pedidos
      .filter((x) => x.chamada === chamada)
      .map((x) => JSON.parse(x.prompt.split('Context (JSON):\n')[1]!));
  return { transporte, pedidos, contextos };
}

const opcoes = () => ({
  idioma: 'pt' as const,
  lerArquivo,
  arquivos,
  gerarId: contador('j'),
  aleatorio: () => 0,
});

/** Joga a Expedição inteira: acerta os `acertos` primeiros e erra o resto. */
function jogar(expedicao: Expedicao, acertos: number): Expedicao {
  let e = expedicao;
  for (let k = 0; e.fase !== 'encerrada'; k++) {
    const d = e.desafios[e.atual]!;
    e = responderDesafio(e, k < acertos ? d.gabarito : ['nenhuma']);
    e = avancar(e);
  }
  return e;
}

describe('Expedição no Projeto', () => {
  it('só parte de região desbloqueada e já detalhada', () => {
    const a = aventura();
    expect(podePartir(a, ROTAS)).toBe(true);
    expect(podePartir(a, 'r-tela')).toBe(false);
    const semDetalhe = { ...a, regioes: a.regioes.map((r) => ({ ...r, arquivos: [] })) };
    expect(podePartir(semDetalhe, ROTAS)).toBe(false);
  });

  it('as Ligações ficam escondidas, são reaproveitadas na nova tentativa e aparecem na vitória', async () => {
    const { transporte, contextos, pedidos } = mestre(
      [
        { desafios: cinco, ligacoes: [ligacaoTela, ligacaoNova, novaComTerritorio] },
        { desafios: [multipla(6, 1), apontar(7), fluxo(8), multipla(9, 4), multipla(10, 5)] },
      ],
      (e) => ({ resumo: `${e.regiao.nome} detalhada.`, arquivos: e.regiao.arquivos_semente }),
    );
    let a = aventura();

    // 1ª tentativa: perde. As Ligações ficam guardadas, fora do mapa.
    const primeira = await prepararNaAventura(transporte, a, ROTAS, opcoes());
    expect(primeira.descartados).toEqual([]);
    a = primeira.aventura;
    expect(a.ligacoes_escondidas[ROTAS]).toHaveLength(3);
    expect(a.mapa.ligacoes).toEqual([]);
    expect(a.ligacoes).toEqual([]);
    expect(Object.keys(a.mapa.estados)).toHaveLength(2);
    const perdida = concluirNaAventura(a, jogar(iniciarExpedicao(ROTAS, primeira.desafios), 2), {
      gerarId: contador('n'),
      agora: '2026-10-25T13:00:00.000Z',
    });
    expect(perdida.resultado.venceu).toBe(false);
    expect(perdida.novas).toEqual([]);
    a = perdida.aventura;
    expect(a.xp).toBe(40);
    expect(a.estatisticas).toEqual({ expedicoes: 1, acertos: 2, contestacoes_vencidas: 0 });
    expect(a.vistos[ROTAS]).toEqual(primeira.desafios.map((d) => d.enunciado));
    expect(a.ligacoes_escondidas[ROTAS]).toHaveLength(3);

    // 2ª tentativa: o Mestre não precisa devolver as Ligações e não repete os enunciados.
    const segunda = await prepararNaAventura(transporte, a, ROTAS, opcoes());
    const [, ctx] = contextos('preparar_expedicao') as EntradaPrepararExpedicao[];
    expect(ctx!.ligacoes_conhecidas).toBe(true);
    expect(ctx!.desafios_anteriores).toEqual(a.vistos[ROTAS]);
    expect(ctx!.mapa.map((r) => r.id)).toEqual(['r-tela']);
    expect(pedidos[1]!.schema.required).toEqual(['desafios']);
    a = segunda.aventura;
    expect(a.ligacoes_escondidas[ROTAS]).toHaveLength(3);

    // Vitória: região revelada, vizinhas novas com ids do Jogo, sem nova chamada ao Mestre.
    const chamadas = pedidos.length;
    const vitoria = concluirNaAventura(a, jogar(iniciarExpedicao(ROTAS, segunda.desafios), 5), {
      gerarId: contador('n'),
      agora: '2026-10-25T14:00:00.000Z',
    });
    expect(pedidos).toHaveLength(chamadas);
    a = vitoria.aventura;
    expect(vitoria.resultado.venceu).toBe(true);
    expect(a.mapa.estados[ROTAS]).toBe('revelada');
    // n-1 = Serviço de pedidos; n-2 = Território Dados; n-3 = Banco.
    expect(vitoria.novas).toEqual(['n-1', 'n-3']);
    expect(vitoria.descobertas).toEqual(['n-1', 'n-3']);
    expect(a.regioes.find((r) => r.id === 'n-1')).toEqual({
      id: 'n-1',
      nome: 'Serviço de pedidos',
      resumo: 'Grava pedidos.',
      territorio_id: 't-api',
      arquivos: [],
      arquivos_semente: ['src/servicos/pedidos.ts'],
    });
    expect(a.territorios.find((t) => t.id === 'n-2')?.nome).toBe('Dados');
    expect(a.regioes.find((r) => r.id === 'n-3')?.territorio_id).toBe('n-2');
    expect(a.mapa.estados['n-1']).toBe('desbloqueada');
    expect(a.mapa.estados['n-3']).toBe('desbloqueada');
    expect(a.mapa.estados['r-tela']).toBe('revelada');
    expect(a.ligacoes.map((l) => [l.origem, l.destino, l.tipo])).toEqual([
      [ROTAS, 'r-tela', 'chamada'],
      [ROTAS, 'n-1', 'dependencia'],
      [ROTAS, 'n-3', 'consulta'],
    ]);
    expect(a.mapa.ligacoesConhecidas).toEqual(a.ligacoes.map((l) => l.id));
    expect(a.ligacoes_escondidas[ROTAS]).toBeUndefined();
    expect(a.xp).toBe(40 + 80);
    expect(lerAventuraSalva(JSON.stringify(a))).toEqual(a);

    // Cada vizinha nova é detalhada, uma de cada vez.
    const eventos: string[] = [];
    const { aventura: detalhada, falhas } = await detalharVizinhas(transporte, a, vitoria.novas, {
      idioma: 'pt',
      arquivos,
      gerarId: contador('d'),
      aoAvancar: (e) => eventos.push(`${e.tipo}:${e.regiaoId}`),
    });
    expect(falhas).toEqual([]);
    expect(contextos('detalhar_regiao').map((c) => c.regiao.id)).toEqual(['n-1', 'n-3']);
    expect(detalhada.regioes.find((r) => r.id === 'n-3')?.arquivos).toEqual(['src/db.ts']);
    expect(eventos).toEqual(['detalhando:n-1', 'detalhada:n-1', 'detalhando:n-3', 'detalhada:n-3']);
  });

  it('região nova com o nome de uma conhecida liga a ela; detalhe que falha deixa as sementes', async () => {
    const paraTela = {
      ...ligacaoNova,
      destino: { nova: { ...ligacaoNova.destino.nova, nome: ' tela ', territorio_id: 't-web' } },
    };
    const { transporte } = mestre(
      [{ desafios: cinco, ligacoes: [paraTela, novaComTerritorio] }],
      () => 'quebrado',
    );
    const preparada = await prepararNaAventura(transporte, aventura(), ROTAS, opcoes());
    const vitoria = concluirNaAventura(
      preparada.aventura,
      jogar(iniciarExpedicao(ROTAS, preparada.desafios), 4),
      { gerarId: contador('n'), agora: '2026-10-25T14:00:00.000Z' },
    );
    expect(vitoria.aventura.ligacoes.map((l) => l.destino)).toEqual(['r-tela', 'n-2']);
    expect(vitoria.novas).toEqual(['n-2']);

    const r = await detalharVizinhas(transporte, vitoria.aventura, vitoria.novas, {
      idioma: 'pt',
      arquivos,
      gerarId: contador('d'),
    });
    expect(r.falhas).toEqual(['n-2']);
    const banco = r.aventura.regioes.find((x) => x.id === 'n-2')!;
    expect(banco.arquivos).toEqual([]);
    expect(banco.arquivos_semente).toEqual(['src/db.ts']);
    expect(r.aventura.mapa.estados['n-2']).toBe('desbloqueada');
  });

  it('dividir uma vizinha leva as Ligações à parte com o arquivo da Evidência', () => {
    const a = aventura();
    const ligada: AventuraNoProjeto = {
      ...a,
      ligacoes: [
        {
          id: 'l1',
          origem: 'r-tela',
          destino: ROTAS,
          tipo: 'chamada',
          descricao: 'x',
          evidencias: [
            { caminho: 'src/rotas/pedidos.ts', linha_inicio: 1, linha_fim: 1, trecho: '' },
          ],
        },
      ],
      mapa: { ...a.mapa, ligacoes: [{ id: 'l1', origem: 'r-tela', destino: ROTAS }] },
    };
    const { aventura: dividida, novas } = aplicarDetalhe(
      ligada,
      ROTAS,
      {
        resumo: 'x',
        arquivos: [],
        dividir: [
          { nome: 'A', resumo: 'a', territorio_id: 't-api', arquivos_semente: ['src/db.ts'] },
          {
            nome: 'B',
            resumo: 'b',
            territorio_id: 't-api',
            arquivos_semente: ['src/rotas/pedidos.ts'],
          },
        ],
      },
      contador('s'),
    );
    expect(novas).toEqual(['s-1', 's-2']);
    expect(dividida.ligacoes[0]?.destino).toBe('s-2');
    expect(dividida.mapa.ligacoes).toEqual([{ id: 'l1', origem: 'r-tela', destino: 's-2' }]);
  });

  it('o explorador mostra as regiões conhecidas e o resto de cada Território na Névoa', () => {
    const a = aventura();
    const entrada = regioesDoExplorador(a, Object.keys(ARQUIVOS), ['src/db.ts']);
    const grupos = arvoreDoExplorador({ territorios: a.territorios, ...entrada });
    const visiveis: string[] = [];
    let nevoa = 0;
    const visitar = (nos: (typeof grupos)[number]['filhos']) => {
      for (const no of nos) {
        if (no.tipo === 'pasta') visitar(no.filhos);
        else if (no.naNevoa) nevoa++;
        else visiveis.push(no.caminho);
      }
    };
    grupos.forEach((g) => visitar(g.filhos));
    expect(visiveis.sort()).toEqual(['src/db.ts', 'src/rotas/pedidos.ts', 'web/App.tsx']);
    expect(nevoa).toBe(1);
  });
});
