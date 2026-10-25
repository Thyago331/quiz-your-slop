import { useCart } from '../cart/useCart';

export function CartBadge({ onClick }: { onClick: () => void }) {
  const { count } = useCart();
  return (
    <button className="cart-badge" onClick={onClick} aria-label="Open your tab">
      Your tab {count > 0 && <span className="count">{count}</span>}
    </button>
  );
}
