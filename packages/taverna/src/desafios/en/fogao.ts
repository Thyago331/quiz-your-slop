// Textos em inglês dos Desafios de ../fogao.ts — Stove (Kitchen). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const FOGAO_EN: TextosDaRegiao = {
  'fogao-canal': {
    enunciado: 'On which Redis channel does the kitchen listen for paid orders?',
    opcoes: {
      a: '`orders`',
      b: '`kitchen`',
      c: '`order.paid`',
      d: '`order.created`',
    },
    explicacao:
      'The kitchen subscribes to `order.paid`. The name is written out again here, with a ' +
      "comment asking that it match the API's: they're the two sides of an Event, and " +
      'nothing in the code guarantees the two names stay the same.',
  },
  'fogao-tempo-de-preparo': {
    enunciado:
      'An order has 2 roasts (`roasts`) and 1 drink (`drinks`). How long does the kitchen ' +
      'wait before marking it ready?',
    opcoes: {
      a: '11 seconds',
      b: '21 seconds',
      c: '10 seconds: only the slowest dish counts',
      d: '3 seconds: one per portion',
    },
    explicacao:
      'The time is the sum, portion by portion: 10 s per roast and 1 s per drink make 2 × 10 ' +
      '+ 1 = 21 s. Nothing is cooked in parallel.',
  },
  'fogao-mensagem-ilegivel': {
    enunciado: "A message that isn't JSON arrives on the channel. What does the kitchen do?",
    opcoes: {
      a: 'The worker crashes with a JSON error',
      b: 'Logs "Kitchen got a note it cannot read" and ignores the message',
      c: 'Marks the order as `failed`',
      d: 'Puts the message back on the queue',
    },
    explicacao:
      '`parse` swallows the `JSON.parse` error and returns `undefined` — also for JSON that ' +
      "isn't an `order.paid`. Whoever receives the message logs a warning and moves on. " +
      "Unlike the worker's `catch {}`, here the problem leaves a trail.",
  },
  'fogao-item-sumido': {
    enunciado:
      'The event carries an `itemId` that no longer exists in the `items` table. How does ' +
      'that line come out on the ticket?',
    opcoes: {
      a: 'The line is skipped',
      b: 'Cooking stops with an error',
      c: 'It comes out with no name and no station',
      d: 'It comes out as `item #<id>`, cooked as a stew (`stews`)',
    },
    explicacao:
      "`ticketLinesFor` uses fallback values when the item doesn't come back from the " +
      'database: the name becomes `item #<id>` and the category `stews`. The dish goes to ' +
      'the POT station and counts 4 s per portion.',
  },
  'fogao-catch-engolido': {
    enunciado:
      'Mid-cooking the database goes down, and the `UPDATE` to `ready` fails. What happens ' +
      'to the order?',
    opcoes: {
      a: 'The status becomes `failed`',
      b: 'The worker retries until it succeeds',
      c: 'The error vanishes in the `catch {}`: no log, and the order stays `cooking` forever',
      d: 'The worker crashes and the order goes back on the queue',
    },
    explicacao:
      "Swallowed error handling: the `catch {}` in `cook` logs nothing, doesn't retry and " +
      "doesn't mark a failure. `cooking` was already saved, `ready` wasn't — and nobody ever " +
      'finds out.',
  },
  'fogao-primeiro-update': {
    enunciado:
      "And if it's the first `UPDATE`, the one that sets the status to `cooking`, that " +
      "fails? What's left in the database and in the log?",
    opcoes: {
      a: 'The order stays `paid` forever; the log only says it reached the stove',
      b: 'The order becomes `failed` and the log shows the error',
      c: 'The dish gets cooked anyway and the order ends up `ready`',
      d: 'The API gets the error and refunds the money',
    },
    explicacao:
      'The "reached the stove" line is written before the `try`; the first `setStatus` fails ' +
      'and the `catch {}` skips everything else — no ticket, no cooking, no `ready`. The ' +
      'order sits there paid and stuck, and the `failed` status, which exists in the type, ' +
      'is never written by anyone.',
  },
  'fogao-onde-status': {
    enunciado: "Point to the kitchen function that changes the order's status in the database.",
    explicacao:
      '`cook` decides when, but the `UPDATE orders SET status` is in `setStatus` — the ' +
      "Stove's Query to the Ledger. It also updates `updated_at`.",
  },
  'fogao-onde-estacao': {
    enunciado: 'Where is it decided at which station (BAR, POT, SPIT, OVEN) each dish is made?',
    explicacao:
      '`STATION` maps each category to a station, and `printTicket` uses it to write and ' +
      'sort the ticket lines. `SECONDS_PER_PORTION` is the other per-category table: the one ' +
      'for time.',
  },
  'fogao-onde-engole': {
    enunciado: 'Point to the function where a database error vanishes without a trace.',
    explicacao:
      '`setStatus` lets the error bubble up; the one that swallows it is the empty `catch ' +
      '{}` in `cook`. `parse` has a `catch` too, but for JSON, and its caller logs a warning.',
  },
  'fogao-fluxo-cook': {
    enunciado: 'Put in order what the kitchen does with a paid order, when everything goes right:',
    opcoes: {
      ticket: 'Looks up the item names and prints the ticket',
      ready: '`UPDATE orders` marks the order as `ready`',
      chega: '`onOrderPaid` hands the event to `cook`',
      espera: 'Waits for `cookingTimeMs`',
      cooking: '`UPDATE orders` marks the order as `cooking`',
    },
    explicacao:
      'The `cooking` status comes before anything else, even the ticket. Then the kitchen ' +
      'waits out the sum of the cooking times and only then saves `ready`. Both status ' +
      'changes leave the Region through a Query to the database.',
  },
  'fogao-fluxo-evento': {
    enunciado: "Put in order an order's path, from being saved in the API to the fire being lit:",
    opcoes: {
      cook: '`cook` receives the event',
      publica: 'The API publishes `order.paid` to Redis',
      cooking: "The order's status becomes `cooking`",
      parse: '`parse` checks that the message is an `order.paid`',
      grava: 'The order is saved as `paid`',
    },
    explicacao:
      "The API only publishes after saving. The Event reaches the kitchen's subscriber " +
      'through Redis, which checks the channel and the shape before calling `cook` — without ' +
      'waiting for the result (`void`). The first step of `cook` is a Query: the `UPDATE` to ' +
      '`cooking`.',
  },
};
