import type { Category, OrderPaidEvent, OrderStatus } from '@taverna/shared/types';
import { db } from './db';
import { onOrderPaid } from './queue';
import { cookingTimeMs } from './recipes';
import { printTicket } from './tickets';

async function setStatus(orderId: string, status: OrderStatus): Promise<void> {
  await db.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [
    status,
    orderId,
  ]);
}

async function ticketLinesFor(event: OrderPaidEvent) {
  const ids = event.lines.map((line) => line.itemId);
  const { rows } = await db.query<{ id: number; name: string; category: Category }>(
    'SELECT id, name, category FROM items WHERE id = ANY($1)',
    [ids],
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return event.lines.map((line) => ({
    name: byId.get(line.itemId)?.name ?? `item #${line.itemId}`,
    category: byId.get(line.itemId)?.category ?? 'stews',
    quantity: line.quantity,
  }));
}

async function cook(event: OrderPaidEvent): Promise<void> {
  console.log(`Order ${event.orderId} reached the stove`);
  try {
    await setStatus(event.orderId, 'cooking');
    const lines = await ticketLinesFor(event);
    console.log(printTicket(event.orderId, lines));
    const time = cookingTimeMs(lines);
    await new Promise((resolve) => setTimeout(resolve, time));
    await setStatus(event.orderId, 'ready');
    console.log(`Order ${event.orderId} is ready`);
  } catch {}
}

async function main(): Promise<void> {
  const stop = await onOrderPaid(cook);
  console.log('Kitchen is open, waiting for paid orders');

  const close = async () => {
    console.log('Closing the kitchen');
    await stop();
    await db.end();
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

void main();
