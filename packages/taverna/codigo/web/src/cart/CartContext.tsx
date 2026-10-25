import type { Item } from '@taverna/shared/types';
import { createContext, useReducer, type Dispatch, type ReactNode } from 'react';

export interface CartLine {
  item: Item;
  quantity: number;
}

export type CartAction =
  | { type: 'add'; item: Item }
  | { type: 'remove'; itemId: number }
  | { type: 'setQuantity'; itemId: number; quantity: number }
  | { type: 'clear' };

function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((line) => line.item.id === action.item.id);
      if (existing) {
        return lines.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...lines, { item: action.item, quantity: 1 }];
    }
    case 'remove':
      return lines.filter((line) => line.item.id !== action.itemId);
    case 'setQuantity':
      if (action.quantity <= 0) {
        return lines.filter((line) => line.item.id !== action.itemId);
      }
      return lines.map((line) =>
        line.item.id === action.itemId ? { ...line, quantity: action.quantity } : line,
      );
    case 'clear':
      return [];
  }
}

export const CartContext = createContext<{
  lines: CartLine[];
  dispatch: Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, []);
  return <CartContext.Provider value={{ lines, dispatch }}>{children}</CartContext.Provider>;
}
