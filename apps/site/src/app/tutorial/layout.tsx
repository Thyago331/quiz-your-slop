import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Conta obrigatória para tudo, inclusive o Tutorial (spec §10): sem sessão, vai ao login e volta.
export default async function LayoutTutorial({ children }: { children: ReactNode }) {
  if (!(await auth())) redirect('/entrar?de=/tutorial');
  return children;
}
