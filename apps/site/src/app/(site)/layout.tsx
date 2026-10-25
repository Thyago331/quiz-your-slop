import type { ReactNode } from 'react';
import { REPOSITORIO } from '@/seo/site';
import { SITE } from '@/textos/site';
import { CabecalhoSite } from './CabecalhoSite';
import estilo from './Site.module.css';

/** A moldura das páginas do site: cabeçalho com navegação, conteúdo e rodapé. */
export default function LayoutSite({ children }: { children: ReactNode }) {
  return (
    <div className={estilo.site}>
      <CabecalhoSite />
      <main className={estilo.conteudo}>{children}</main>
      <footer className={estilo.rodape}>
        {SITE.rodape.join(' · ')} · <a href={REPOSITORIO}>{SITE.repositorio}</a>
      </footer>
    </div>
  );
}
