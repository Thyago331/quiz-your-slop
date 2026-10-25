import Link from 'next/link';
import { Janela } from '@quiz/ui';
import { metadadosDaPagina } from '@/seo/metadados';
import { INTRODUCAO, PAGINA, SECOES } from '@/textos/como-funciona';
import { PAGINA as TAVERNA } from '@/textos/taverna';
import estilo from '../Site.module.css';

export function generateMetadata() {
  return metadadosDaPagina(PAGINA);
}

export default function ComoFunciona() {
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.titulo}</h1>
      <Janela>
        <p>{INTRODUCAO}</p>
      </Janela>
      {SECOES.map((secao) => (
        <Janela key={secao.id} titulo={secao.titulo}>
          <section id={secao.id}>
            {secao.paragrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        </Janela>
      ))}
      <p>
        <Link href={TAVERNA.caminho}>▶ {TAVERNA.titulo}</Link>
      </p>
    </article>
  );
}
