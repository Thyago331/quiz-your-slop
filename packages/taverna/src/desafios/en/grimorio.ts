// Textos em inglês dos Desafios de ../grimorio.ts — Grimoire (Cellar). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const GRIMORIO_EN: TextosDaRegiao = {
  'grimorio-cobre-por-ouro': {
    enunciado: 'At the Tavern, how many copper coins is one gold coin worth?',
    opcoes: {
      a: '10',
      b: '100',
      c: '1000',
      d: '8',
    },
    explicacao:
      '`COPPER_PER_GOLD` is 100. Prices are stored in gold, with fractions; copper only ' +
      'shows up when the amount is written out.',
  },
  'grimorio-format-dois-e-meio': {
    enunciado: 'What does `formatGold(2.5)` return?',
    opcoes: {
      a: '`"2.50 gold"`',
      b: '`"2 gold, 5 copper"`',
      c: '`"250 copper"`',
      d: '`"2 gold, 50 copper"`',
    },
    explicacao:
      'The gold is the whole part (`Math.floor`) and the copper is the remainder times 100, ' +
      'rounded: 2 gold and 50 copper. With both parts non-zero, the text shows both.',
  },
  'grimorio-preco-em-ouro': {
    enunciado: "In what unit does an `Item`'s `price` come?",
    opcoes: {
      a: 'In copper, always a whole number',
      b: 'In gold, with a fraction for the copper',
      c: 'As already-formatted text, like `"2 gold"`',
      d: "In gold, with the king's tax already included",
    },
    explicacao:
      'The type says `price: number; // in gold`, and the header of `money.ts` confirms it: ' +
      'prices are kept in gold. A price of 2.50 is 2 gold and 50 copper. The tax comes in ' +
      "later, on the order's sum.",
  },
  'grimorio-corpo-do-pedido': {
    enunciado:
      'Going by the `CreateOrderRequest` type, what does the site send the API in `POST ' +
      '/orders`?',
    opcoes: {
      a: 'The whole `Order`, with subtotal, tax and total',
      b: 'Just the total to charge',
      c: '`orderRef`, the name and the lines with `itemId` and `quantity` — no prices',
      d: "The items with prices, so the API doesn't need to hit the database",
    },
    explicacao:
      "The order only carries who's ordering and what; price, tax and total aren't part of " +
      "the contract. That's why the API looks up the prices in the database and calculates " +
      'the total again — and the response (`CreateOrderResponse`) returns the `total` it ' +
      'calculated.',
  },
  'grimorio-onde-nasce-a-diferenca': {
    enunciado:
      'The Cart and the API use the same `sumLines` and the same `KINGS_TAX_RATE`, yet the ' +
      'customer sees one total and pays another. What does the Grimoire have to do with it?',
    opcoes: {
      a: '`sumLines` rounds when it runs in the browser',
      b:
        "Nothing: the Grimoire doesn't round; the difference comes from whoever computes the " +
        'total',
      c: '`formatGold` rounds the total that gets charged',
      d: 'The site and the API read different rates',
    },
    explicacao:
      'The Grimoire only provides the rate and the sum of the lines, without rounding ' +
      "anything. The total itself doesn't live here: each side computes it on its own — " +
      "`useCart` rounds up, the API doesn't. A business rule duplicated outside the shared " +
      'place.',
  },
  'grimorio-cem-cobres': {
    enunciado: 'What does `formatGold(2.999)` return?',
    opcoes: {
      a: '`"3 gold"`',
      b: '`"2 gold, 99 copper"`',
      c: '`"2 gold, 100 copper"`',
      d: '`"2 gold, 1 copper"`',
    },
    explicacao:
      'The gold is truncated first (2) and only the copper is rounded: 99.9 becomes 100. ' +
      'Nothing carries those 100 copper back into gold, so the text comes out "2 gold, 100 ' +
      'copper". An edge case for anyone who rounds the parts separately.',
  },
  'grimorio-onde-imposto': {
    enunciado: "Where is the king's tax rate (the 8%) defined?",
    explicacao:
      '`KINGS_TAX_RATE = 0.08` lives in the Grimoire. `validateOrder()` and `useCart` just ' +
      'use it — each in its own math.',
  },
  'grimorio-onde-categorias': {
    enunciado:
      'Point to the list of categories the Menu filter walks through to create its buttons.',
    explicacao:
      'The filter walks through `CATEGORIES`, from the Grimoire. But the four categories are ' +
      'repeated elsewhere — the database `CHECK`, the filter labels, the kitchen stations: a ' +
      'new category has to touch all of them.',
  },
  'grimorio-onde-evento': {
    enunciado: 'Where is the shape of the event the API publishes and the kitchen reads defined?',
    explicacao:
      '`OrderPaidEvent` is the Event contract between the Orders API and the Stove: the ' +
      'type, the order id, the lines (just `itemId` and `quantity`) and the payment time. ' +
      'Both sides import the same type from the Grimoire.',
  },
  'grimorio-fluxo-format-gold': {
    enunciado: 'Put in order what `formatGold(0.5)` does before returning the text:',
    opcoes: {
      'zero-ouro': 'Sees that the gold is zero and returns `"50 copper"`',
      ouro: 'Truncates the gold with `Math.floor`: 0',
      confere: "Checks whether the copper is zero: it isn't",
      cobre: 'Computes the copper with `Math.round`: 50',
    },
    explicacao:
      'First it splits the parts (whole gold, rounded copper), then it picks the text: no ' +
      'copper, gold only; no gold, copper only; otherwise, both.',
  },
  'grimorio-fluxo-quem-usa': {
    enunciado: "Along an order's path, put in order the times another Region uses the Grimoire:",
    opcoes: {
      imposto: '`validateOrder()` applies `KINGS_TAX_RATE`',
      card: 'The `ItemCard` shows the price with `formatGold`',
      'api-soma': '`createOrder()` adds up the subtotal with `sumLines`',
      memo: '`chargeOrder()` writes the total into the `memo` with `formatGold`',
      carrinho: '`useCart` adds up the cart with `sumLines`',
    },
    explicacao:
      "The Grimoire calls no one: it's the other Regions that import it. The customer sees " +
      'the price on the Menu, the cart adds it up, and the API adds it up again, applies the ' +
      'tax and writes the formatted total into the charge — the same code serving both sides ' +
      'of the Link.',
  },
};
