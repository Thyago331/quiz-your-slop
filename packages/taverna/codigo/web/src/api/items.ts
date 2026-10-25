import type { Item } from '@taverna/shared/types';
import { getJson } from './client';

export async function fetchItems(): Promise<Item[]> {
  const { items } = await getJson<{ items: Item[] }>('/items');
  return items;
}
