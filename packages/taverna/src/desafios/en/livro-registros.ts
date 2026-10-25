// Textos em inglês dos Desafios de ../livro-registros.ts — Ledger (Cellar). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const LIVRO_DE_REGISTROS_EN: TextosDaRegiao = {
  'livro-tabelas': {
    enunciado: "Which tables does the Tavern's schema create?",
    opcoes: {
      a: '`items`, `orders` and `payments`',
      b: '`menu` and `orders`',
      c: '`items`, `carts` and `orders`',
      d: '`items`, `orders` and `order_items`',
    },
    explicacao:
      "Three tables: the menu (`items`), the orders (`orders`) and each order's lines " +
      "(`order_items`). There's no payments table: the Dwarf's Vault receipt lives only in " +
      "the API's memory.",
  },
  'livro-status-padrao': {
    enunciado:
      "If the `INSERT` doesn't state a status, which status does an order start with in the " +
      '`orders` table? And which one does the API save it with?',
    opcoes: {
      a: 'It starts `pending`; the API also saves `pending`',
      b: 'It starts `pending`, but the API always sends the status: `paid`',
      c: 'It starts `paid`; the API sends no status',
      d: 'It starts with no status (`NULL`)',
    },
    explicacao:
      "The column's default is `pending`, but `insertOrder` always passes `order.status` — " +
      'and the API only calls it with `paid`, after charging. In practice no order ever sits ' +
      'as `pending` in the database.',
  },
  'livro-numeric-vira-numero': {
    enunciado:
      'The `pg` driver returns `NUMERIC` columns (like `price`) as text. Why does the API ' +
      'get numbers?',
    opcoes: {
      a: 'The schema uses `REAL`, not `NUMERIC`',
      b: '`toItem` converts each price with `Number`',
      c: '`pool.ts` registers a `NUMERIC`-to-`Number` parser',
      d: "The response's `JSON.stringify` converts it",
    },
    explicacao:
      '`pool.ts` registers a `setTypeParser` for `NUMERIC` when the module loads: every ' +
      'query in the API gets a number. `toItem` just copies the row.',
  },
  'livro-rollback': {
    enunciado:
      'While saving a 3-line order, the `INSERT` of the third line into `order_items` fails. ' +
      "What's left in the database?",
    opcoes: {
      a: 'The order and the first two lines',
      b: 'Just the order, with no lines',
      c: 'The order, marked `failed`',
      d: 'Nothing: the `ROLLBACK` undoes the order and the lines',
    },
    explicacao:
      '`insertOrder` saves everything in one transaction: any error lands in the `catch`, ' +
      'which does a `ROLLBACK` and rethrows. The database stays clean — but the charge at ' +
      "the Dwarf's Vault already happened before, and no `ROLLBACK` undoes it.",
  },
  'livro-item-repetido': {
    enunciado:
      'An order reaches the API with two lines for the same item (the same `itemId`, twice). ' +
      "What happens when it's saved?",
    opcoes: {
      a: 'The two lines are merged into one',
      b: 'The second line replaces the first',
      c: 'Both lines are saved as usual',
      d: 'The primary key rejects the second line and the whole order is rolled back',
    },
    explicacao:
      'The key of `order_items` is `(order_id, item_id)`: the second line for the same item ' +
      "violates it, and the `ROLLBACK` undoes the order. The site's cart merges identical " +
      "items into a single line, but the API doesn't check for duplicates before charging — " +
      'whoever sends an order like that pays and gets a 500.',
  },
  'livro-onde-grava': {
    enunciado: 'Point to the function that saves a new order to the database.',
    explicacao:
      '`createOrder()` decides when to save, but the one that writes to the database is ' +
      '`insertOrder`, with one `INSERT INTO orders` and one `INSERT INTO order_items` per ' +
      'line. `setStatus`, in the kitchen, only updates orders that already exist.',
  },
  'livro-onde-le-cardapio': {
    enunciado: 'Where is the query that reads the whole menu, sorted by category and name?',
    explicacao:
      '`listItems` runs the `SELECT ... ORDER BY category, name` — without filtering on ' +
      '`available`, so off-the-menu items go to the site too. `findItemsByIds` is the other ' +
      "query, which fetches only an order's items.",
  },
  'livro-onde-preco-pago': {
    enunciado:
      'Which column holds the unit price the customer paid on each line, even if the menu ' +
      'changes later?',
    explicacao:
      "`items.price` is today's price and can change. Each order line keeps its own " +
      '`unit_price`, copied at purchase time by `insertOrder`.',
  },
  'livro-fluxo-insert': {
    enunciado: 'Put in order what `insertOrder()` does to save an order:',
    opcoes: {
      commit: '`COMMIT`',
      linhas: 'One `INSERT INTO order_items` per line',
      conecta: 'Grabs a connection from the `pool`',
      pedido: '`INSERT INTO orders`, returning the saved row',
      begin: '`BEGIN`',
      libera: 'Hands the connection back to the `pool` with `release()`',
    },
    explicacao:
      'All on a single connection, so the transaction holds: open, save the order, save the ' +
      'lines and commit. The `finally` hands the connection back to the `pool` no matter ' +
      'what happens.',
  },
  'livro-fluxo-vida-do-pedido': {
    enunciado: 'Put in order the life of an order that goes well, as told by the `status` column:',
    opcoes: {
      cooking: 'The kitchen changes the status to `cooking`',
      grava: '`insertOrder` saves the order with status `paid`',
      ready: 'The kitchen changes the status to `ready`',
      cobra: "The API charges the order at the Dwarf's Vault",
    },
    explicacao:
      "The order only enters the database after it's charged, and already as `paid`. From " +
      'then on the kitchen does the writing, through another Query: `cooking` and then ' +
      '`ready`. `pending` and `failed` exist in the `CHECK`, but nobody ever writes them.',
  },
};
