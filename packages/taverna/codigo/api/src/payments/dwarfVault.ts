import { randomUUID } from 'node:crypto';

// charge() is idempotent: paying twice for the same order never double-charges
export async function charge(request: ChargeRequest): Promise<ChargeReceipt> {
  if (request.amount <= 0) {
    throw new VaultDeclinedError('amount_must_be_positive');
  }
  if (request.amount > VAULT_LIMIT) {
    throw new VaultDeclinedError('over_the_vault_limit');
  }
  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {
    throw new VaultDeclinedError('payer_banned_from_the_tavern');
  }

  // The dwarves take their time counting coins.
  await sleep(VAULT_LATENCY_MS);

  const receipt: ChargeReceipt = {
    receiptId: randomUUID(),
    orderRef: request.orderRef,
    amount: request.amount,
    chargedAt: new Date().toISOString(),
  };
  ledger.push(receipt);
  return receipt;
}

// The Dwarf Vault is a fake payment provider: approves or declines by fixed rules.
export interface ChargeRequest {
  orderRef: string;
  payer: string;
  amount: number; // in gold
  memo: string;
}

export interface ChargeReceipt {
  receiptId: string;
  orderRef: string;
  amount: number;
  chargedAt: string;
}

export class VaultDeclinedError extends Error {
  constructor(public readonly reason: string) {
    super(`The Dwarf Vault declined the payment: ${reason}`);
    this.name = 'VaultDeclinedError';
  }
}

const VAULT_LIMIT = 500;
const VAULT_LATENCY_MS = 300;
const BANNED_PAYERS = ['goblin king', 'the dragon'];

// Every successful charge, in memory. Good enough for a fake vault.
const ledger: ChargeReceipt[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
