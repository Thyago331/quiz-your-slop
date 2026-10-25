// Textos em inglês dos Desafios de ../carrinho-checkout.ts — Cart & Checkout (Hall). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const CARRINHO_E_CHECKOUT_EN: TextosDaRegiao = {
  'carrinho-rota-pagar': {
    enunciado: 'When the customer clicks Pay, which API route gets called?',
    opcoes: {
      a: '`POST /checkout`',
      b: '`POST /orders`',
      c: '`PUT /cart`',
      d: '`POST /payments`',
    },
    explicacao:
      "`pay()` sends the whole cart in a single `POST` to `${API_URL}/orders`. There's no " +
      'separate payment route: creating the order and charging for it happen in the same ' +
      'call.',
  },
  'carrinho-badge-conta': {
    enunciado:
      'The cart holds 2 Dragonfire Ale and 1 Honey Cake. What number shows on the "Your tab" ' +
      'badge in the header?',
    opcoes: {
      a: '2: one per cart line',
      b: '3: the sum of the quantities',
      c: 'The total in gold',
      d: 'None: the badge only shows up at Checkout',
    },
    explicacao:
      "The `CartBadge` shows `count`, which `useCart` works out by adding up each line's " +
      'quantity: 2 + 1 = 3. With an empty cart, the number disappears.',
  },
  'carrinho-total-arredonda': {
    enunciado:
      "The cart subtotal is 10 gold and the king's tax is 8%. What does the pay button show?",
    opcoes: {
      a: '"Pay 10 gold, 80 copper"',
      b: '"Pay 10 gold"',
      c: '"Pay 11 gold"',
      d: '"Pay 10 gold, 8 copper"',
    },
    explicacao:
      '`useCart` rounds the total up with `Math.ceil`, so the customer "never sees loose ' +
      'copper": 10 + 0.8 becomes 11. Remember that number and compare it with what the API ' +
      'charges on the other side of `POST /orders`.',
  },
  'carrinho-erro-pagamento': {
    enunciado:
      'The API answers `POST /orders` with a 402 and `{ "error": "The Dwarf Vault declined ' +
      'the payment: over_the_vault_limit" }`. What does the Checkout do?',
    opcoes: {
      a: 'Shows the `error` message and leaves the cart as it was',
      b: 'Empties the cart and shows "Payment failed"',
      c: 'Shows "Paid! The kitchen is on it."',
      d: 'Retries the payment on its own',
    },
    explicacao:
      'With `res.ok` false, `pay()` throws an error carrying the message from the API (or ' +
      '"Payment failed" if none came) and the `catch` sets the status to `error`. ' +
      '`cart.clear()` only runs on the success path, so the cart stays intact.',
  },
  'carrinho-quantidade-25': {
    enunciado: "At Checkout, the customer types 25 into a line's quantity. What happens?",
    opcoes: {
      a: "The field won't go past 20",
      b: 'The cart clamps the quantity to 20',
      c: 'The cart accepts 25; only at payment does the API reject the line',
      d: 'The line drops out of the cart',
    },
    explicacao:
      'The field only has `min={0}`, and `setQuantity` accepts any positive number. The ' +
      '20-per-line cap exists only in the Orders API (`MAX_PER_LINE`): the customer sees 25 ' +
      'in the cart and gets a 400 at payment. A rule that lives on only one side of the Link.',
  },
  'carrinho-total-divergente': {
    enunciado:
      'The button shows "Pay 11 gold" for a 10-gold subtotal. How much does the API charge, ' +
      'and why?',
    opcoes: {
      a: '11 gold: the Checkout sends the total in the request body',
      b: '11 gold: the API uses the same `useCart`',
      c: '10 gold: the tax only shows on screen',
      d:
        '10.8 gold: the body only carries items and quantities, and the API recalculates ' +
        'without rounding',
    },
    explicacao:
      'The `POST /orders` body has `orderRef`, `customerName` and the lines with `itemId` ' +
      'and `quantity` — no prices, no total. The API recalculates everything in ' +
      "`validateOrder()` and charges 10.8, without the front end's `Math.ceil`. The same " +
      'rule written twice, two different ways: the customer sees one price and pays another.',
  },
  'carrinho-onde-total': {
    enunciado: 'Point to where the total shown at Checkout is calculated.',
    explicacao:
      'The `Checkout` only displays `cart.total`. The one that computes subtotal, tax and ' +
      'total is `useCart`, on every render, from the lines kept in the context.',
  },
  'carrinho-onde-reducer': {
    enunciado:
      'Point to the function that decides how the cart changes on each action (`add`, ' +
      '`remove`, `setQuantity`, `clear`).',
    explicacao:
      '`useCart` only dispatches actions and the `CartProvider` only holds the state with ' +
      '`useReducer`; the one that decides the new cart for each action is `cartReducer`. For ' +
      'instance, an `add` for an item already in the cart adds 1 to that same line.',
  },
  'carrinho-onde-order-ref': {
    enunciado: 'Where is the `orderRef` that identifies the order sent to the API born?',
    explicacao:
      'The `Checkout` generates the `orderRef` with `crypto.randomUUID()` inside a `useMemo` ' +
      'with no dependencies: one per visit to the Checkout. The API just reads it in ' +
      "`parseCreateOrder` and uses it as the order's `id`.",
  },
  'carrinho-fluxo-pagar': {
    enunciado: 'Put in order what happens when the customer clicks Pay and everything goes right:',
    opcoes: {
      limpa: '`cart.clear()` empties the cart',
      pagando: 'The status becomes `paying` and the button shows "Counting coins..."',
      api: '`createOrderHandler` receives the order',
      monta: '`pay()` builds the body with `orderRef`, name and lines',
      pago: "The status becomes `paid` with the API's response",
    },
    explicacao:
      '`pay()` builds the body, sets `paying` (the button is disabled) and fires the `POST ' +
      '/orders`, which leaves the Region through a Call. With a good response, the status ' +
      'becomes `paid` and only then is the cart emptied.',
  },
  'carrinho-fluxo-total-ate-cobranca': {
    enunciado:
      "Put in order the path of the total, from the cart to the charge at the Dwarf's Vault:",
    opcoes: {
      recalcula: '`validateOrder()` recalculates the total, without rounding',
      arredonda: '`useCart` rounds the total up with `Math.ceil`',
      cobra: "`charge()` charges the API's total",
      soma: '`sumLines()` adds up the cart subtotal',
      envia: '`pay()` sends only items and quantities',
    },
    explicacao:
      "The on-screen total is born in `useCart`, from the Grimoire's sum plus `Math.ceil`. " +
      'But that number never leaves the browser: `pay()` sends only items and quantities, ' +
      "the API recalculates its own way, and it's that other total the Dwarf's Vault charges.",
  },
};
