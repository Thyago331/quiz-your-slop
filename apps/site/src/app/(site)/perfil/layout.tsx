import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata = { robots: { index: false, follow: false } };

// A ficha é de quem está jogando: sem sessão, vai ao login e volta para cá.
export default async function LayoutPerfil({ children }: { children: ReactNode }) {
  if (!(await auth())) redirect('/entrar?de=/perfil');
  return children;
}
