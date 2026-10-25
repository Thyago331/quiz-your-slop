import type { Category } from '@taverna/shared/types';
import { CATEGORIES } from '@taverna/shared/types';

const LABELS: Record<Category, string> = {
  drinks: 'Drinks',
  stews: 'Stews',
  roasts: 'Roasts',
  sweets: 'Sweets',
};

interface Props {
  value: Category | 'all';
  onChange: (value: Category | 'all') => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <nav className="category-filter">
      <button className={value === 'all' ? 'active' : ''} onClick={() => onChange('all')}>
        Everything
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          className={value === category ? 'active' : ''}
          onClick={() => onChange(category)}
        >
          {LABELS[category]}
        </button>
      ))}
    </nav>
  );
}
