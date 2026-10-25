import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata = { robots: { index: false, follow: false } };

// Só para Jogadores com conta: sem sessão, vai ao login e volta para cá.
export default async function LayoutListaDeEspera({ children }: { children: ReactNode }) {
  if (!(await auth())) redirect('/entrar?de=/lista-de-espera');
  return children;
}
