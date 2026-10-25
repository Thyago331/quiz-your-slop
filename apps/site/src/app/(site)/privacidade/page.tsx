import { Janela } from '@quiz/ui';
import { metadadosDaPagina } from '@/seo/metadados';
import { REPOSITORIO } from '@/seo/site';
import { NUNCA, PAGINA, RESUMO, SECOES, SOBE } from '@/textos/privacidade';
import estilo from '../Site.module.css';

export function generateMetadata() {
  return metadadosDaPagina(PAGINA);
}

export default function Privacidade() {
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.titulo}</h1>
      <Janela>
        <p>{RESUMO}</p>
      </Janela>
      <Janela titulo={SOBE.titulo}>
        <section id="servidor">
          <ul className={estilo.lista}>
            {SOBE.itens.map((item) => (
              <li key={item}>✔ {item}</li>
            ))}
          </ul>
          <p className={estilo.apagado}>{SOBE.exemploRotulo}</p>
          <pre className={estilo.codigo}>{JSON.stringify(SOBE.exemplo, null, 2)}</pre>
        </section>
      </Janela>
      <Janela titulo={NUNCA.titulo}>
        <p id="nunca" className={estilo.nunca}>
          ✘ {NUNCA.texto}
        </p>
      </Janela>
      {SECOES.map((secao) => (
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
