import { Janela } from '@quiz/ui';
import {
  ARTEFATOS,
  COMANDOS,
  PAGINA_DAS_RELEASES,
  SOMAS,
  urlDaUltimaVersao,
} from '@/baixar/artefatos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { metadadosDaPagina } from '@/seo/metadados';
import { BAIXAR, PAGINA } from '@/textos/baixar';
import { PAGINA as VERIFICAR } from '@/textos/verificar';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

const COMANDO_DO_ARTEFATO: Record<string, string | undefined> = {
  appimage: COMANDOS.executarAppImage,
  deb: COMANDOS.instalarDeb,
};

export default async function Baixar() {
  const idioma = await idiomaDaRequisicao();
  const t = BAIXAR[idioma];
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      <Janela>
        <p>{t.introducao}</p>
      </Janela>
      {ARTEFATOS.map(({ id, arquivo }) => {
        const a = t.artefatos[id];
        const comando = COMANDO_DO_ARTEFATO[id];
        return (
          <Janela key={id} titulo={a.sistema}>
            <section id={id}>
              <ul className={estilo.menu}>
                <li>
                  <a href={urlDaUltimaVersao(arquivo)} className={estilo.atual} download>
                    {a.rotulo}
                  </a>
                </li>
              </ul>
              <p className={`${estilo.apagado} ${estilo.pequeno}`}>{arquivo}</p>
              <p>
                {a.nota}
                {id === 'windows' && (
                  <>
                    {' '}
                    <Link href={`${VERIFICAR.caminho}#smartscreen`}>▶ SmartScreen</Link>
                  </>
                )}
              </p>
              {comando && <pre className={estilo.codigo}>{comando}</pre>}
            </section>
          </Janela>
        );
      })}
      <Janela titulo={t.requisitos.titulo}>
        <section id="requisitos">
          {t.requisitos.paragrafos.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      </Janela>
      <Janela titulo={t.conferir.titulo}>
        <section id="conferir">
          <p>{t.conferir.texto}</p>
          <ul className={estilo.menu}>
            <li>
              <Link href={VERIFICAR.caminho} className={estilo.atual}>
                {t.conferir.link}
              </Link>
            </li>
            <li>
              <a href={urlDaUltimaVersao(SOMAS)}>{t.conferir.somas}</a>
            </li>
            <li>
              <a href={PAGINA_DAS_RELEASES}>{t.todas}</a>
            </li>
          </ul>
        </section>
      </Janela>
    </article>
  );
}
