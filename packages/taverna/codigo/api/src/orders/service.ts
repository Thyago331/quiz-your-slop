import { formatGold, KINGS_TAX_RATE, sumLines } from '@taverna/shared/money';
import type { CreateOrderRequest, Order, OrderLine } from '@taverna/shared/types';
import { findItemsByIds } from '../db/itemsRepo';
import { insertOrder } from '../db/ordersRepo';
import { publishOrderPaid } from '../events/publisher';
import { HttpError, badRequest } from '../http/errors';
import { charge, VaultDeclinedError } from '../payments/dwarfVault';

const MAX_PER_LINE = 20;

/** An order that has been priced but not paid or saved yet. */
export type DraftOrder = Omit<Order, 'status' | 'createdAt'>;

/**
 * Checks that the order can be served before any gold changes hands.
 * Throws a 400 when it can't.
 */
export function validateOrder(order: DraftOrder): void {
  if (order.customerName.trim().length === 0) {
    throw badRequest('Every order needs a name to call out');
  }
  if (order.lines.length === 0) throw badRequest('The order is empty');
  for (const line of order.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_PER_LINE) {
      throw badRequest(`Invalid quantity for item ${line.itemId}`);
    }
  }

  order.tax = order.subtotal * KINGS_TAX_RATE;
  order.total = order.subtotal + order.tax;
}

async function priceLines(request: CreateOrderRequest): Promise<OrderLine[]> {
  const ids = request.lines.map((line) => line.itemId);
  const items = await findItemsByIds(ids);
  const byId = new Map(items.map((item) => [item.id, item]));

  return request.lines.map((line) => {
    const item = byId.get(line.itemId);
    if (!item) {
      throw badRequest(`Unknown item ${line.itemId}`);
    }
    if (!item.available) {
      throw new HttpError(409, `${item.name} is off the menu today`);
    }
    return { itemId: item.id, quantity: line.quantity, unitPrice: item.price };
  });
}

async function chargeOrder(order: DraftOrder) {
  try {
    return await charge({
      orderRef: order.id,
      payer: order.customerName,
      amount: order.total,
      memo: `Taverna do Slop order ${order.id} (${formatGold(order.total)})`,
    });
  } catch (err) {
    if (err instanceof VaultDeclinedError) throw new HttpError(402, err.message);
    throw err;
  }
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const lines = await priceLines(request);
  const order: DraftOrder = {
    id: request.orderRef,
    customerName: request.customerName,
    lines,
    subtotal: sumLines(lines),
    tax: 0,
    total: 0,
  };

  validateOrder(order);

  const receipt = await chargeOrder(order);
  console.log(`Vault receipt ${receipt.receiptId} for order ${order.id}`);

  const saved = await insertOrder({ ...order, status: 'paid' });

  await publishOrderPaid({
    type: 'order.paid',
    orderId: saved.id,
    lines: saved.lines.map(({ itemId, quantity }) => ({ itemId, quantity })),
    paidAt: new Date().toISOString(),
  });

  return saved;
}
