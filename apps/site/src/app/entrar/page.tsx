import { redirect } from 'next/navigation';
import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { destinoSeguro } from '@/servidor/destino';
import { MenuEntrar } from './MenuEntrar';

export const metadata = { title: 'Entrar · Quiz your slop' };

type Props = { searchParams: Promise<{ de?: string | string[]; error?: string | string[] }> };

export default async function PaginaEntrar({ searchParams }: Props) {
  const { de, error } = await searchParams;
  const destino = destinoSeguro(de);
  if (await auth()) redirect(destino);

  return (
    <main>
      <Janela titulo="Entrar">
        <p>Para jogar, inclusive o Tutorial, é preciso uma conta. O login é só com GitHub.</p>
        <p>
          <strong>
            Entrar com GitHub não dá acesso aos seus repositórios — só ao seu nome, avatar e e-mail.
          </strong>
        </p>
        {error && <p role="alert">Não deu para entrar ({String(error)}). Tente de novo.</p>}
        <MenuEntrar de={destino} />
      </Janela>
    </main>
  );
}
