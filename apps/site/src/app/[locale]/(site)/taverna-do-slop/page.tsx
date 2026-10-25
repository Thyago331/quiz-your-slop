import NextLink from 'next/link';
import type { Opcao } from '@quiz/jogo';
import { ETIQUETA, IDIOMA_PADRAO, MENSAGENS } from '@quiz/i18n';
import { DESAFIOS, desafiosDaRegiao } from '@quiz/taverna';
import { EvidenciaNaTela, Janela, Texto } from '@quiz/ui';
import { auth } from '@/auth';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINA, TAVERNA } from '@/textos/taverna';
import { MapaDaVitrine } from '@/vitrine/MapaDaVitrine';
import estilo from '../Site.module.css';

export async function generateMetadata() {
  return metadadosDaPagina(PAGINA, await idiomaDaRequisicao());
}

const REGIAO_DO_EXEMPLO = 'api-pedidos';

const rotuloDaOpcao = (o: Opcao) => ('texto' in o ? o.texto : o.caminho);

export default async function VitrineDaTaverna() {
  const sessao = await auth();
  const idioma = await idiomaDaRequisicao();
  const t = TAVERNA[idioma];
  // O primeiro Desafio da API de Pedidos (o mais fácil); é texto de exemplo, não uma Expedição.
  const banco = desafiosDaRegiao(REGIAO_DO_EXEMPLO, idioma);
  const exemplo = banco.find((d) => d.formato === 'multipla_escolha');
  // Até o #30, fora do português o Desafio vem em português: avisado e marcado com lang.
  const emPortugues = idioma !== IDIOMA_PADRAO && banco === DESAFIOS[REGIAO_DO_EXEMPLO];
  const lang = emPortugues ? ETIQUETA[IDIOMA_PADRAO] : undefined;
  const certas = new Set(exemplo?.gabarito);
  return (
    <article className={estilo.artigo}>
      <h1>{PAGINA.textos[idioma].titulo}</h1>
      <Janela>
        <p>{t.introducao}</p>
      </Janela>

      <Janela titulo={t.mapaTitulo}>
        <p>{t.mapaTexto}</p>
        <MapaDaVitrine rotulo={t.mapaRotulo} ajuda={t.selecione} />
      </Janela>

      {exemplo && (
        <Janela titulo={t.desafioTitulo}>
          <p className={estilo.apagado}>
            {t.desafioTexto} {MENSAGENS[idioma].jogo.formatos[exemplo.formato]}
          </p>
          {emPortugues && <p className={estilo.apagado}>{t.desafioEmPortugues}</p>}
          <div lang={lang}>
            <p className="desafio-enunciado">
              <Texto>{exemplo.enunciado}</Texto>
            </p>
            <ul className={estilo.opcoes}>
              {exemplo.opcoes.map((o) => (
                <li key={o.id}>
                  {o.id.toUpperCase()}) <Texto>{rotuloDaOpcao(o)}</Texto>
                </li>
              ))}
            </ul>
          </div>
          <details className={estilo.resposta}>
            <summary>{t.verResposta}</summary>
            <p className="texto-ok">
              {t.gabarito}{' '}
              {exemplo.opcoes
                .filter((o) => certas.has(o.id))
                .map((o) => (
                  <Texto key={o.id}>{`${o.id.toUpperCase()}) ${rotuloDaOpcao(o)}`}</Texto>
                ))}
            </p>
            <p lang={lang}>
              <Texto>{exemplo.explicacao}</Texto>
            </p>
            {exemplo.evidencias.map((ev) => (
              <EvidenciaNaTela key={`${ev.caminho}:${ev.linha_inicio}`} evidencia={ev} />
            ))}
          </details>
        </Janela>
      )}

      <Janela>
        <p>{t.convite}</p>
        <ul className={estilo.menu}>
          <li>
            {sessao ? (
              <Link href="/tutorial" className={estilo.atual}>
                {t.jogar}
              </Link>
            ) : (
              <NextLink href={caminhoDoLogin(idioma, '/tutorial')} className={estilo.atual}>
                {t.entrar}
              </NextLink>
            )}
          </li>
        </ul>
      </Janela>
    </article>
  );
}
