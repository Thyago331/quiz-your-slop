import { formatGold } from '@taverna/shared/money';
import type { Item } from '@taverna/shared/types';

interface Props {
  item: Item;
  quantityInCart: number;
  onAdd: () => void;
}

export function ItemCard({ item, quantityInCart, onAdd }: Props) {
  return (
    <article className={item.available ? 'item-card' : 'item-card unavailable'}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <footer>
        <span className="price">{formatGold(item.price)}</span>
        <button onClick={onAdd} disabled={!item.available}>
          {item.available ? 'Add to tab' : 'Off the menu'}
        </button>
        {quantityInCart > 0 && <span className="in-cart">x{quantityInCart}</span>}
      </footer>
    </article>
  );
}
