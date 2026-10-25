import Link from 'next/link';
import { Janela } from '@quiz/ui';
import { CabecalhoJogador } from './CabecalhoJogador';

export default function Inicio() {
  return (
    <main>
      <CabecalhoJogador />
      <Janela>
        <h1>Quiz your slop</h1>
        <p>learn · gamification · unslop your code</p>
        <p>
          <Link href="/tutorial">▶ Tutorial — Taverna do Slop</Link>
        </p>
      </Janela>
    </main>
  );
}
