import type { ReactNode } from 'react';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { REPOSITORIO } from '@/seo/site';
import { SITE } from '@/textos/site';
import { PAGINA as VERIFICAR } from '@/textos/verificar';
import { CabecalhoSite } from './CabecalhoSite';
import estilo from './Site.module.css';

/** A moldura das páginas do site: cabeçalho com navegação, conteúdo e rodapé. */
export default async function LayoutSite({ children }: { children: ReactNode }) {
  const t = SITE[await idiomaDaRequisicao()];
  return (
    <div className={estilo.site}>
      <CabecalhoSite />
      <main className={estilo.conteudo}>{children}</main>
      <footer className={estilo.rodape}>
        {t.rodape.join(' · ')} · <a href={REPOSITORIO}>{t.repositorio}</a> ·{' '}
        <Link href={VERIFICAR.caminho}>{t.verificar}</Link>
      </footer>
    </div>
  );
}
