import { Janela } from '@quiz/ui';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { metadadosDaPagina } from '@/seo/metadados';
import { REPOSITORIO } from '@/seo/site';
import { EXEMPLO_DE_ENVIO, PAGINA, PRIVACIDADE } from '@/textos/privacidade';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

export default async function Privacidade() {
  const idioma = await idiomaDaRequisicao();
  const { resumo, sobe, nunca, secoes } = PRIVACIDADE[idioma];
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      <Janela>
        <p>{resumo}</p>
      </Janela>
      <Janela titulo={sobe.titulo}>
        <section id="servidor">
          <ul className={estilo.lista}>
            {sobe.itens.map((item) => (
              <li key={item}>✔ {item}</li>
            ))}
          </ul>
          <p className={estilo.apagado}>{sobe.exemploRotulo}</p>
          <pre className={estilo.codigo}>{JSON.stringify(EXEMPLO_DE_ENVIO, null, 2)}</pre>
        </section>
      </Janela>
      <Janela titulo={nunca.titulo}>
        <p id="nunca" className={estilo.nunca}>
          ✘ {nunca.texto}
        </p>
        <p>
          <Link href="/perfil#enviado">▶ {nunca.link}</Link>
        </p>
      </Janela>
      {secoes.map((secao) => (
        <Janela key={secao.id} titulo={secao.titulo}>
          <section id={secao.id}>
            {secao.paragrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {secao.id === 'contato' && (
              <p>
                <a href={`${REPOSITORIO}/issues`}>▶ {REPOSITORIO.replace('https://', '')}/issues</a>
              </p>
            )}
          </section>
        </Janela>
      ))}
    </article>
  );
}
