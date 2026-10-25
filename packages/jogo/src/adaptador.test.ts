// A mesma bateria para os dois Mestres: cada CLI de mentira imprime no formato real da sua IA
// (envelope do Claude Code, última mensagem estrita do Codex) e o Jogo chega ao mesmo resultado.
import { describe, expect, it } from 'vitest';
import { adaptadorDoMestre } from './adaptador.ts';
import { cliDeMentira } from './cliDeMentira.ts';
import { esquemaEstrito } from './codex.ts';
import { IAS_DO_MESTRE } from './criacao.ts';
import {
  ESQUEMA_CRIAR_AVENTURA,
  ErroDoMestre,
  criarAventura,
  detalharRegiao,
  esquemaDetalharRegiao,
  type EntradaDetalharRegiao,
  type EntradaPrepararExpedicao,
  type SaidaCriarAventura,
} from './mestre.ts';
import { esquemaPrepararExpedicao, prepararExpedicao } from './preparacao.ts';
import {
  apontar,
  arquivos,
  falso,
  fluxo,
  lerArquivo,
  ligacaoNova,
  ligacaoTela,
  multipla,
  repositorios,
} from './projetoDeTeste.ts';

const saidaCriar: SaidaCriarAventura = {
  territorios: [{ nome: 'Servidor', resumo: 'A API.', raizes: ['src'] }],
  candidatas_entrada: [
    {
      nome: 'API de pedidos',
      resumo: 'Recebe e grava pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'Servidor', raizes: ['src'] },
      arquivos_semente: ['src/rotas/pedidos.ts'],
      motivo: 'É a rota principal.',
    },
  ],
};

const entradaDetalhar: EntradaDetalharRegiao = {
  idioma: 'pt',
  regiao: {
    id: 'r1',
    nome: 'API de pedidos',
    resumo: 'Recebe pedidos.',
    territorio_id: 't1',
    estado: 'desbloqueada',
    arquivos: [],
    arquivos_semente: ['src/rotas/pedidos.ts'],
  },
  mapa: [],
  classe: 'backend',
  territorios: [{ id: 't1', nome: 'Servidor', resumo: 'A API.', raizes: ['src'] }],
};

const entradaPreparar: EntradaPrepararExpedicao = {
  idioma: 'en',
  regiao: {
    id: 'r-rotas',
    nome: 'Rotas de pedidos',
    resumo: 'Recebe POST /orders.',
    territorio_id: 't-api',
    estado: 'desbloqueada',
    arquivos: ['src/rotas/pedidos.ts'],
  },
  mapa: [
    {
      id: 'r-tela',
      nome: 'Tela',
      resumo: 'O front.',
      territorio_id: 't-web',
      estado: 'revelada',
      arquivos: ['web/App.tsx'],
    },
  ],
  classe: 'backend',
  desafios_anteriores: [],
  ligacoes_conhecidas: false,
  quantidade: 5,
  territorios: [
    { id: 't-api', nome: 'API', resumo: 'O back.', raizes: ['src'] },
    { id: 't-web', nome: 'Web', resumo: 'O front.', raizes: ['web'] },
  ],
};

const cinco = [multipla(1, 1), apontar(2), fluxo(3, 'r-tela'), multipla(4, 5), fluxo(5)];

const opcoesDaPreparacao = () => {
  let n = 0;
  return { repositorios, arquivos, lerArquivo, gerarId: () => `j-${++n}`, aleatorio: () => 0 };
};

