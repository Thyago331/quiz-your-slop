// Banco de Desafios do Tutorial, escritos à mão no formato `Desafio` do contrato (spec §9).
// Como o mapa, os textos estão em português e concentrados aqui para a tradução vir depois; os
// trechos das Evidências são cópia exata de codigo/ (o teste confere).
// Por enquanto só a API de Pedidos tem Desafios, todos de Múltipla escolha; as outras regiões e os
// outros Formatos de Desafio chegam nos próximos passos do Tutorial.
import type { Desafio } from '@quiz/jogo';

/** Desafio do Tutorial: sempre com id, para a Aventura lembrar quais o Jogador já viu. */
export type DesafioTaverna = Desafio & { id: string };

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
];

/** Região → Desafios. Região sem entrada aqui ainda não tem Desafios. */
export const DESAFIOS: Readonly<Record<string, readonly DesafioTaverna[]>> = {
  'api-pedidos': API_DE_PEDIDOS,
};
