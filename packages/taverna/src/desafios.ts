// Banco de Desafios do Tutorial, escritos à mão no formato `Desafio` do contrato (spec §9).
// Como o mapa, os textos estão em português e concentrados aqui para a tradução vir depois; os
// trechos das Evidências são cópia exata de codigo/ (o teste confere).
// Por enquanto só a API de Pedidos e o Cofre do Anão têm Desafios; as outras regiões chegam nos
// próximos passos do Tutorial. Nos de Traçar o fluxo, as opções vêm fora de ordem: é a ordem em que aparecem na tela.
import type { Anulacao, Desafio } from '@quiz/jogo';

/**
 * Desafio do Tutorial: sempre com id, para a Aventura lembrar quais o Jogador já viu. A isca traz
 * o texto que a anula quando o Jogador a contesta (Contestação roteirizada, sem Mestre).
 */
export type DesafioTaverna = Desafio & { id: string; anulacao?: Anulacao };

const API_DE_PEDIDOS: readonly DesafioTaverna[] = [
  {
    id: 'api-pedidos-rota-post-orders',
    formato: 'multipla_escolha',
    enunciado: 'Quando o Checkout chama `POST /orders`, qual handler da API recebe a chamada?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '`listItemsHandler`' },
      { id: 'b', texto: '`createOrderHandler`' },
      { id: 'c', texto: '`getOrderHandler`' },
      { id: 'd', texto: '`chargeOrder`' },
    ],
    gabarito: ['b'],
    explicacao:
      'O `server.ts` registra as rotas no `Router`: `POST /orders` vai para `createOrderHandler`, ' +
      'que confere o formato do corpo com `parseCreateOrder` e passa o pedido para `createOrder()`.',
    evidencias: [
      {
        caminho: 'api/src/server.ts',
        linha_inicio: 9,
        linha_fim: 11,
        trecho:
          "router.get('/items', listItemsHandler);\n" +
          "router.post('/orders', createOrderHandler);\n" +
          "router.get('/orders/:id', getOrderHandler);",
      },
    ],
  },
  {
    id: 'api-pedidos-quantidade-maxima',
    formato: 'multipla_escolha',
    enunciado: 'Um pedido traz uma linha com 25 canecas do mesmo item. O que a API responde?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: '201: cobra as 25 canecas normalmente' },
      { id: 'b', texto: '409: o item saiu do cardápio' },
      { id: 'c', texto: '400: quantidade inválida, antes de qualquer cobrança' },
      { id: 'd', texto: '402: o Cofre do Anão recusa a cobrança' },
    ],
    gabarito: ['c'],
    explicacao:
      'Cada linha aceita de 1 a `MAX_PER_LINE` (20) unidades. Acima disso, `validateOrder()` lança ' +
      '`badRequest` — um 400 — e o pedido nem chega ao Cofre do Anão.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 9,
        linha_fim: 9,
        trecho: 'const MAX_PER_LINE = 20;',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 23,
        linha_fim: 27,
        trecho:
          '  for (const line of order.lines) {\n' +
          '    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_PER_LINE) {\n' +
          '      throw badRequest(`Invalid quantity for item ${line.itemId}`);\n' +
          '    }\n' +
          '  }',
      },
    ],
  },
  {
    id: 'api-pedidos-validate-order-muta',
    formato: 'multipla_escolha',
    enunciado:
      'O nome e o comentário dizem que `validateOrder()` só confere o pedido. O que mais ela faz?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'Nada além de conferir: devolve `void` e só lança erro 400' },
      { id: 'b', texto: 'Cobra o pedido no Cofre do Anão' },
      { id: 'c', texto: 'Aplica o cupom do festival' },
      { id: 'd', texto: 'Calcula o imposto do rei e o total, alterando o próprio pedido' },
    ],
    gabarito: ['d'],
    explicacao:
      'Nome enganoso: depois das checagens, `validateOrder()` escreve `order.tax` e `order.total` ' +
      'no objeto que recebeu. Quem lê só a assinatura acha que nada muda — e `createOrder()` ' +
      'depende desse efeito colateral para cobrar o valor certo.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 14,
        linha_fim: 18,
        trecho:
          '/**\n' +
          ' * Checks that the order can be served before any gold changes hands.\n' +
          " * Throws a 400 when it can't.\n" +
          ' */\n' +
          'export function validateOrder(order: DraftOrder): void {',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 29,
        linha_fim: 30,
        trecho:
          '  order.tax = order.subtotal * KINGS_TAX_RATE;\n' +
          '  order.total = order.subtotal + order.tax;',
      },
    ],
  },
  {
    id: 'api-pedidos-cobra-antes-de-gravar',
    formato: 'multipla_escolha',
    enunciado: 'Em que ordem `createOrder()` cobra e grava o pedido?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'Cobra no Cofre do Anão e só depois grava o pedido, já como `paid`' },
      { id: 'b', texto: 'Grava como `pending`, cobra e depois muda para `paid`' },
      { id: 'c', texto: 'Grava e publica `order.paid`; quem cobra é a cozinha' },
      { id: 'd', texto: 'Cobra e grava juntos, numa transação do banco' },
    ],
    gabarito: ['a'],
    explicacao:
      '`chargeOrder()` vem antes de `insertOrder()`, que já grava `status: "paid"`. Não existe ' +
      'pedido `pending` no banco: se a gravação falhar depois da cobrança, o cliente pagou por um ' +
      'pedido que ninguém registrou.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 77,
        linha_fim: 80,
        trecho:
          '  const receipt = await chargeOrder(order);\n' +
          '  console.log(`Vault receipt ${receipt.receiptId} for order ${order.id}`);\n' +
          '\n' +
          "  const saved = await insertOrder({ ...order, status: 'paid' });",
      },
    ],
  },
  {
    id: 'api-pedidos-ninguem-ouve',
    formato: 'multipla_escolha',
    enunciado: 'A API publica `order.paid`, mas ninguém na cozinha está ouvindo. O que acontece?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: 'A API devolve 500 e desfaz a cobrança' },
      { id: 'b', texto: 'Só um aviso no log: o pedido continua pago e o cliente recebe 201' },
      { id: 'c', texto: 'O Redis guarda o evento até a cozinha voltar' },
      { id: 'd', texto: 'A API tenta publicar de novo até alguém ouvir' },
    ],
    gabarito: ['b'],
    explicacao:
      '`redis.publish` devolve quantos ouvintes receberam a mensagem. Com zero, `publishOrderPaid` ' +
      'só faz `console.warn` e segue: o pedido fica pago e gravado, mas nenhum prato é preparado. ' +
      'Publicar num canal não guarda a mensagem para depois.',
    evidencias: [
      {
        caminho: 'api/src/events/publisher.ts',
        linha_inicio: 10,
        linha_fim: 16,
        trecho:
          'export async function publishOrderPaid(event: OrderPaidEvent): Promise<void> {\n' +
          "  if (redis.status === 'wait') await redis.connect();\n" +
          '  const receivers = await redis.publish(ORDER_PAID_CHANNEL, JSON.stringify(event));\n' +
          '  if (receivers === 0) {\n' +
          '    console.warn(`Nobody in the kitchen heard order ${event.orderId}`);\n' +
          '  }\n' +
          '}',
      },
    ],
  },
  {
    id: 'api-pedidos-cupom-morto',
    formato: 'multipla_escolha',
    enunciado: 'Quem chama `applyCoupon()` quando um pedido chega em `POST /orders`?',
    dificuldade: 4,
    opcoes: [
      { id: 'a', texto: '`createOrderHandler`, quando o corpo traz um cupom' },
      { id: 'b', texto: '`validateOrder()`, antes de calcular o imposto' },
      { id: 'c', texto: '`createOrder()`, logo depois de `priceLines()`' },
      { id: 'd', texto: 'Ninguém: é código morto, esperando o TODO ser cumprido' },
    ],
    gabarito: ['d'],
    explicacao:
      'Código morto: `applyCoupon()` está exportada, mas nenhum arquivo a importa. `createOrder()` ' +
      'vai de `priceLines()` direto para `validateOrder()` e `chargeOrder()`. O TODO pedia para ' +
      'remover depois do festival — e os cupons venceram em 2024.',
    evidencias: [
      {
        caminho: 'api/src/orders/coupons.ts',
        linha_inicio: 22,
        linha_fim: 23,
        trecho:
          '// TODO: remove after the tavern festival\n' +
          'export function applyCoupon(order: DraftOrder, code: string, now = new Date()): DraftOrder {',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 64,
        linha_fim: 77,
        trecho:
          'export async function createOrder(request: CreateOrderRequest): Promise<Order> {\n' +
          '  const lines = await priceLines(request);\n' +
          '  const order: DraftOrder = {\n' +
          '    id: request.orderRef,\n' +
          '    customerName: request.customerName,\n' +
          '    lines,\n' +
          '    subtotal: sumLines(lines),\n' +
          '    tax: 0,\n' +
          '    total: 0,\n' +
          '  };\n' +
          '\n' +
          '  validateOrder(order);\n' +
          '\n' +
          '  const receipt = await chargeOrder(order);',
      },
    ],
  },
  {
    id: 'api-pedidos-total-sem-arredondar',
    formato: 'multipla_escolha',
    enunciado:
      'O imposto do rei é de 8% (`KINGS_TAX_RATE = 0.08`). Por um pedido de 10 de ouro, quanto a ' +
      'API cobra no Cofre do Anão?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: '11 de ouro: arredonda para cima, sem cobre solto' },
      { id: 'b', texto: '10 de ouro: o imposto só aparece na tela' },
      { id: 'c', texto: '10,8 de ouro: a API não arredonda' },
      { id: 'd', texto: '10,08 de ouro: o imposto incide sobre o cobre' },
    ],
    gabarito: ['c'],
    explicacao:
      'A API soma subtotal e imposto e cobra `order.total` sem arredondar: 10,8 de ouro. Guarde ' +
      'esse número — do outro lado da Ligação com o Carrinho, o total é calculado de novo, e de ' +
      'outro jeito. Regra duplicada é slop que nasce quando cada lado é escrito separado.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 29,
        linha_fim: 30,
        trecho:
          '  order.tax = order.subtotal * KINGS_TAX_RATE;\n' +
          '  order.total = order.subtotal + order.tax;',
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
    id: 'api-pedidos-onde-publica',
    formato: 'apontar',
    enunciado: 'Em qual função a API publica o evento `order.paid` para a cozinha?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'api/src/orders/service.ts', simbolo: 'createOrder' },
      { id: 'b', caminho: 'api/src/routes/orders.ts', simbolo: 'createOrderHandler' },
      { id: 'c', caminho: 'api/src/events/publisher.ts', simbolo: 'publishOrderPaid' },
      { id: 'd', caminho: 'api/src/server.ts', simbolo: 'router' },
    ],
    gabarito: ['c'],
    explicacao:
      '`createOrder()` só chama; quem fala com o Redis é `publishOrderPaid()`, no `publisher.ts`: ' +
      'ela publica o evento no canal `order.paid` e confere quantos ouviram.',
    evidencias: [
      {
        caminho: 'api/src/events/publisher.ts',
        linha_inicio: 10,
        linha_fim: 12,
        trecho:
          'export async function publishOrderPaid(event: OrderPaidEvent): Promise<void> {\n' +
          "  if (redis.status === 'wait') await redis.connect();\n" +
          '  const receivers = await redis.publish(ORDER_PAID_CHANNEL, JSON.stringify(event));',
      },
    ],
  },
  {
    id: 'api-pedidos-imposto-do-rei',
    formato: 'apontar',
    enunciado: 'Em qual função o "imposto do rei" é aplicado?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'api/src/routes/orders.ts', simbolo: 'createOrderHandler' },
      { id: 'b', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
      { id: 'c', caminho: 'api/src/orders/coupons.ts', simbolo: 'applyCoupon' },
      { id: 'd', caminho: 'shared/money.ts', simbolo: 'formatGold' },
    ],
    gabarito: ['b'],
    explicacao:
      'Apesar do nome, `validateOrder()` não só confere: no fim ela calcula `order.tax` com ' +
      '`KINGS_TAX_RATE` e escreve o total no próprio pedido. Nome enganoso — leia o corpo, não a ' +
      'assinatura.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 18,
        linha_fim: 18,
        trecho: 'export function validateOrder(order: DraftOrder): void {',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 29,
        linha_fim: 30,
        trecho:
          '  order.tax = order.subtotal * KINGS_TAX_RATE;\n' +
          '  order.total = order.subtotal + order.tax;',
      },
    ],
  },
  {
    id: 'api-pedidos-onde-nasce-o-400',
    formato: 'apontar',
    enunciado:
      'Aponte uma função que recusa um pedido malformado com 400, antes de qualquer cobrança.',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'api/src/events/publisher.ts', simbolo: 'publishOrderPaid' },
      { id: 'b', caminho: 'api/src/routes/orders.ts', simbolo: 'parseCreateOrder' },
      { id: 'c', caminho: 'api/src/orders/coupons.ts', simbolo: 'findCoupon' },
      { id: 'd', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
    ],
    gabarito: ['b', 'd'],
    explicacao:
      'Duas respostas valem: `parseCreateOrder` recusa corpo sem `orderRef`, `customerName` ou ' +
      '`lines`; `validateOrder()` recusa nome vazio, pedido vazio e quantidade fora de 1–20. As ' +
      'duas lançam `badRequest` antes de `chargeOrder()`.',
    evidencias: [
      {
        caminho: 'api/src/routes/orders.ts',
        linha_inicio: 7,
        linha_fim: 12,
        trecho:
          'function parseCreateOrder(body: unknown): CreateOrderRequest {\n' +
          "  if (typeof body !== 'object' || body === null) {\n" +
          "    throw badRequest('Expected a JSON object');\n" +
          '  }\n' +
          '  const { orderRef, customerName, lines } = body as Record<string, unknown>;\n' +
          "  if (typeof orderRef !== 'string' || orderRef.length === 0) {",
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 18,
        linha_fim: 22,
        trecho:
          'export function validateOrder(order: DraftOrder): void {\n' +
          '  if (order.customerName.trim().length === 0) {\n' +
          "    throw badRequest('Every order needs a name to call out');\n" +
          '  }\n' +
          "  if (order.lines.length === 0) throw badRequest('The order is empty');",
      },
    ],
  },
  {
    id: 'api-pedidos-fluxo-post-orders',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que acontece depois que `POST /orders` chega à API:',
    dificuldade: 4,
    opcoes: [
      {
        id: 'cobra',
        texto: '`chargeOrder()` cobra o total do pedido',
        regiao_id: 'api-pedidos',
      },
      {
        id: 'publica',
        texto: 'A cozinha recebe o evento `order.paid`',
        regiao_id: 'fogao',
        ligacao: 'evento',
      },
      {
        id: 'recebe',
        texto: '`createOrderHandler` recebe o pedido e confere o corpo',
        regiao_id: 'api-pedidos',
      },
      {
        id: 'grava',
        texto: '`INSERT INTO orders` grava o pedido como `paid`',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
      {
        id: 'imposto',
        texto: '`validateOrder()` aplica o imposto do rei',
        regiao_id: 'api-pedidos',
      },
    ],
    gabarito: ['recebe', 'imposto', 'cobra', 'grava', 'publica'],
    explicacao:
      'O handler confere o corpo e chama `createOrder()`, que valida (e aplica o imposto), cobra, ' +
      'grava o pedido já pago e só então publica o evento. Os dois últimos passos saem da região ' +
      'por uma Consulta e por um Evento: revele a API de Pedidos para ver aonde eles vão.',
    evidencias: [
      {
        caminho: 'api/src/routes/orders.ts',
        linha_inicio: 32,
        linha_fim: 34,
        trecho:
          'export const createOrderHandler: Handler = async (req) => {\n' +
          '  const request = parseCreateOrder(req.body);\n' +
          '  const order = await createOrder(request);',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 75,
        linha_fim: 82,
        trecho:
          '  validateOrder(order);\n' +
          '\n' +
          '  const receipt = await chargeOrder(order);\n' +
          '  console.log(`Vault receipt ${receipt.receiptId} for order ${order.id}`);\n' +
          '\n' +
          "  const saved = await insertOrder({ ...order, status: 'paid' });\n" +
          '\n' +
          '  await publishOrderPaid({',
      },
    ],
  },
  {
    id: 'api-pedidos-fluxo-antes-de-cobrar',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que `createOrder()` faz com o pedido antes de cobrar:',
    dificuldade: 5,
    opcoes: [
      {
        id: 'valida',
        texto: '`validateOrder()` confere as quantidades e calcula o total',
        regiao_id: 'api-pedidos',
      },
      {
        id: 'soma',
        texto: '`sumLines()`, do Grimório, soma o subtotal',
        regiao_id: 'grimorio',
        ligacao: 'dependencia',
      },
      {
        id: 'busca',
        texto: '`findItemsByIds()` busca no banco os itens e seus preços',
        regiao_id: 'livro-registros',
        ligacao: 'consulta',
      },
      {
        id: 'cobra',
        texto: '`chargeOrder()` cobra o total',
        regiao_id: 'api-pedidos',
      },
      {
        id: 'confere',
        texto: '`priceLines()` recusa item desconhecido ou fora do cardápio',
        regiao_id: 'api-pedidos',
      },
    ],
    gabarito: ['busca', 'confere', 'soma', 'valida', 'cobra'],
    explicacao:
      '`priceLines()` primeiro busca os itens no banco e só depois confere cada linha (400 para ' +
      'item desconhecido, 409 para fora do cardápio). Com as linhas prontas, o subtotal sai de ' +
      '`sumLines()`; `validateOrder()` vem depois e escreve o total que `chargeOrder()` cobra.',
    evidencias: [
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 33,
        linha_fim: 36,
        trecho:
          'async function priceLines(request: CreateOrderRequest): Promise<OrderLine[]> {\n' +
          '  const ids = request.lines.map((line) => line.itemId);\n' +
          '  const items = await findItemsByIds(ids);\n' +
          '  const byId = new Map(items.map((item) => [item.id, item]));',
      },
      {
        caminho: 'api/src/orders/service.ts',
        linha_inicio: 64,
        linha_fim: 77,
        trecho:
          'export async function createOrder(request: CreateOrderRequest): Promise<Order> {\n' +
          '  const lines = await priceLines(request);\n' +
          '  const order: DraftOrder = {\n' +
          '    id: request.orderRef,\n' +
          '    customerName: request.customerName,\n' +
          '    lines,\n' +
          '    subtotal: sumLines(lines),\n' +
          '    tax: 0,\n' +
          '    total: 0,\n' +
          '  };\n' +
          '\n' +
          '  validateOrder(order);\n' +
          '\n' +
          '  const receipt = await chargeOrder(order);',
      },
    ],
  },
];

