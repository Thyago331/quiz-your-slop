import { describe, expect, it } from 'vitest';
import { arquivosDoProjeto, nomearRepositorios } from './caminhos.ts';
import { conferirEsquema } from './esquema.ts';
import {
  ESQUEMA_CRIAR_AVENTURA,
  ErroDoMestre,
  NOVAS_TENTATIVAS,
  criarAventura,
  detalharRegiao,
  esquemaDetalharRegiao,
  montarPrompt,
  type EntradaDetalharRegiao,
  type EventoDoMestre,
  type PedidoAoMestre,
  type SaidaCriarAventura,
} from './mestre.ts';

const repositorios = nomearRepositorios(['/home/a/loja']);
const arquivos = arquivosDoProjeto(repositorios, {
  loja: 'src/rotas/pedidos.ts\0src/servicos/pedidos.ts\0web/App.tsx\0',
});

const saidaCriar: SaidaCriarAventura = {
  territorios: [
    { nome: 'Servidor', resumo: 'A API.', raizes: ['src'] },
    { nome: 'Tela', resumo: 'O front.', raizes: ['./web'] },
  ],
  candidatas_entrada: [
    {
      nome: 'API de pedidos',
      resumo: 'Recebe e grava pedidos.',
      territorio_id: null,
      territorio_novo: { nome: 'Servidor', raizes: ['src'] },
      arquivos_semente: ['src/rotas/pedidos.ts', 'src/nao-existe.ts'],
      motivo: 'É a rota principal.',
    },
  ],
};

/** Um Mestre de mentira: devolve as respostas na ordem e guarda os pedidos. */
function falso(...respostas: unknown[]) {
  const pedidos: PedidoAoMestre[] = [];
  const transporte = async (pedido: PedidoAoMestre) => {
    pedidos.push(pedido);
    const r = respostas[Math.min(pedidos.length - 1, respostas.length - 1)];
    return typeof r === 'string' ? r : JSON.stringify(r);
  };
  return { transporte, pedidos };
}

const entradaCriar = { idioma: 'es' as const, repositorios, classe: 'backend' as const };

describe('montarPrompt', () => {
  it('leva o papel, o idioma do Jogador e o JSON de contexto com idioma', () => {
    const prompt = montarPrompt('criar_aventura', entradaCriar, { varios: false });
    expect(prompt).toContain('Master (Mestre)');
    expect(prompt).toContain('Spanish (es)');
    expect(prompt).toContain('"idioma": "es"');
    expect(prompt).toContain('"caminho_local": "/home/a/loja"');
    expect(prompt).not.toContain('rejected');
  });

  it('com vários repositórios, explica o prefixo', () => {
    const prompt = montarPrompt('criar_aventura', entradaCriar, { varios: true });
    expect(prompt).toContain('"loja-api:src/orders/service.ts"');
  });

  it('na nova tentativa, conta o que foi recusado', () => {
    const prompt = montarPrompt('detalhar_regiao', entradaCriar, {
      varios: false,
      problemas: ['$.arquivos: faltando'],
    });
    expect(prompt).toContain('- $.arquivos: faltando');
  });
});

