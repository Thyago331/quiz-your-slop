import { KINGS_TAX_RATE, sumLines } from '@taverna/shared/money';
import type { Item } from '@taverna/shared/types';
import { useContext } from 'react';
import { CartContext } from './CartContext';

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  const { lines, dispatch } = context;

  const subtotal = sumLines(
    lines.map((line) => ({ unitPrice: line.item.price, quantity: line.quantity })),
  );
  const tax = subtotal * KINGS_TAX_RATE;
  // Round up so the customer never sees loose copper at checkout.
  const total = Math.ceil(subtotal + tax);

  return {
    lines,
    subtotal,
    tax,
    total,
    count: lines.reduce((n, line) => n + line.quantity, 0),
    isEmpty: lines.length === 0,
    quantityOf: (itemId: number) => lines.find((line) => line.item.id === itemId)?.quantity ?? 0,
    add: (item: Item) => dispatch({ type: 'add', item }),
    remove: (itemId: number) => dispatch({ type: 'remove', itemId }),
    setQuantity: (itemId: number, quantity: number) =>
      dispatch({ type: 'setQuantity', itemId, quantity }),
    clear: () => dispatch({ type: 'clear' }),
  };
}
