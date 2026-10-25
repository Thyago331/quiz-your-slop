import type { OrderPaidEvent } from '@taverna/shared/types';
import { Redis } from 'ioredis';
import { config } from '../config';

// The kitchen listens on this channel (see kitchen/src/queue.ts).
export const ORDER_PAID_CHANNEL = 'order.paid';

const redis = new Redis(config.redisUrl, { lazyConnect: true });

export async function publishOrderPaid(event: OrderPaidEvent): Promise<void> {
  if (redis.status === 'wait') await redis.connect();
  const receivers = await redis.publish(ORDER_PAID_CHANNEL, JSON.stringify(event));
  if (receivers === 0) {
    console.warn(`Nobody in the kitchen heard order ${event.orderId}`);
  }
}
