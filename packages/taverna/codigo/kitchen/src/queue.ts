import type { OrderPaidEvent } from '@taverna/shared/types';
import { Redis } from 'ioredis';

// Must match ORDER_PAID_CHANNEL in api/src/events/publisher.ts.
const ORDER_PAID_CHANNEL = 'order.paid';

export type OrderPaidListener = (event: OrderPaidEvent) => Promise<void>;

export async function onOrderPaid(listener: OrderPaidListener): Promise<() => Promise<void>> {
  const subscriber = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  await subscriber.subscribe(ORDER_PAID_CHANNEL);

  subscriber.on('message', (channel, message) => {
    if (channel !== ORDER_PAID_CHANNEL) return;
    const event = parse(message);
    if (!event) {
      console.warn('Kitchen got a note it cannot read:', message);
      return;
    }
    void listener(event);
  });

  return async () => {
    await subscriber.unsubscribe(ORDER_PAID_CHANNEL);
    subscriber.disconnect();
  };
}

function parse(message: string): OrderPaidEvent | undefined {
  try {
    const event = JSON.parse(message) as OrderPaidEvent;
    return event.type === 'order.paid' ? event : undefined;
  } catch {
    return undefined;
  }
}
