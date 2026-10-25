'use client';
import { SeletorDeIdioma, useIdioma } from '@quiz/ui';
import { Link, usePathname } from './navigation';

/**
 * PT · EN · ES na mesma página: o Link do next-intl troca o prefixo e grava o cookie NEXT_LOCALE,
 * então a escolha vale nas próximas visitas e nas páginas com conta.
 */
export function SeletorDoSite({ className }: { className?: string }) {
  const atual = useIdioma();
  const caminho = usePathname();
  return (
    <SeletorDeIdioma
      atual={atual}
      className={className}
      link={({ idioma, conteudo, props }) => (
        <Link href={caminho} locale={idioma} hrefLang={props.lang} {...props}>
          {conteudo}
        </Link>
      )}
    />
  );
}
