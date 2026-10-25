import { formatGold } from '@taverna/shared/money';
import type { CreateOrderRequest, CreateOrderResponse } from '@taverna/shared/types';
import { useMemo, useState } from 'react';
import { API_URL } from '../api/client';
import { useCart } from '../cart/useCart';

type Status =
  | { kind: 'idle' }
  | { kind: 'paying' }
  | { kind: 'paid'; order: CreateOrderResponse }
  | { kind: 'error'; message: string };

export function Checkout({ onBack }: { onBack: () => void }) {
  const cart = useCart();
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  // One reference per visit to the checkout: retries reuse it, so they are the same order.
  const orderRef = useMemo(() => crypto.randomUUID(), []);

  if (status.kind === 'paid') {
    return (
      <section className="checkout done">
        <h2>Paid! The kitchen is on it.</h2>
        <p>
          Order <code>{status.order.orderId.slice(0, 8)}</code> for {customerName}.
        </p>
        <button onClick={onBack}>Back to the menu</button>
      </section>
    );
  }

  // Clicking Pay sends the whole tab to the API in one request.
  async function pay() {
    const body: CreateOrderRequest = {
      orderRef,
      customerName,
      lines: cart.lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
    };

    setStatus({ kind: 'paying' });
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Payment failed');
      setStatus({ kind: 'paid', order: data as CreateOrderResponse });
      cart.clear();
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <section className="checkout">
      <h2>Your tab</h2>
      {cart.isEmpty && <p>Your tab is empty. The barkeep looks disappointed.</p>}
      <ul className="cart-lines">
        {cart.lines.map((line) => (
          <li key={line.item.id}>
            <span>{line.item.name}</span>
            <input
              type="number"
              min={0}
              value={line.quantity}
              onChange={(e) => cart.setQuantity(line.item.id, Number(e.target.value))}
            />
            <span>{formatGold(line.item.price * line.quantity)}</span>
            <button onClick={() => cart.remove(line.item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <dl className="totals">
        <dt>Subtotal</dt>
        <dd>{formatGold(cart.subtotal)}</dd>
        <dt>King's tax</dt>
        <dd>{formatGold(cart.tax)}</dd>
        <dt>Total</dt>
        <dd className="total">{formatGold(cart.total)}</dd>
      </dl>
      <label>
        Name to call out
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
      </label>
      {status.kind === 'error' && <p className="error">{status.message}</p>}
      <button onClick={pay} disabled={cart.isEmpty || status.kind === 'paying'}>
        {status.kind === 'paying' ? 'Counting coins...' : `Pay ${formatGold(cart.total)}`}
      </button>
      <button className="link" onClick={onBack}>
        Keep ordering
      </button>
    </section>
  );
}
