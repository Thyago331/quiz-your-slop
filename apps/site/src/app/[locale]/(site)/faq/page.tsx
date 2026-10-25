import { Janela } from '@quiz/ui';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { JsonLd } from '@/seo/JsonLd';
import { faqPage } from '@/seo/jsonld';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINA, PERGUNTAS } from '@/textos/faq';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

export default async function Faq() {
  const idioma = await idiomaDaRequisicao();
  const perguntas = PERGUNTAS[idioma];
  return (
    <article className={estilo.artigo}>
      <JsonLd dados={faqPage(perguntas, idioma)} />
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      {perguntas.map((p) => (
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
