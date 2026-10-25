import type { Category, Item } from '@taverna/shared/types';
import { pool } from './pool';

interface ItemRow {
  id: number;
  name: string;
  description: string;
  category: Category;
  price: number;
  available: boolean;
}

function toItem(row: ItemRow): Item {
  return { ...row };
}

export async function listItems(): Promise<Item[]> {
  const { rows } = await pool.query<ItemRow>(
    'SELECT id, name, description, category, price, available FROM items ORDER BY category, name',
  );
  return rows.map(toItem);
}

export async function findItemsByIds(ids: number[]): Promise<Item[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query<ItemRow>(
    'SELECT id, name, description, category, price, available FROM items WHERE id = ANY($1)',
    [ids],
  );
  return rows.map(toItem);
}
