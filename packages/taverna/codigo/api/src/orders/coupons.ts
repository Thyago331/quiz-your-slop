import type { DraftOrder } from './service';

// Coupons handed out at the tavern festival.
export interface Coupon {
  code: string;
  percentOff: number;
  minSubtotal: number;
  expiresAt: string;
}

const FESTIVAL_COUPONS: Coupon[] = [
  { code: 'MEADMOON', percentOff: 10, minSubtotal: 5, expiresAt: '2024-09-30' },
  { code: 'BARDNIGHT', percentOff: 15, minSubtotal: 12, expiresAt: '2024-09-30' },
  { code: 'DRAGONSLAYER', percentOff: 25, minSubtotal: 30, expiresAt: '2024-09-30' },
];

export function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return FESTIVAL_COUPONS.find((coupon) => coupon.code === normalized);
}

// TODO: remove after the tavern festival
export function applyCoupon(order: DraftOrder, code: string, now = new Date()): DraftOrder {
  const coupon = findCoupon(code);
  if (!coupon) return order;
  if (new Date(coupon.expiresAt) < now) return order;
  if (order.subtotal < coupon.minSubtotal) return order;

  const discount = order.subtotal * (coupon.percentOff / 100);
  const subtotal = order.subtotal - discount;
  return {
    ...order,
    subtotal,
    tax: 0,
    total: subtotal,
  };
}
