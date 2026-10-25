import Link from 'next/link';
import { Janela } from '@quiz/ui';
import { JsonLd } from '@/seo/JsonLd';
import { faqPage } from '@/seo/jsonld';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINA, PERGUNTAS } from '@/textos/faq';
import estilo from '../Site.module.css';

export function generateMetadata() {
  return metadadosDaPagina(PAGINA);
}

export default function Faq() {
  return (
    <article className={estilo.artigo}>
      <JsonLd dados={faqPage(PERGUNTAS)} />
      <h1>{PAGINA.titulo}</h1>
      {PERGUNTAS.map((p) => (
        <Janela key={p.id}>
          <section id={p.id}>
            <h2 className={estilo.pergunta}>{p.pergunta}</h2>
            <p>{p.resposta}</p>
            {p.link && (
              <p>
                <Link href={p.link.href}>▶ {p.link.rotulo}</Link>
              </p>
            )}
          </section>
        </Janela>
      ))}
    </article>
  );
}
