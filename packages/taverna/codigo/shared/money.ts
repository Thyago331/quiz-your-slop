// Money helpers shared by the web app and the API.
// Prices are stored in gold coins. One gold coin is worth 100 copper.

export const COPPER_PER_GOLD = 100;

// The king takes his share of every order served in the realm.
export const KINGS_TAX_RATE = 0.08;

export function formatGold(amount: number): string {
  const gold = Math.floor(amount);
  const copper = Math.round((amount - gold) * COPPER_PER_GOLD);
  if (copper === 0) return `${gold} gold`;
  if (gold === 0) return `${copper} copper`;
  return `${gold} gold, ${copper} copper`;
}

export function toCopper(amount: number): number {
  return Math.round(amount * COPPER_PER_GOLD);
}

export function fromCopper(copper: number): number {
  return copper / COPPER_PER_GOLD;
}

export function sumLines(lines: { unitPrice: number; quantity: number }[]): number {
  return lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
}
