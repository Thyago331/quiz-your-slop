// O mapa da Taverna do Slop (docs/prototipos/taverna-do-slop-esboco.md), no formato do contrato.
// Os textos estão em português; en e es ficam em traducoes.ts, pelo id (mapaNoIdioma).
// As Evidências apontam para linhas reais de codigo/: mudar o código da Taverna as invalida.
import type { Classe, Ligacao, RegiaoConhecida, RegiaoNova } from '@quiz/jogo';

export type TerritorioTaverna = {
  id: string;
  nome: string;
  resumo: string;
  raizes: string[];
};

/** Região do Tutorial: já detalhada (arquivos completos) e sem estado — o estado é da Aventura. */
export type RegiaoTaverna = Omit<RegiaoConhecida, 'estado'> & Pick<RegiaoNova, 'arquivos_semente'>;

/** Ligação do contrato, com id e a Região de origem; no Tutorial o destino é sempre conhecido. */
export type LigacaoTaverna = Ligacao & {
  id: string;
  origem: { regiao_id: string };
  destino: { regiao_id: string };
};

export const TERRITORIOS: readonly TerritorioTaverna[] = [
  {
    id: 'salao',
    nome: 'Salão',
    resumo: 'O site onde o cliente vê o cardápio, monta o pedido e paga.',
    raizes: ['web/'],
  },
  {
    id: 'balcao',
    nome: 'Balcão',
    resumo: 'A API que recebe os pedidos, cobra e avisa a cozinha.',
    raizes: ['api/', 'shared/'],
  },
  {
    id: 'adega',
    nome: 'Adega',
    resumo: 'O banco de dados com o cardápio e os pedidos.',
    raizes: ['db/'],
  },
  {
    id: 'cozinha',
    nome: 'Cozinha',
    resumo: 'O worker que recebe os pedidos pagos e prepara os pratos.',
    raizes: ['kitchen/'],
  },
];

export const REGIOES: readonly RegiaoTaverna[] = [
  {
    id: 'cardapio',
    nome: 'Cardápio',
    resumo: 'A primeira tela: lista os itens com preço e filtra por categoria.',
    territorio_id: 'salao',
    arquivos_semente: ['web/src/pages/Menu.tsx', 'web/src/api/items.ts'],
    arquivos: [
      'web/index.html',
      'web/package.json',
      'web/src/App.tsx',
      'web/src/api/client.ts',
      'web/src/api/items.ts',
      'web/src/components/CategoryFilter.tsx',
      'web/src/components/ItemCard.tsx',
      'web/src/main.tsx',
      'web/src/pages/Menu.tsx',
      'web/src/styles.css',
      'web/vite.config.ts',
    ],
  },
  {
    id: 'carrinho-checkout',
    nome: 'Carrinho e Checkout',
    resumo: 'Guarda o que o cliente escolheu, mostra o total e envia o pedido ao clicar em Pagar.',
    territorio_id: 'salao',
    arquivos_semente: ['web/src/cart/useCart.ts', 'web/src/pages/Checkout.tsx'],
    arquivos: [
      'web/src/cart/CartContext.tsx',
      'web/src/cart/useCart.ts',
      'web/src/components/CartBadge.tsx',
      'web/src/pages/Checkout.tsx',
    ],
  },
  {
    id: 'api-pedidos',
    nome: 'API de Pedidos',
    resumo:
      'As rotas GET /items e POST /orders: valida o pedido, calcula o total, cobra e registra.',
    territorio_id: 'balcao',
    arquivos_semente: ['api/src/routes/orders.ts', 'api/src/orders/service.ts'],
    arquivos: [
      'api/package.json',
      'api/src/config.ts',
      'api/src/events/publisher.ts',
      'api/src/http/errors.ts',
      'api/src/http/router.ts',
      'api/src/orders/coupons.ts',
      'api/src/orders/service.ts',
      'api/src/routes/items.ts',
      'api/src/routes/orders.ts',
      'api/src/server.ts',
    ],
  },
  {
    id: 'cofre-anao',
    nome: 'Cofre do Anão',
    resumo: 'Um pagamento de mentira: aprova ou recusa a cobrança por regras fixas.',
    territorio_id: 'balcao',
    arquivos_semente: ['api/src/payments/dwarfVault.ts'],
    arquivos: ['api/src/payments/dwarfVault.ts'],
  },
  {
    id: 'grimorio',
    nome: 'Grimório',
    resumo: 'Tipos e formatação de moeda usados pelo site, pela API e pela cozinha.',
    territorio_id: 'balcao',
    arquivos_semente: ['shared/money.ts', 'shared/types.ts'],
    arquivos: ['shared/money.ts', 'shared/package.json', 'shared/types.ts'],
  },
  {
    id: 'livro-registros',
    nome: 'Livro de Registros',
    resumo: 'As tabelas de itens e pedidos e as consultas que as leem e escrevem.',
    territorio_id: 'adega',
    arquivos_semente: ['db/schema.sql', 'api/src/db/ordersRepo.ts'],
    arquivos: [
      'api/src/db/itemsRepo.ts',
      'api/src/db/ordersRepo.ts',
      'api/src/db/pool.ts',
      'db/schema.sql',
      'db/seed.sql',
    ],
  },
  {
    id: 'fogao',
    nome: 'Fogão',
    resumo: 'O worker que ouve os pedidos pagos, prepara os pratos e atualiza o status.',
    territorio_id: 'cozinha',
    arquivos_semente: ['kitchen/src/worker.ts', 'kitchen/src/queue.ts'],
    arquivos: [
      'kitchen/package.json',
      'kitchen/src/db.ts',
      'kitchen/src/queue.ts',
      'kitchen/src/recipes.ts',
      'kitchen/src/tickets.ts',
      'kitchen/src/worker.ts',
    ],
  },
];

