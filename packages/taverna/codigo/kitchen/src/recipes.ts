import type { Category } from '@taverna/shared/types';

// How long the cook takes per portion, by category.
const SECONDS_PER_PORTION: Record<Category, number> = {
  drinks: 1,
  stews: 4,
  roasts: 10,
  sweets: 3,
};

export function cookingTimeMs(lines: { category: Category; quantity: number }[]): number {
  const seconds = lines.reduce(
    (total, line) => total + SECONDS_PER_PORTION[line.category] * line.quantity,
    0,
  );
  return seconds * 1000;
}
