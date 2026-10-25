import Link from 'next/link';
import { Janela, Sprite } from '@quiz/ui';
import { auth } from '@/auth';
import { JsonLd } from '@/seo/JsonLd';
import { softwareApplication } from '@/seo/jsonld';
import { metadadosDaPagina } from '@/seo/metadados';
import { INICIO, PAGINA } from '@/textos/inicio';
import { MapaDaVitrine } from '@/vitrine/MapaDaVitrine';
import { PAGINA as TAVERNA } from '@/textos/taverna';
import estilo from './Site.module.css';

export function generateMetadata() {
  return metadadosDaPagina(PAGINA);
}

export default async function Inicio() {
  const sessao = await auth();
  const [comitou, mas, leu, interrogacao] = INICIO.chamada;
  return (
    <>
      <JsonLd dados={softwareApplication(PAGINA.descricao)} />
      <section className={estilo.heroi}>
        <div>
          <h1 className={estilo.chamada}>
            {comitou}
            <br />
            {mas}
            <span className={estilo.ouro}>{leu}</span>
            {interrogacao}
          </h1>
          <p>{INICIO.premissa}</p>
          <Janela>
            <ul className={estilo.menu}>
              <li>
                {sessao ? (
                  <Link href="/tutorial" className={estilo.atual}>
                    {INICIO.jogarTutorial}
                  </Link>
                ) : (
                  <Link href="/entrar?de=/tutorial" className={estilo.atual}>
                    {INICIO.entrar}
                  </Link>
                )}
              </li>
              <li>
                <Link href={TAVERNA.caminho}>{INICIO.conhecerTaverna}</Link>
              </li>
              <li>
                <Link href="/como-funciona">{INICIO.saibaMais}</Link>
              </li>
            </ul>
            <div className={`${estilo.apagado} ${estilo.pequeno}`}>{INICIO.avisoLogin}</div>
          </Janela>
          <p className={estilo.apagado}>{INICIO.desktop}</p>
          <p>
            {INICIO.semIa} <Link href="/lista-de-espera">▶ {INICIO.semIaLink}</Link>
          </p>
        </div>
        <Janela className={estilo.mapa}>
          <MapaDaVitrine rotulo={TAVERNA.titulo} />
        </Janela>
      </section>

      <h2 className="px">{INICIO.passosTitulo}</h2>
      <section className={estilo.passos}>
        {INICIO.passos.map((passo) => (
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
