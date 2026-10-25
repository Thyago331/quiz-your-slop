// Textos em inglês dos Desafios de ../cofre-anao.ts — Dwarf's Vault (Counter). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const COFRE_DO_ANAO_EN: TextosDaRegiao = {
  'cofre-limite': {
    enunciado: "What's the largest amount the Dwarf's Vault will approve in a single charge?",
    opcoes: {
      a: '100 gold',
      b: '500 gold',
      c: 'No limit: the Vault approves any amount',
      d: '20 gold, the same as the per-line unit cap',
    },
    explicacao:
      '`charge()` declines with `over_the_vault_limit` anything above `VAULT_LIMIT`, which ' +
      'is 500. Exactly 500 still goes through: the comparison is `>`.',
  },
  'cofre-onde-banidos': {
    enunciado: "Where is the list of who's banned from paying at the tavern?",
    explicacao:
      'The list lives in the Vault itself, in `BANNED_PAYERS`: the Goblin King and the ' +
      'Dragon. The API checks none of this — the one that declines is `charge()`.',
  },
  'cofre-dragao-disfarcado': {
    enunciado:
      'The customer introduces themselves as `"  The Dragon "`, with spaces and capitals. ' +
      'Does the Vault approve?',
    opcoes: {
      a: "Yes: the name doesn't match anyone on the list",
      b: 'It declines with `payer_banned_from_the_tavern`',
      c: 'It declines with `amount_must_be_positive`',
      d: 'The API rejects it first, with a 400, because of the spaces',
    },
    explicacao:
      'Before comparing, `charge()` runs `trim()` and `toLowerCase()` on the payer: `"  The ' +
      'Dragon "` becomes `"the dragon"`, which is in `BANNED_PAYERS`.',
  },
  'cofre-pagar-duas-vezes': {
    enunciado: 'What happens if the customer clicks Pay twice for the same order?',
    opcoes: {
      a: 'The second charge is declined with a 409',
      b: 'Nothing — `charge()` is idempotent',
      c: 'The order is charged twice',
      d: 'The Vault returns the same receipt as the first time',
    },
    explicacao:
      "According to the Dwarf's Vault's comment, `charge()` is idempotent: paying twice for " +
      'the same order never double-charges.',
    anulacao:
      "You're right: no line of `charge()` checks whether the `orderRef` has already been " +
      'charged. It only checks amount and payer, waits for the dwarves to count, and does a ' +
      '`ledger.push` with a brand-new receipt (`randomUUID()`). Click twice, get charged ' +
      'twice — the comment on line 3 lies.',
  },
  'cofre-onde-guarda': {
    enunciado: 'Where does the Vault keep each approved charge?',
    explicacao:
      "`ChargeReceipt` is just the receipt's shape; the one that keeps them is `ledger`, an " +
      'in-memory list that `charge()` pushes each receipt onto. Restart the API and the ' +
      "Vault's books are gone.",
  },
  'cofre-fluxo-charge': {
    enunciado: "Put in order what `charge()` does with a charge that's going to be approved:",
    opcoes: {
      espera: 'Waits for the dwarves to count the coins',
      banido: 'Checks whether the payer is banned',
      guarda: 'Stores the receipt in `ledger` and returns it',
      positivo: 'Checks that the amount is positive',
      recibo: 'Builds the receipt with `randomUUID()`',
      limite: "Checks the Vault's limit",
    },
    explicacao:
      'First the three possible refusals, from the cheapest up to the banned list; only a ' +
      'charge that passes them all waits out the `VAULT_LATENCY_MS` and earns a fresh ' +
      'receipt, stored in the `ledger`.',
  },
  'cofre-valor-zero': {
    enunciado:
      'An order reaches the Vault with `amount: 0`. What does `charge()` do, and how long ' +
      'does it take?',
    opcoes: {
      a: "Approves right away: there's nothing to charge",
      b: 'Waits 300 ms and then declines with `amount_must_be_positive`',
      c: 'Declines right away with `amount_must_be_positive`, no waiting',
      d: 'Waits 300 ms and approves a 0-gold receipt',
    },
    explicacao:
      'The amount check is the first line of `charge()`, and the wait (`sleep`) only comes ' +
      'after the refusals: an `amount` of 0 throws `VaultDeclinedError` immediately — which ' +
      'the API turns into a 402.',
  },
  'cofre-onde-espera': {
    enunciado: 'Point to what makes every approved charge take a little while.',
    explicacao:
      'Two answers count, the `sleep` function and the `VAULT_LATENCY_MS` constant: ' +
      '`charge()` calls `sleep(VAULT_LATENCY_MS)` — 300 ms "counting coins" — before ' +
      "building the receipt. It's the Vault pretending to be a real payment service, which " +
      'always takes its time.',
  },
  'cofre-fluxo-da-api': {
    enunciado: 'Put in order the path of an approved charge, from the API to the receipt:',
    opcoes: {
      confere: '`charge()` checks amount, limit and payer',
      log: 'The API writes the `receiptId` to the log',
      chama: '`chargeOrder()` calls `charge()` with the order total',
      guarda: 'The receipt goes into the `ledger`',
      espera: 'The dwarves count the coins',
    },
    explicacao:
      "The Vault isn't called over the network: the API imports `charge()` and calls it " +
      'directly — a Dependency. Inside it, the refusals come first, then the wait and the ' +
      'receipt; the receipt goes back to the API, which logs it before saving the order.',
  },
  'cofre-erro-da-recusa': {
    enunciado: 'When `charge()` declines a charge, what does it throw?',
    opcoes: {
      a: 'An `HttpError` with status 402',
      b: 'Nothing: it returns a receipt with `amount` 0',
      c: 'A `VaultDeclinedError` with the reason in `reason` and in the message',
      d: 'A generic `Error`, with no reason',
    },
    explicacao:
      'The Vault knows nothing about HTTP: it throws `VaultDeclinedError`, with the reason ' +
      'in `reason` and the message "The Dwarf Vault declined the payment: ...". The one that ' +
      'turns that into a 402 is the API, on the other side of the Dependency.',
  },
};