// O Cofre do Anão é um arquivo só: todas as Evidências moram em dwarfVault.ts. A isca (gabarito
// errado de propósito) se apoia no comentário mentiroso da linha 3.
const COFRE_DO_ANAO: readonly DesafioTaverna[] = [
  {
    id: 'cofre-limite',
    formato: 'multipla_escolha',
    enunciado: 'Qual é o maior valor que o Cofre do Anão aprova numa cobrança?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '100 de ouro' },
      { id: 'b', texto: '500 de ouro' },
      { id: 'c', texto: 'Não há limite: o Cofre aprova qualquer valor' },
      { id: 'd', texto: '20 de ouro, o mesmo limite de unidades por linha' },
    ],
    gabarito: ['b'],
    explicacao:
      '`charge()` recusa com `over_the_vault_limit` tudo acima de `VAULT_LIMIT`, que vale 500. ' +
      'Exatamente 500 ainda passa: a comparação é `>`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 8,
        linha_fim: 10,
        trecho:
          '  if (request.amount > VAULT_LIMIT) {\n' +
          "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
          '  }',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 50,
        linha_fim: 50,
        trecho: 'const VAULT_LIMIT = 500;',
      },
    ],
  },
  {
    id: 'cofre-onde-banidos',
    formato: 'apontar',
    enunciado: 'Onde fica a lista de quem está proibido de pagar na taverna?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VAULT_LIMIT' },
      { id: 'b', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'BANNED_PAYERS' },
      { id: 'c', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
      { id: 'd', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ledger' },
    ],
    gabarito: ['b'],
    explicacao:
      'A lista mora no próprio Cofre, em `BANNED_PAYERS`: o Rei Goblin e o Dragão. A API não ' +
      'confere nada disso — quem recusa é `charge()`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 52,
        linha_fim: 52,
        trecho: "const BANNED_PAYERS = ['goblin king', 'the dragon'];",
      },
    ],
  },
  {
    id: 'cofre-dragao-disfarcado',
    formato: 'multipla_escolha',
    enunciado:
      'O cliente se apresenta como `"  The Dragon "`, com espaços e maiúsculas. O Cofre aprova?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'Aprova: o nome não é igual a nenhum da lista' },
      { id: 'b', texto: 'Recusa com `payer_banned_from_the_tavern`' },
      { id: 'c', texto: 'Recusa com `amount_must_be_positive`' },
      { id: 'd', texto: 'A API recusa antes, com 400, por causa dos espaços' },
    ],
    gabarito: ['b'],
    explicacao:
      'Antes de comparar, `charge()` faz `trim()` e `toLowerCase()` no pagador: `"  The Dragon "` ' +
      'vira `"the dragon"`, que está em `BANNED_PAYERS`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 11,
        linha_fim: 13,
        trecho:
          '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
          "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
          '  }',
      },
    ],
  },
  {
    id: 'cofre-pagar-duas-vezes',
    formato: 'multipla_escolha',
    enunciado: 'O que acontece se o cliente clicar em Pagar duas vezes para o mesmo pedido?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'A segunda cobrança é recusada com 409' },
      { id: 'b', texto: 'Nada — `charge()` é idempotente' },
      { id: 'c', texto: 'O pedido é cobrado duas vezes' },
      { id: 'd', texto: 'O Cofre devolve o mesmo recibo da primeira vez' },
    ],
    // Isca: o gabarito segue o comentário, e o comentário mente. Contestar anula o Desafio.
    gabarito: ['b'],
    isca: true,
    explicacao:
      'Segundo o comentário do Cofre do Anão, `charge()` é idempotente: pagar duas vezes o mesmo ' +
      'pedido nunca cobra em dobro.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 3,
        linha_fim: 3,
        trecho: '// charge() is idempotent: paying twice for the same order never double-charges',
      },
    ],
    anulacao: {
      explicacao:
        'Você tem razão: nenhuma linha de `charge()` confere se o `orderRef` já foi cobrado. Ela ' +
        'só checa valor e pagador, espera os anões contarem e faz `ledger.push` com um recibo novo ' +
        '(`randomUUID()`). Clicar duas vezes cobra duas vezes — o comentário da linha 3 mente.',
      evidencias: [
        {
          caminho: 'api/src/payments/dwarfVault.ts',
          linha_inicio: 3,
          linha_fim: 26,
          trecho:
            '// charge() is idempotent: paying twice for the same order never double-charges\n' +
            'export async function charge(request: ChargeRequest): Promise<ChargeReceipt> {\n' +
            '  if (request.amount <= 0) {\n' +
            "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
            '  }\n' +
            '  if (request.amount > VAULT_LIMIT) {\n' +
            "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
            '  }\n' +
            '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
            "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
            '  }\n' +
            '\n' +
            '  // The dwarves take their time counting coins.\n' +
            '  await sleep(VAULT_LATENCY_MS);\n' +
            '\n' +
            '  const receipt: ChargeReceipt = {\n' +
            '    receiptId: randomUUID(),\n' +
            '    orderRef: request.orderRef,\n' +
            '    amount: request.amount,\n' +
            '    chargedAt: new Date().toISOString(),\n' +
            '  };\n' +
            '  ledger.push(receipt);\n' +
            '  return receipt;\n' +
            '}',
        },
      ],
    },
  },
  {
    id: 'cofre-onde-guarda',
    formato: 'apontar',
    enunciado: 'Onde o Cofre guarda cada cobrança aprovada?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ChargeReceipt' },
      { id: 'b', caminho: 'api/src/db/ordersRepo.ts', simbolo: 'insertOrder' },
      { id: 'c', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ledger' },
      { id: 'd', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VaultDeclinedError' },
    ],
    gabarito: ['c'],
    explicacao:
      '`ChargeReceipt` é só o formato do recibo; quem guarda é `ledger`, uma lista em memória ' +
      'onde `charge()` empurra cada recibo. Reiniciou a API, o livro-caixa do Cofre some.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 54,
        linha_fim: 55,
        trecho:
          '// Every successful charge, in memory. Good enough for a fake vault.\n' +
          'const ledger: ChargeReceipt[] = [];',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 24,
        linha_fim: 24,
        trecho: '  ledger.push(receipt);',
      },
    ],
  },
  {
    id: 'cofre-fluxo-charge',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que `charge()` faz com uma cobrança que vai ser aprovada:',
    dificuldade: 4,
    opcoes: [
      { id: 'espera', texto: 'Espera os anões contarem as moedas', regiao_id: 'cofre-anao' },
      { id: 'banido', texto: 'Confere se o pagador está banido', regiao_id: 'cofre-anao' },
      { id: 'guarda', texto: 'Guarda o recibo em `ledger` e o devolve', regiao_id: 'cofre-anao' },
      { id: 'positivo', texto: 'Confere se o valor é positivo', regiao_id: 'cofre-anao' },
      { id: 'recibo', texto: 'Monta o recibo com `randomUUID()`', regiao_id: 'cofre-anao' },
      { id: 'limite', texto: 'Confere o limite do Cofre', regiao_id: 'cofre-anao' },
    ],
    gabarito: ['positivo', 'limite', 'banido', 'espera', 'recibo', 'guarda'],
    explicacao:
      'Primeiro as três recusas possíveis, da mais barata à lista de banidos; só quem passa por ' +
      'todas espera os `VAULT_LATENCY_MS` e ganha um recibo novo, guardado no `ledger`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 5,
        linha_fim: 25,
        trecho:
          '  if (request.amount <= 0) {\n' +
          "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
          '  }\n' +
          '  if (request.amount > VAULT_LIMIT) {\n' +
          "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
          '  }\n' +
          '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
          "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
          '  }\n' +
          '\n' +
          '  // The dwarves take their time counting coins.\n' +
          '  await sleep(VAULT_LATENCY_MS);\n' +
          '\n' +
          '  const receipt: ChargeReceipt = {\n' +
          '    receiptId: randomUUID(),\n' +
          '    orderRef: request.orderRef,\n' +
          '    amount: request.amount,\n' +
          '    chargedAt: new Date().toISOString(),\n' +
          '  };\n' +
          '  ledger.push(receipt);\n' +
          '  return receipt;',
      },
    ],
  },
  {
    id: 'cofre-valor-zero',
    formato: 'multipla_escolha',
    enunciado:
      'Um pedido chega ao Cofre com `amount: 0`. O que `charge()` faz, e quanto tempo leva?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: 'Aprova na hora: não há o que cobrar' },
      { id: 'b', texto: 'Espera 300 ms e então recusa com `amount_must_be_positive`' },
      { id: 'c', texto: 'Recusa na hora com `amount_must_be_positive`, sem esperar' },
      { id: 'd', texto: 'Espera 300 ms e aprova um recibo de 0 de ouro' },
    ],
    gabarito: ['c'],
    explicacao:
      'A checagem de valor é a primeira linha de `charge()` e a espera (`sleep`) só vem depois ' +
      'das recusas: um `amount` 0 lança `VaultDeclinedError` na hora — que a API transforma em 402.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 5,
        linha_fim: 7,
        trecho:
          '  if (request.amount <= 0) {\n' +
          "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
          '  }',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 15,
        linha_fim: 16,
        trecho:
          '  // The dwarves take their time counting coins.\n' + '  await sleep(VAULT_LATENCY_MS);',
      },
    ],
  },
];

/** Região → Desafios. Região sem entrada aqui ainda não tem Desafios. */
export const DESAFIOS: Readonly<Record<string, readonly DesafioTaverna[]>> = {
  'api-pedidos': API_DE_PEDIDOS,
  'cofre-anao': COFRE_DO_ANAO,
};
