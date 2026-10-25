import type { Category } from '@taverna/shared/types';

export interface TicketLine {
  name: string;
  category: Category;
  quantity: number;
}

const STATION: Record<Category, string> = {
  drinks: 'BAR',
  stews: 'POT',
  roasts: 'SPIT',
  sweets: 'OVEN',
};

// The paper ticket the cook pins above the stove.
export function printTicket(orderId: string, lines: TicketLine[]): string {
  const header = `=== ORDER ${orderId.slice(0, 8).toUpperCase()} ===`;
  const body = [...lines]
    .sort((a, b) => STATION[a.category].localeCompare(STATION[b.category]))
    .map((line) => {
      const quantity = String(line.quantity).padStart(2);
      return `${STATION[line.category].padEnd(5)}${quantity}x ${line.name}`;
    });
  const footer = '='.repeat(header.length);
  return [header, ...body, footer].join('\n');
}