describe.each(IAS_DO_MESTRE)('Mestre %s', (ia) => {
  it('manda à CLI o schema no formato dela', async () => {
    const { rodar, recebidos } = cliDeMentira(ia, { criar_aventura: [saidaCriar] });
    await criarAventura(
      adaptadorDoMestre(ia, rodar),
      { idioma: 'pt', repositorios, classe: 'backend' },
      { repositorios, arquivos },
    );
    expect(recebidos[0]?.ia).toBe(ia);
    if (ia === 'claude_code') expect(recebidos[0]?.schema).toBe(ESQUEMA_CRIAR_AVENTURA);
    else expect(recebidos[0]?.schema).toEqual(esquemaEstrito(ESQUEMA_CRIAR_AVENTURA));
  });

  it('criar_aventura: falha da CLI e lixo valem nova tentativa; depois, a saída conferida', async () => {
    const { rodar, recebidos } = cliDeMentira(ia, {
      criar_aventura: ['falha', 'Usage: ...', saidaCriar],
    });
    const saida = await criarAventura(
      adaptadorDoMestre(ia, rodar),
      { idioma: 'pt', repositorios, classe: 'backend' },
      { repositorios, arquivos },
    );
    expect(recebidos).toHaveLength(3);
    expect(saida).toEqual(saidaCriar);
    // aviso_classe opcional: o Codex devolve null, o Jogo vê ausente.
    expect(saida).not.toHaveProperty('aviso_classe');
  });

  it('criar_aventura: três falhas viram o erro claro', async () => {
    const { rodar } = cliDeMentira(ia, { criar_aventura: ['falha'] });
    await expect(
      criarAventura(
        adaptadorDoMestre(ia, rodar),
        { idioma: 'pt', repositorios, classe: 'backend' },
        { repositorios },
      ),
    ).rejects.toBeInstanceOf(ErroDoMestre);
  });

  it('detalhar_regiao: com e sem dividir', async () => {
    const dividir = [
      { nome: 'A', resumo: 'a', territorio_id: 't1', arquivos_semente: ['src/db.ts'] },
      {
        nome: 'B',
        resumo: 'b',
        territorio_id: null,
        territorio_novo: { nome: 'Web', raizes: ['web'] },
        arquivos_semente: ['web/App.tsx'],
      },
    ];
    const { rodar } = cliDeMentira(ia, {
      detalhar_regiao: [
        { resumo: 'Recebe pedidos.', arquivos: ['src/rotas/pedidos.ts'] },
        { resumo: 'Grande.', arquivos: ['src/db.ts'], dividir },
      ],
    });
    const transporte = adaptadorDoMestre(ia, rodar);
    const opcoes = { repositorios, arquivos };
    expect(await detalharRegiao(transporte, entradaDetalhar, opcoes)).toEqual({
      resumo: 'Recebe pedidos.',
      arquivos: ['src/rotas/pedidos.ts'],
    });
    const dividida = await detalharRegiao(transporte, entradaDetalhar, opcoes);
    expect(dividida.dividir).toEqual(dividir);
    expect(dividida.dividir?.[0]).not.toHaveProperty('territorio_novo');
  });

  it('preparar_expedicao: o mesmo resultado que o Mestre sem CLI', async () => {
    const saida = { desafios: cinco, ligacoes: [ligacaoNova, ligacaoTela] };
    const esperado = await prepararExpedicao(
      falso(saida).transporte,
      entradaPreparar,
      opcoesDaPreparacao(),
    );
    const { rodar } = cliDeMentira(ia, { preparar_expedicao: ['falha', saida] });
    const r = await prepararExpedicao(
      adaptadorDoMestre(ia, rodar),
      entradaPreparar,
      opcoesDaPreparacao(),
    );
    expect(r.desafios).toEqual(esperado.desafios);
    expect(r.ligacoes).toEqual(esperado.ligacoes);
    expect(r.desafios).toHaveLength(5);
    expect(r.descartados).toEqual([]);
  });

  it('preparar_expedicao com as Ligações já conhecidas: o schema não as exige', async () => {
    const { rodar, recebidos } = cliDeMentira(ia, { preparar_expedicao: [{ desafios: cinco }] });
    const r = await prepararExpedicao(
      adaptadorDoMestre(ia, rodar),
      { ...entradaPreparar, ligacoes_conhecidas: true },
      { ...opcoesDaPreparacao(), temLigacoes: true },
    );
    expect(r.desafios).toHaveLength(5);
    expect(r.ligacoes).toBeUndefined();
    const enviado = recebidos[0]!.schema;
    expect(enviado.required).toEqual(
      ia === 'codex' ? ['desafios', 'ligacoes'] : esquemaPrepararExpedicao(true).required,
    );
  });

  it('erro da CLI (ausente, tempo esgotado) sobe na hora, sem nova tentativa', async () => {
    let chamadas = 0;
    const transporte = adaptadorDoMestre(ia, async () => {
      chamadas++;
      throw { codigo: 'mestre_ausente', detalhe: ia };
    });
    await expect(
      detalharRegiao(transporte, entradaDetalhar, {
        repositorios,
        permitirDividir: false,
      }),
    ).rejects.toEqual({ codigo: 'mestre_ausente', detalhe: ia });
    expect(chamadas).toBe(1);
    expect(esquemaDetalharRegiao(false).properties).not.toHaveProperty('dividir');
  });
});
