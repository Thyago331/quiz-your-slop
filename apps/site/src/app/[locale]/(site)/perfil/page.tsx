import { CALIBRAGEM_PADRAO, ID_AVENTURA_TUTORIAL, tituloDoXp } from '@quiz/jogo';
import { formatar, formatarDataHora, formatarNumero, nomeDoTitulo } from '@quiz/i18n';
import { Barra, classeNaTela, Janela, Sprite } from '@quiz/ui';
import { auth } from '@/auth';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { banco } from '@/servidor/banco';
import { PROGRESSO_ZERADO, progressoDoJogador } from '@/servidor/progresso';
import { REPOSITORIO } from '@/seo/site';
import { ENVIADO, PERFIL } from '@/textos/perfil';
import estiloSite from '../Site.module.css';
import estilo from './Perfil.module.css';

export async function generateMetadata() {
  return { title: PERFIL[await idiomaDaRequisicao()].titulo };
}

/** A ficha de personagem (protótipo, variante D, ?tela=perfil) e "O que é enviado" (?tela=enviado). */
export default async function Perfil() {
  const sessao = await auth();
  const idioma = await idiomaDaRequisicao();
  const t = PERFIL[idioma];
  const e = ENVIADO[idioma];
  const numero = (n: number) => formatarNumero(idioma, n);
  const titulo = (nome: string) => nomeDoTitulo(nome, idioma);
  // O layout já garantiu a sessão.
  const guardado = sessao ? await progressoDoJogador(banco(), sessao.user.jogadorId) : null;
  const { xp, estatisticas, aventuras } = guardado?.progresso ?? PROGRESSO_ZERADO;
  const { atual, proximo } = tituloDoXp(xp);
  const passo = proximo ? (xp - atual.xpMinimo) / (proximo.xpMinimo - atual.xpMinimo) : 1;
  const classe = classeNaTela(aventuras[0]?.classe, idioma);

  return (
    <article className={estiloSite.artigo}>
      <h1>{t.titulo}</h1>
      <div className={estilo.ficha}>
        <Janela className={estilo.retrato}>
          <Sprite nome={classe?.sprite ?? 'heroi'} escala={10} />
          <div className={`px ${estilo.login}`}>{sessao?.user.login}</div>
          <div className={estiloSite.ouro}>{titulo(atual.nome)}</div>
        </Janela>

        <Janela titulo={t.ficha}>
          <p>
            {t.xp} {numero(xp)}{' '}
            <Barra valor={Math.round(passo * 10)} maximo={10} rotulo={t.xpAteProximo} />{' '}
            <span className={estiloSite.apagado}>
              {proximo
                ? formatar(t.faltam, {
                    xp: numero(proximo.xpMinimo - xp),
                    proximo: titulo(proximo.nome),
                  })
                : t.noTopo}
            </span>
          </p>
          <p className={estiloSite.apagado}>{t.escada}</p>
          <ol className={estilo.escada}>
            {CALIBRAGEM_PADRAO.titulos.map((x) => (
              <li key={x.nome} className={xp >= x.xpMinimo ? estiloSite.ouro : estilo.apagado}>
                {titulo(x.nome)}{' '}
                <span className={estiloSite.pequeno}>({numero(x.xpMinimo)} XP)</span>
              </li>
            ))}
          </ol>
          <ul className={estilo.estatisticas}>
            <li>
              ⚔ {t.estatisticas.expedicoes}: {numero(estatisticas.expedicoes)}
            </li>
            <li>
              ✔ {t.estatisticas.acertos}: {numero(estatisticas.acertos)}
            </li>
            <li>
              🏹 {t.estatisticas.contestacoes}: {numero(estatisticas.contestacoes_vencidas)}
            </li>
          </ul>

          <h2 className="janela-titulo">{t.aventuras}</h2>
          {aventuras.length === 0 ? (
            <p>
              {t.semAventuras} <Link href="/tutorial">▶ {t.jogarTutorial}</Link>
            </p>
          ) : (
            <ul className={estilo.aventuras}>
              {aventuras.map((a) => {
                const tutorial = a.id === ID_AVENTURA_TUTORIAL;
                return (
                  <li key={a.id}>
                    {tutorial ? t.tutorial : formatar(t.aventura, { id: a.id.slice(0, 8) })} ·{' '}
                    {classeNaTela(a.classe, idioma)?.nome}{' '}
                    <Barra valor={Math.round(a.progresso / 10)} maximo={10} rotulo={t.progresso} />{' '}
                    {a.progresso}%
                    {!tutorial && (
                      <span className={`${estiloSite.apagado} ${estiloSite.pequeno}`}>
                        {' '}
                        — {t.nomeLocal}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Janela>
      </div>

      <Janela titulo={e.titulo}>
        <section id="enviado">
          <p className={estiloSite.ouro}>
            {guardado?.ultimoEnvioEm
              ? formatar(e.ultimo, { quando: formatarDataHora(idioma, guardado.ultimoEnvioEm) })
              : e.nenhum}
          </p>
          <ul className={estiloSite.lista}>
            {e.sobe.map((item) => (
              <li key={item}>✔ {item}</li>
            ))}
          </ul>
          <p className={estiloSite.nunca}>✘ {e.nunca}</p>
          <p className={estiloSite.apagado}>{e.conta}</p>
          {guardado?.ultimoEnvio && (
            <>
              <p className={estiloSite.apagado}>{e.json}</p>
              <pre className={estiloSite.codigo} data-testid="ultimo-envio">
                {JSON.stringify(guardado.ultimoEnvio, null, 2)}
              </pre>
            </>
          )}
          <p className={estiloSite.apagado}>
            {e.bug} <a href={`${REPOSITORIO}/issues`}>▶ issues</a>
          </p>
        </section>
      </Janela>
    </article>
  );
}
