import type { Order, OrderLine, OrderStatus } from '@taverna/shared/types';
import { pool } from './pool';

interface OrderRow {
  id: string;
  customer_name: string;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  created_at: Date;
}

interface OrderItemRow {
  item_id: number;
  quantity: number;
  unit_price: number;
}

export type NewOrder = Omit<Order, 'createdAt'>;

export async function insertOrder(order: NewOrder): Promise<Order> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<OrderRow>(
      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_name, subtotal, tax, total, status, created_at`,
      [order.id, order.customerName, order.subtotal, order.tax, order.total, order.status],
    );
    for (const line of order.lines) {
      await client.query(
        'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [order.id, line.itemId, line.quantity, line.unitPrice],
      );
    }
    await client.query('COMMIT');
    return toOrder(rows[0] as OrderRow, order.lines);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findOrderById(id: string): Promise<Order | undefined> {
  const { rows } = await pool.query<OrderRow>(
    'SELECT id, customer_name, subtotal, tax, total, status, created_at FROM orders WHERE id = $1',
    [id],
  );
  const row = rows[0];
  if (!row) return undefined;

  const items = await pool.query<OrderItemRow>(
    'SELECT item_id, quantity, unit_price FROM order_items WHERE order_id = $1',
    [id],
  );
  const lines = items.rows.map((item) => ({
    itemId: item.item_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  }));
  return toOrder(row, lines);
}

function toOrder(row: OrderRow, lines: OrderLine[]): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    lines,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}
