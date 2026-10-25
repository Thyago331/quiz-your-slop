import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@quiz/ui/estilo.css';
import './estilo.css';
import { Jogo } from './Jogo.tsx';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Jogo />
  </StrictMode>,
);
