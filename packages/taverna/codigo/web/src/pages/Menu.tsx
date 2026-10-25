import type { Category, Item } from '@taverna/shared/types';
import { useEffect, useState } from 'react';
import { fetchItems } from '../api/items';
import { useCart } from '../cart/useCart';
import { CategoryFilter } from '../components/CategoryFilter';
import { ItemCard } from '../components/ItemCard';

export function Menu() {
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = category === 'all' ? items : items.filter((item) => item.category === category);

  if (loading) return <p>The barkeep is fetching the menu...</p>;
  if (error) return <p className="error">Could not read the menu: {error}</p>;

  return (
    <section className="menu">
      <h2>Today's menu</h2>
      <CategoryFilter value={category} onChange={setCategory} />
      <div className="menu-grid">
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            quantityInCart={cart.quantityOf(item.id)}
            onAdd={() => cart.add(item)}
          />
        ))}
      </div>
      {visible.length === 0 && <p>Nothing in this category tonight.</p>}
    </section>
  );
}
