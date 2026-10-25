import NextLink from 'next/link';
import { Janela, Sprite } from '@quiz/ui';
import { auth } from '@/auth';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { JsonLd } from '@/seo/JsonLd';
import { softwareApplication } from '@/seo/jsonld';
import { metadadosDaPagina } from '@/seo/metadados';
import { INICIO, PAGINA } from '@/textos/inicio';
import { PAGINA as TAVERNA } from '@/textos/taverna';
import { MapaDaVitrine } from '@/vitrine/MapaDaVitrine';
import estilo from './Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

export default async function Inicio() {
  const sessao = await auth();
  const idioma = await idiomaDaRequisicao();
  const t = INICIO[idioma];
  const [comitou, mas, leu, interrogacao] = t.chamada;
  return (
    <>
      <JsonLd dados={softwareApplication(PAGINA.textos[idioma].descricao, idioma)} />
      <section className={estilo.heroi}>
        <div>
          <h1 className={estilo.chamada}>
            {comitou}
            <br />
            {mas}
            <span className={estilo.ouro}>{leu}</span>
            {interrogacao}
          </h1>
          <p>{t.premissa}</p>
          <Janela>
            <ul className={estilo.menu}>
              <li>
                {sessao ? (
                  <Link href="/tutorial" className={estilo.atual}>
                    {t.jogarTutorial}
                  </Link>
                ) : (
                  <NextLink href={caminhoDoLogin(idioma, '/tutorial')} className={estilo.atual}>
                    {t.entrar}
                  </NextLink>
                )}
              </li>
              <li>
                <Link href={TAVERNA.caminho}>{t.conhecerTaverna}</Link>
              </li>
              <li>
                <Link href="/como-funciona">{t.saibaMais}</Link>
              </li>
            </ul>
            <div className={`${estilo.apagado} ${estilo.pequeno}`}>{t.avisoLogin}</div>
          </Janela>
          <p className={estilo.apagado}>{t.desktop}</p>
          <p>
            {t.semIa} <Link href="/lista-de-espera">▶ {t.semIaLink}</Link>
          </p>
        </div>
        <Janela className={estilo.mapa}>
          <MapaDaVitrine rotulo={TAVERNA.textos[idioma].titulo} />
        </Janela>
      </section>

      <h2 className="px">{t.passosTitulo}</h2>
      <section className={estilo.passos}>
        {t.passos.map((passo) => (
          <Janela key={passo.titulo}>
            <Sprite nome={passo.sprite} escala={5} />
            <h3>{passo.titulo}</h3>
            <div>{passo.texto}</div>
          </Janela>
        ))}
      </section>
    </>
  );
}
