import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Janela } from '@quiz/ui';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Janela>
      <h1>Quiz your slop</h1>
    </Janela>
  </StrictMode>,
);
