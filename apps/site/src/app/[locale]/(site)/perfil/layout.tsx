import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';

export const metadata = { robots: { index: false, follow: false } };

// A ficha é de quem está jogando: sem sessão, vai ao login e volta para cá.
export default async function LayoutPerfil({ children }: { children: ReactNode }) {
  if (!(await auth())) redirect(caminhoDoLogin(await idiomaDaRequisicao(), '/perfil'));
  return children;
}
