import { useState } from 'react';
import { CartBadge } from './components/CartBadge';
import { Checkout } from './pages/Checkout';
import { Menu } from './pages/Menu';

type Page = 'menu' | 'checkout';

export function App() {
  const [page, setPage] = useState<Page>('menu');

  return (
    <div className="tavern">
      <header className="tavern-header">
        <h1 onClick={() => setPage('menu')}>Taverna do Slop</h1>
        <CartBadge onClick={() => setPage('checkout')} />
      </header>
      <main>
        {page === 'menu' && <Menu />}
        {page === 'checkout' && <Checkout onBack={() => setPage('menu')} />}
      </main>
    </div>
  );
}
