// Textos em inglês dos Desafios de ../api-pedidos.ts — Orders API (Counter). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const API_DE_PEDIDOS_EN: TextosDaRegiao = {
  'api-pedidos-rota-post-orders': {
    enunciado: 'When the Checkout calls `POST /orders`, which API handler receives the call?',
    opcoes: {
      a: '`listItemsHandler`',
      b: '`createOrderHandler`',
      c: '`getOrderHandler`',
      d: '`chargeOrder`',
    },
    explicacao:
      '`server.ts` registers the routes on the `Router`: `POST /orders` goes to ' +
      "`createOrderHandler`, which checks the body's shape with `parseCreateOrder` and hands " +
      'the order to `createOrder()`.',
  },
  'api-pedidos-quantidade-maxima': {
    enunciado:
      'An order comes in with a line of 25 mugs of the same item. What does the API answer?',
    opcoes: {
      a: '201: it charges for all 25 mugs as usual',
      b: '409: the item is off the menu',
      c: '400: invalid quantity, before any charge',
      d: "402: the Dwarf's Vault declines the charge",
    },
    explicacao:
      'Each line accepts from 1 to `MAX_PER_LINE` (20) units. Above that, `validateOrder()` ' +
      "throws `badRequest` — a 400 — and the order never even reaches the Dwarf's Vault.",
  },
  'api-pedidos-validate-order-muta': {
    enunciado:
      'Its name and comment say `validateOrder()` only checks the order. What else does it ' +
      'do?',
    opcoes: {
      a: 'Nothing beyond checking: it returns `void` and only throws 400s',
      b: "Charges the order at the Dwarf's Vault",
      c: 'Applies the festival coupon',
      d: "Computes the king's tax and the total, mutating the order itself",
    },
    explicacao:
      'Misleading name: after its checks, `validateOrder()` writes `order.tax` and ' +
      '`order.total` onto the object it received. Anyone reading only the signature assumes ' +
      'nothing changes — and `createOrder()` relies on that side effect to charge the right ' +
      'amount.',
  },
  'api-pedidos-cobra-antes-de-gravar': {
    enunciado: 'In what order does `createOrder()` charge and save the order?',
    opcoes: {
      a: "Charges at the Dwarf's Vault and only then saves the order, already as `paid`",
      b: 'Saves it as `pending`, charges, then switches it to `paid`',
      c: 'Saves and publishes `order.paid`; the kitchen does the charging',
      d: 'Charges and saves together, in a database transaction',
    },
    explicacao:
      '`chargeOrder()` comes before `insertOrder()`, which already writes `status: "paid"`. ' +
      "There's never a `pending` order in the database: if the save fails after the charge, " +
      'the customer has paid for an order nobody recorded.',
  },
  'api-pedidos-ninguem-ouve': {
    enunciado:
      'The API publishes `order.paid`, but nobody in the kitchen is listening. What happens?',
    opcoes: {
      a: 'The API returns a 500 and reverses the charge',
      b: 'Just a warning in the log: the order stays paid and the customer gets a 201',
      c: 'Redis holds on to the event until the kitchen comes back',
      d: 'The API keeps republishing until someone listens',
    },
    explicacao:
      '`redis.publish` returns how many listeners got the message. With zero, ' +
      '`publishOrderPaid` just does a `console.warn` and moves on: the order is paid and ' +
      "saved, but no dish gets cooked. Publishing to a channel doesn't keep the message for " +
      'later.',
  },
  'api-pedidos-cupom-morto': {
    enunciado: 'Who calls `applyCoupon()` when an order arrives at `POST /orders`?',
    opcoes: {
      a: '`createOrderHandler`, when the body carries a coupon',
      b: '`validateOrder()`, before computing the tax',
      c: '`createOrder()`, right after `priceLines()`',
      d: "Nobody: it's dead code, waiting for the TODO to be done",
    },
    explicacao:
      'Dead code: `applyCoupon()` is exported, but no file imports it. `createOrder()` goes ' +
      'from `priceLines()` straight to `validateOrder()` and `chargeOrder()`. The TODO said ' +
      'to remove it after the festival — and the coupons expired back in 2024.',
  },
  'api-pedidos-total-sem-arredondar': {
    enunciado:
      "The king's tax is 8% (`KINGS_TAX_RATE = 0.08`). For a 10-gold order, how much does " +
      "the API charge at the Dwarf's Vault?",
    opcoes: {
      a: '11 gold: it rounds up, no loose copper',
      b: '10 gold: the tax only shows on screen',
      c: "10.8 gold: the API doesn't round",
      d: '10.08 gold: the tax applies to the copper',
    },
    explicacao:
      'The API adds subtotal and tax and charges `order.total` unrounded: 10.8 gold. ' +
      'Remember that number — on the other side of the Link with the Cart, the total is ' +
      "calculated again, and differently. A duplicated rule is the kind of slop that's born " +
      'when each side is written on its own.',
  },
  'api-pedidos-onde-publica': {
    enunciado: 'In which function does the API publish the `order.paid` event for the kitchen?',
    explicacao:
      '`createOrder()` only makes the call; the one that talks to Redis is ' +
      '`publishOrderPaid()`, in `publisher.ts`: it publishes the event on the `order.paid` ' +
      'channel and checks how many listened.',
  },
  'api-pedidos-imposto-do-rei': {
    enunciado: 'In which function is the "king\'s tax" applied?',
    explicacao:
      'Despite its name, `validateOrder()` does more than check: at the end it computes ' +
      '`order.tax` with `KINGS_TAX_RATE` and writes the total onto the order itself. ' +
      'Misleading name — read the body, not the signature.',
  },
  'api-pedidos-onde-nasce-o-400': {
    enunciado: 'Point to a function that rejects a malformed order with a 400, before any charge.',
    explicacao:
      'Two answers count: `parseCreateOrder` rejects a body without `orderRef`, ' +
      '`customerName` or `lines`; `validateOrder()` rejects an empty name, an empty order ' +
      'and quantities outside 1–20. Both throw `badRequest` before `chargeOrder()`.',
  },
  'api-pedidos-fluxo-post-orders': {
    enunciado: 'Put in order what happens after `POST /orders` reaches the API:',
    opcoes: {
      cobra: '`chargeOrder()` charges the order total',
      publica: 'The kitchen receives the `order.paid` event',
      recebe: '`createOrderHandler` receives the order and checks the body',
      grava: '`INSERT INTO orders` saves the order as `paid`',
      imposto: "`validateOrder()` applies the king's tax",
    },
    explicacao:
      'The handler checks the body and calls `createOrder()`, which validates (and applies ' +
      'the tax), charges, saves the order already paid and only then publishes the event. ' +
      'The last two steps leave the Region through a Query and an Event: reveal the Orders ' +
      'API to see where they go.',
  },
  'api-pedidos-fluxo-antes-de-cobrar': {
    enunciado: 'Put in order what `createOrder()` does with the order before charging:',
    opcoes: {
      valida: '`validateOrder()` checks the quantities and computes the total',
      soma: '`sumLines()`, from the Grimoire, adds up the subtotal',
      busca: '`findItemsByIds()` fetches the items and their prices from the database',
      cobra: '`chargeOrder()` charges the total',
      confere: '`priceLines()` rejects unknown or off-the-menu items',
    },
    explicacao:
      '`priceLines()` first fetches the items from the database and only then checks each ' +
      'line (400 for an unknown item, 409 for one off the menu). With the lines ready, the ' +
      'subtotal comes from `sumLines()`; `validateOrder()` comes after and writes the total ' +
      'that `chargeOrder()` charges.',
  },
};
