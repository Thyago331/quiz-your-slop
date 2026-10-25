import { Janela } from '@quiz/ui';
import { COMANDOS_DA_SECAO, SOMAS, urlDaUltimaVersao } from '@/baixar/artefatos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINA as BAIXAR } from '@/textos/baixar';
import { PAGINA, VERIFICAR } from '@/textos/verificar';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

export default async function Verificar() {
  const idioma = await idiomaDaRequisicao();
  const { resumo, secoes, voltar } = VERIFICAR[idioma];
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      <Janela>
        <p>{resumo}</p>
      </Janela>
      {secoes.map((secao) => {
        const comandos = COMANDOS_DA_SECAO[secao.id] ?? [];
        return (
          <Janela key={secao.id} titulo={secao.titulo}>
            <section id={secao.id}>
              {secao.paragrafos.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {secao.passos.length > 0 && (
                <ol>
                  {secao.passos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              )}
              {secao.id === 'checksum' && (
                <p>
                  <a href={urlDaUltimaVersao(SOMAS)}>▶ {SOMAS}</a>
                </p>
              )}
              {secao.comandos.map((rotulo, i) => (
                <div key={rotulo}>
                  <p className={estilo.apagado}>{rotulo}</p>
                  <pre className={estilo.codigo}>{comandos[i]}</pre>
                </div>
              ))}
            </section>
          </Janela>
        );
      })}
      <p>
        <Link href={BAIXAR.caminho}>▶ {voltar}</Link>
      </p>
    </article>
  );
}