// Uma Ligação por par de Regiões, como no esboço. A linha "Cardápio, Carrinho e Checkout, API de
// Pedidos → Grimório" do esboço vira três Ligações. Menu usar useCart vira a Ligação
// Cardápio → Carrinho e Checkout (dá vizinha ao Frontend dentro do Salão). Imports só de tipo do
// Grimório e Checkout reusar API_URL do cliente HTTP não contam como Ligação.
export const LIGACOES: readonly LigacaoTaverna[] = [
  {
    id: 'cardapio-api-pedidos',
    origem: { regiao_id: 'cardapio' },
    destino: { regiao_id: 'api-pedidos' },
    tipo: 'chamada',
    descricao: 'GET /items traz o cardápio',
    evidencias: [
      {
        caminho: 'web/src/api/items.ts',
        linha_inicio: 4,
        linha_fim: 7,
        trecho:
          'export async function fetchItems(): Promise<Item[]> {\n' +
          "  const { items } = await getJson<{ items: Item[] }>('/items');\n" +
          '  return items;\n' +
          '}',
      },
      {
        caminho: 'api/src/server.ts',
        linha_inicio: 9,
        linha_fim: 9,
        trecho: "router.get('/items', listItemsHandler);",
      },
    ],
  },
  {
    id: 'cardapio-carrinho-checkout',
    origem: { regiao_id: 'cardapio' },
    destino: { regiao_id: 'carrinho-checkout' },
    tipo: 'dependencia',
    descricao: 'O Cardápio põe itens no carrinho com useCart',
    evidencias: [
      {
        caminho: 'web/src/pages/Menu.tsx',
        linha_inicio: 4,
        linha_fim: 4,
        trecho: "import { useCart } from '../cart/useCart';",
      },
    ],
  },
  {
    id: 'carrinho-checkout-api-pedidos',
    origem: { regiao_id: 'carrinho-checkout' },
    destino: { regiao_id: 'api-pedidos' },
    tipo: 'chamada',
    descricao: 'POST /orders cria o pedido quando o cliente clica em Pagar',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 42,
        linha_fim: 46,
        trecho:
          '      const res = await fetch(`${API_URL}/orders`, {\n' +
          "        method: 'POST',\n" +
          "        headers: { 'Content-Type': 'application/json' },\n" +
          '        body: JSON.stringify(body),\n' +
          '      });',
      },
      {
        caminho: 'api/src/server.ts',
        linha_inicio: 10,
        linha_fim: 10,
        trecho: "router.post('/orders', createOrderHandler);",
      },
    ],
  },
  {
    id: 'api-pedidos-cofre-anao',
    origem: { regiao_id: 'api-pedidos' },
    destino: { regiao_id: 'cofre-anao' },
    tipo: 'dependencia',
    descricao: 'A API importa charge() para cobrar o pedido',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 7,
        linha_fim: 7,
        trecho: "import { charge, VaultDeclinedError } from '../payments/dwarfVault';",
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 52,
        linha_fim: 57,
        trecho:
          '    return await charge({\n' +
          '      orderRef: order.id,\n' +
          '      payer: order.customerName,\n' +
          '      amount: order.total,\n' +
          '      memo: `Taverna do Slop order ${order.id} (${formatGold(order.total)})`,\n' +
          '    });',
      },
    ],
  },
  {
    id: 'api-pedidos-livro-registros',
    origem: { regiao_id: 'api-pedidos' },
    destino: { regiao_id: 'livro-registros' },
    tipo: 'consulta',
    descricao: 'INSERT INTO orders grava o pedido já pago',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 80,
        linha_fim: 80,
        trecho: "  const saved = await insertOrder({ ...order, status: 'paid' });",
      },
      {
        caminho: 'api/src/db/ordersRepo.ts',
        linha_inicio: 27,
        linha_fim: 29,
        trecho:
          '      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)\n' +
          '       VALUES ($1, $2, $3, $4, $5, $6)\n' +
          '       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,',
      },
    ],
  },
  {
    id: 'api-pedidos-fogao',
    origem: { regiao_id: 'api-pedidos' },
    destino: { regiao_id: 'fogao' },
    tipo: 'evento',
    descricao: 'A API publica order.paid e a cozinha recebe',
    evidencias: [
      {
        caminho: 'api/src/events/publisher.ts',
        linha_inicio: 12,
        linha_fim: 12,
        trecho:
          '  const receivers = await redis.publish(ORDER_PAID_CHANNEL, JSON.stringify(event));',
      },
      {
        caminho: 'kitchen/src/queue.ts',
        linha_inicio: 11,
        linha_fim: 11,
        trecho: '  await subscriber.subscribe(ORDER_PAID_CHANNEL);',
      },
    ],
  },
  {
    id: 'fogao-livro-registros',
    origem: { regiao_id: 'fogao' },
    destino: { regiao_id: 'livro-registros' },
    tipo: 'consulta',
    descricao: 'UPDATE orders SET status muda o pedido para "cooking" e depois "ready"',
    evidencias: [
      {
        caminho: 'kitchen/src/worker.ts',
        linha_inicio: 7,
        linha_fim: 12,
        trecho:
          'async function setStatus(orderId: string, status: OrderStatus): Promise<void> {\n' +
          "  await db.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [\n" +
          '    status,\n' +
          '    orderId,\n' +
          '  ]);\n' +
          '}',
      },
    ],
  },
  {
    id: 'cardapio-grimorio',
    origem: { regiao_id: 'cardapio' },
    destino: { regiao_id: 'grimorio' },
    tipo: 'dependencia',
    descricao: 'O cardápio usa formatGold para mostrar os preços',
    evidencias: [
      {
        caminho: 'web/src/components/ItemCard.tsx',
        linha_inicio: 1,
        linha_fim: 1,
        trecho: "import { formatGold } from '@taverna/shared/money';",
      },
    ],
  },
  {
    id: 'carrinho-checkout-grimorio',
    origem: { regiao_id: 'carrinho-checkout' },
    destino: { regiao_id: 'grimorio' },
    tipo: 'dependencia',
    descricao: 'O checkout usa formatGold para mostrar o total',
    evidencias: [
      {
        caminho: 'web/src/pages/Checkout.tsx',
        linha_inicio: 1,
        linha_fim: 1,
        trecho: "import { formatGold } from '@taverna/shared/money';",
      },
    ],
  },
  {
    id: 'api-pedidos-grimorio',
    origem: { regiao_id: 'api-pedidos' },
    destino: { regiao_id: 'grimorio' },
    tipo: 'dependencia',
    descricao: 'A API usa formatGold e o imposto do rei do Grimório',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 1,
        linha_fim: 1,
        trecho: "import { formatGold, KINGS_TAX_RATE, sumLines } from '@taverna/shared/money';",
      },
    ],
  },
];

export const ENTRADAS: Readonly<Record<Classe, string>> = {
  frontend: 'cardapio',
  backend: 'api-pedidos',
  fullstack: 'carrinho-checkout',
};
