import Link from 'next/link';
import type { Opcao } from '@quiz/jogo';
import { DESAFIOS } from '@quiz/taverna';
import { EvidenciaNaTela, Janela, Texto } from '@quiz/ui';
import { auth } from '@/auth';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINA, TAVERNA } from '@/textos/taverna';
import { MapaDaVitrine } from '@/vitrine/MapaDaVitrine';
import estilo from '../Site.module.css';

export function generateMetadata() {
  return metadadosDaPagina(PAGINA);
}

// O primeiro Desafio da API de Pedidos (o mais fácil); é texto de exemplo, não uma Expedição.
const EXEMPLO = DESAFIOS['api-pedidos']?.find((d) => d.formato === 'multipla_escolha');

const rotuloDaOpcao = (o: Opcao) => ('texto' in o ? o.texto : o.caminho);

export default async function VitrineDaTaverna() {
  const sessao = await auth();
  const certas = new Set(EXEMPLO?.gabarito);
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.titulo}</h1>
      <Janela>
        <p>{TAVERNA.introducao}</p>
      </Janela>

      <Janela titulo={TAVERNA.mapaTitulo}>
        <p>{TAVERNA.mapaTexto}</p>
        <MapaDaVitrine rotulo={TAVERNA.mapaRotulo} ajuda={TAVERNA.selecione} />
      </Janela>

      {EXEMPLO && (
        <Janela titulo={TAVERNA.desafioTitulo}>
          <p className={estilo.apagado}>
            {TAVERNA.desafioTexto} {TAVERNA.formatos[EXEMPLO.formato]}
          </p>
          <p className="desafio-enunciado">
            <Texto>{EXEMPLO.enunciado}</Texto>
          </p>
          <ul className={estilo.opcoes}>
            {EXEMPLO.opcoes.map((o) => (
              <li key={o.id}>
                {o.id.toUpperCase()}) <Texto>{rotuloDaOpcao(o)}</Texto>
              </li>
            ))}
          </ul>
          <details className={estilo.resposta}>
            <summary>{TAVERNA.verResposta}</summary>
            <p className="texto-ok">
              {TAVERNA.gabarito}{' '}
              {EXEMPLO.opcoes
                .filter((o) => certas.has(o.id))
                .map((o) => (
                  <Texto key={o.id}>{`${o.id.toUpperCase()}) ${rotuloDaOpcao(o)}`}</Texto>
                ))}
            </p>
            <p>
              <Texto>{EXEMPLO.explicacao}</Texto>
            </p>
            {EXEMPLO.evidencias.map((ev) => (
              <EvidenciaNaTela key={`${ev.caminho}:${ev.linha_inicio}`} evidencia={ev} />
            ))}
          </details>
        </Janela>
      )}

      <Janela>
        <p>{TAVERNA.convite}</p>
        <ul className={estilo.menu}>
          <li>
            {sessao ? (
              <Link href="/tutorial" className={estilo.atual}>
                {TAVERNA.jogar}
              </Link>
            ) : (
              <Link href="/entrar?de=/tutorial" className={estilo.atual}>
                {TAVERNA.entrar}
              </Link>
            )}
          </li>
        </ul>
      </Janela>
    </article>
  );
}
