// Um Projeto de mentira para os testes da Expedição no Projeto (não é exportado pelo pacote).
import { arquivosDoProjeto, nomearRepositorios } from './caminhos.ts';
import type { EntradaPrepararExpedicao, PedidoAoMestre } from './mestre.ts';

// Um Projeto pequeno: as Evidências são conferidas contra estes arquivos.
export const ARQUIVOS: Record<string, string> = {
  'src/rotas/pedidos.ts': [
    "import { criarPedido } from '../servicos/pedidos';",
    '',
    'export function rotaPedidos(app) {',
    "  app.post('/orders', async (req, res) => {",
    '    const pedido = await criarPedido(req.body);',
    '    res.json(pedido);',
    '  });',
    '}',
    '',
  ].join('\n'),
  'src/servicos/pedidos.ts': [
    "import { db } from '../db';",
    '',
    'export async function criarPedido(dados) {',
    "  return db.insert('pedidos', dados);",
    '}',
    '',
  ].join('\n'),
  'src/db.ts': 'export const db = { insert: (t, d) => ({ t, d }) };\n',
  'web/App.tsx': "export function App() {\n  return fetch('/orders');\n}\n",
};

export const repositorios = nomearRepositorios(['/home/a/loja']);
export const arquivos = arquivosDoProjeto(repositorios, {
  loja: Object.keys(ARQUIVOS).join('\0'),
});

export const ev = (
  linha_inicio: number,
  linha_fim: number,
  trecho: string,
  caminho = 'src/rotas/pedidos.ts',
) => ({
  caminho,
  linha_inicio,
  linha_fim,
  trecho,
});

export const multipla = (n: number, dificuldade = 2) => ({
  formato: 'multipla_escolha',
  enunciado: `Qual rota cria o pedido? (${n})`,
  dificuldade,
  opcoes: [
    { id: 'a', texto: 'POST /orders' },
    { id: 'b', texto: 'GET /orders' },
    { id: 'c', texto: 'PUT /orders' },
  ],
  gabarito: ['a'],
  explicacao: 'A rota registra app.post.',
  evidencias: [ev(4, 4, "app.post('/orders', async (req, res) => {")],
});

export const apontar = (n: number, simbolo = 'criarPedido') => ({
  formato: 'apontar',
  enunciado: `Onde o pedido é gravado? (${n})`,
  dificuldade: 3,
  opcoes: [
    { id: 'a', caminho: 'src/servicos/pedidos.ts', simbolo },
    { id: 'b', caminho: 'src/db.ts', simbolo: 'db' },
    { id: 'c', caminho: './src/rotas/pedidos.ts', simbolo: 'rotaPedidos' },
  ],
  gabarito: ['a'],
  explicacao: 'O serviço chama db.insert.',
  evidencias: [
    ev(
      3,
      5,
      "export async function criarPedido(dados) {\n  return db.insert('pedidos', dados);\n}",
      'src/servicos/pedidos.ts',
    ),
  ],
});

export const fluxo = (n: number, regiao: string | null = null) => ({
  formato: 'tracar_fluxo',
  enunciado: `Ordene o caminho do pedido. (${n})`,
  dificuldade: 4,
  opcoes: [
    { id: 'p2', texto: 'O serviço cria o pedido', regiao_id: regiao, ligacao: 'dependencia' },
    { id: 'p1', texto: 'A rota recebe o POST', regiao_id: 'r-rotas' },
    { id: 'p3', texto: 'O banco grava', regiao_id: null, ligacao: 'consulta' },
  ],
  gabarito: ['p1', 'p2', 'p3'],
  explicacao: 'Rota → serviço → banco.',
  evidencias: [ev(5, 5, 'const pedido = await criarPedido(req.body);')],
});

export const ligacaoNova = {
  tipo: 'dependencia',
  descricao: 'A rota chama o serviço de pedidos',
  destino: {
    nova: {
      nome: 'Serviço de pedidos',
      resumo: 'Grava pedidos.',
      territorio_id: 't-api',
      arquivos_semente: ['src/servicos/pedidos.ts'],
    },
  },
  evidencias: [ev(1, 1, "import { criarPedido } from '../servicos/pedidos';")],
};
export const ligacaoTela = {
  tipo: 'chamada',
  descricao: 'A tela chama POST /orders',
  destino: { regiao_id: 'r-tela' },
  evidencias: [ev(2, 2, "return fetch('/orders');", 'web/App.tsx')],
};

/** Um Mestre de mentira: devolve as respostas na ordem e guarda os pedidos. */
export function falso(...respostas: unknown[]) {
  const pedidos: PedidoAoMestre[] = [];
  const transporte = async (pedido: PedidoAoMestre) => {
    pedidos.push(pedido);
    const r = respostas[Math.min(pedidos.length - 1, respostas.length - 1)];
    return typeof r === 'string' ? r : JSON.stringify(r);
  };
  const contexto = (k: number) =>
    JSON.parse(pedidos[k]!.prompt.split('Context (JSON):\n')[1]!) as EntradaPrepararExpedicao;
  return { transporte, pedidos, contexto };
}

export const lerArquivo = async (caminho: string) => ARQUIVOS[caminho];