describe('criarAventura', () => {
  it('manda o schema da chamada e normaliza os caminhos, descartando os que não existem', async () => {
    const { transporte, pedidos } = falso(saidaCriar);
    const saida = await criarAventura(transporte, entradaCriar, { repositorios, arquivos });
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]?.chamada).toBe('criar_aventura');
    expect(pedidos[0]?.schema).toBe(ESQUEMA_CRIAR_AVENTURA);
    expect(saida.territorios[1]?.raizes).toEqual(['web']);
    expect(saida.candidatas_entrada[0]?.arquivos_semente).toEqual(['src/rotas/pedidos.ts']);
  });

  it('tenta de novo com a saída inválida e depois desiste com erro claro', async () => {
    const eventos: EventoDoMestre[] = [];
    const { transporte, pedidos } = falso(
      'não é json',
      { territorios: [] },
      { ...saidaCriar, extra: 1 },
    );
    const erro = await criarAventura(transporte, entradaCriar, {
      repositorios,
      aoAcompanhar: (e) => eventos.push(e),
    }).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDoMestre);
    expect((erro as ErroDoMestre).tentativas).toBe(1 + NOVAS_TENTATIVAS);
    expect((erro as ErroDoMestre).problemas).toEqual(['$.extra: campo desconhecido']);
    expect(pedidos).toHaveLength(3);
    expect(pedidos[1]?.prompt).toContain('a resposta não é JSON');
    expect(eventos.map((e) => `${e.tipo}${e.numero}`)).toEqual([
      'tentativa1',
      'recusada1',
      'tentativa2',
      'recusada2',
      'tentativa3',
      'recusada3',
    ]);
  });

  it('confere as referências: a candidata aponta um dos Territórios da saída', async () => {
    const ruim = structuredClone(saidaCriar);
    ruim.candidatas_entrada[0]!.territorio_novo = { nome: 'Outro', raizes: ['src'] };
    const { transporte, pedidos } = falso(ruim, saidaCriar);
    await criarAventura(transporte, entradaCriar, { repositorios, arquivos });
    expect(pedidos).toHaveLength(2);
    expect(pedidos[1]?.prompt).toContain('não é um dos territorios');
  });

  it('caminho malformado é recusado; sem nenhum arquivo existente também', async () => {
    const absoluto = structuredClone(saidaCriar);
    absoluto.candidatas_entrada[0]!.arquivos_semente = ['/etc/passwd'];
    const inexistente = structuredClone(saidaCriar);
    inexistente.candidatas_entrada[0]!.arquivos_semente = ['src/x.ts'];
    const { transporte, pedidos } = falso(absoluto, inexistente, saidaCriar);
    await criarAventura(transporte, entradaCriar, { repositorios, arquivos });
    expect(pedidos[1]?.prompt).toContain('caminho absoluto');
    expect(pedidos[2]?.prompt).toContain('nenhum arquivo existe no Projeto');
  });

  it('erro do transporte não gasta tentativa: sobe na hora', async () => {
    let chamadas = 0;
    const transporte = async () => {
      chamadas++;
      throw { codigo: 'mestre_ausente', detalhe: 'claude' };
    };
    await expect(criarAventura(transporte, entradaCriar, { repositorios })).rejects.toEqual({
      codigo: 'mestre_ausente',
      detalhe: 'claude',
    });
    expect(chamadas).toBe(1);
  });
});

describe('detalharRegiao', () => {
  const entrada: EntradaDetalharRegiao = {
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

  it('devolve a lista completa de arquivos, sem repetidos', async () => {
    const { transporte, pedidos } = falso({
      resumo: 'Recebe, valida e grava pedidos.',
      arquivos: ['src/rotas/pedidos.ts', './src/servicos/pedidos.ts', 'src/rotas/pedidos.ts'],
    });
    const saida = await detalharRegiao(transporte, entrada, { repositorios, arquivos });
    expect(saida.arquivos).toEqual(['src/rotas/pedidos.ts', 'src/servicos/pedidos.ts']);
    expect(pedidos[0]?.prompt).toContain('"id": "r1"');
  });

  it('dividir só aponta Territórios conhecidos', async () => {
    const dividir = (territorio_id: string | null) => ({
      resumo: 'x',
      arquivos: ['src/rotas/pedidos.ts'],
      dividir: [
        { nome: 'A', resumo: 'a', territorio_id, arquivos_semente: ['src/rotas/pedidos.ts'] },
        { nome: 'B', resumo: 'b', territorio_id: 't1', arquivos_semente: ['web/App.tsx'] },
      ],
    });
    const { transporte, pedidos } = falso(dividir('t9'), dividir(null), dividir('t1'));
    const saida = await detalharRegiao(transporte, entrada, { repositorios, arquivos });
    expect(pedidos[1]?.prompt).toContain('id desconhecido: t9');
    expect(pedidos[2]?.prompt).toContain('territorio_id null sem territorio_novo');
    expect(saida.dividir).toHaveLength(2);
  });

  it('sem permissão de dividir, o schema não tem dividir', async () => {
    expect(esquemaDetalharRegiao(false).properties).not.toHaveProperty('dividir');
    const { transporte, pedidos } = falso({ resumo: 'x', arquivos: ['web/App.tsx'] });
    await detalharRegiao(transporte, entrada, { repositorios, permitirDividir: false });
    expect(pedidos[0]?.prompt).not.toContain('"dividir" (optional)');
    expect(
      conferirEsquema(esquemaDetalharRegiao(false), { resumo: 'x', arquivos: ['a'], dividir: [] }),
    ).toEqual(['$.dividir: campo desconhecido']);
  });
});
