import { Janela } from '@quiz/ui';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { metadadosDaPagina } from '@/seo/metadados';
import { COMO_FUNCIONA, PAGINA } from '@/textos/como-funciona';
import { PAGINA as TAVERNA } from '@/textos/taverna';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

export default async function ComoFunciona() {
  const idioma = await idiomaDaRequisicao();
  const { introducao, secoes } = COMO_FUNCIONA[idioma];
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      <Janela>
        <p>{introducao}</p>
      </Janela>
      {secoes.map((secao) => (
        <Janela key={secao.id} titulo={secao.titulo}>
          <section id={secao.id}>
            {secao.paragrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        </Janela>
      ))}
      <p>
        <Link href={TAVERNA.caminho}>▶ {TAVERNA.textos[idioma].titulo}</Link>
      </p>
    </article>
  );
}
