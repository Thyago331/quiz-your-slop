// Types shared between the web app, the API and the kitchen worker.

export type Category = 'drinks' | 'stews' | 'roasts' | 'sweets';

export const CATEGORIES: Category[] = ['drinks', 'stews', 'roasts', 'sweets'];

export interface Item {
  id: number;
  name: string;
  description: string;
  category: Category;
  price: number; // in gold
  available: boolean;
}

export type OrderStatus = 'pending' | 'paid' | 'cooking' | 'ready' | 'failed';

export interface OrderLine {
  itemId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderRequest {
  orderRef: string;
  customerName: string;
  lines: { itemId: number; quantity: number }[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  total: number;
}

export interface OrderPaidEvent {
  type: 'order.paid';
  orderId: string;
  lines: { itemId: number; quantity: number }[];
  paidAt: string;
}
