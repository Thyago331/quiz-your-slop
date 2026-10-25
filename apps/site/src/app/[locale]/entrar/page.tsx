import { redirect } from 'next/navigation';
import { formatar } from '@quiz/i18n';
import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { caminhoNoIdioma } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { destinoSeguro } from '@/servidor/destino';
import { ENTRAR } from '@/textos/entrar';
import { MenuEntrar } from './MenuEntrar';

export async function generateMetadata() {
  return { title: ENTRAR[await idiomaDaRequisicao()].titulo };
}

type Props = { searchParams: Promise<{ de?: string | string[]; error?: string | string[] }> };

export default async function PaginaEntrar({ searchParams }: Props) {
  const { de, error } = await searchParams;
  const idioma = await idiomaDaRequisicao();
  const t = ENTRAR[idioma];
  // Sem `de`, volta à inicial no idioma da tela.
  const destino = de ? destinoSeguro(de) : caminhoNoIdioma(idioma, '/');
  if (await auth()) redirect(destino);

  return (
    <main>
      <Janela titulo={t.titulo}>
        <p>{t.conta}</p>
        <p>
          <strong>{t.escopo}</strong>
        </p>
        {error && <p role="alert">{formatar(t.erro, { erro: String(error) })}</p>}
        <MenuEntrar de={destino} />
      </Janela>
    </main>
  );
}
