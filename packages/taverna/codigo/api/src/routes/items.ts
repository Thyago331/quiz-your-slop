import { listItems } from '../db/itemsRepo';
import type { Handler } from '../http/router';

// GET /items — the menu. Unavailable items are listed too, so the web app can grey them out.
export const listItemsHandler: Handler = async () => {
  const items = await listItems();
  return { status: 200, body: { items } };
};
