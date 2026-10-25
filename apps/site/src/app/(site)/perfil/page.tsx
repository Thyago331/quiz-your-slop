import Link from 'next/link';
import { CALIBRAGEM_PADRAO, ID_AVENTURA_TUTORIAL, tituloDoXp } from '@quiz/jogo';
import { Barra, CLASSES, Janela, Sprite } from '@quiz/ui';
import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { PROGRESSO_ZERADO, progressoDoJogador } from '@/servidor/progresso';
import { REPOSITORIO } from '@/seo/site';
import { ENVIADO, PERFIL } from '@/textos/perfil';
import estiloSite from '../Site.module.css';
import estilo from './Perfil.module.css';

export const metadata = { title: `${PERFIL.titulo} · Quiz your slop` };

const quando = (data: Date) =>
  data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  });

/** A ficha de personagem (protótipo, variante D, ?tela=perfil) e "O que é enviado" (?tela=enviado). */
export default async function Perfil() {
  const sessao = await auth();
  // O layout já garantiu a sessão.
  const guardado = sessao ? await progressoDoJogador(banco(), sessao.user.jogadorId) : null;
  const { xp, estatisticas, aventuras } = guardado?.progresso ?? PROGRESSO_ZERADO;
  const { atual, proximo } = tituloDoXp(xp);
  const passo = proximo ? (xp - atual.xpMinimo) / (proximo.xpMinimo - atual.xpMinimo) : 1;
  const classe = CLASSES.find((c) => c.id === aventuras[0]?.classe);

  return (
    <article className={estiloSite.artigo}>
      <h1>{PERFIL.titulo}</h1>
      <div className={estilo.ficha}>
        <Janela className={estilo.retrato}>
          <Sprite nome={classe?.sprite ?? 'heroi'} escala={10} />
          <div className={`px ${estilo.login}`}>{sessao?.user.login}</div>
          <div className={estiloSite.ouro}>{atual.nome}</div>
        </Janela>

        <Janela titulo={PERFIL.ficha}>
          <p>
            {PERFIL.xp} {xp}{' '}
            <Barra valor={Math.round(passo * 10)} maximo={10} rotulo="XP até o próximo Título" />{' '}
            <span className={estiloSite.apagado}>
              {proximo ? PERFIL.faltam(proximo.xpMinimo - xp, proximo.nome) : PERFIL.noTopo}
            </span>
          </p>
          <p className={estiloSite.apagado}>{PERFIL.escada}</p>
          <ol className={estilo.escada}>
            {CALIBRAGEM_PADRAO.titulos.map((t) => (
              <li key={t.nome} className={xp >= t.xpMinimo ? estiloSite.ouro : estilo.apagado}>
                {t.nome} <span className={estiloSite.pequeno}>({t.xpMinimo} XP)</span>
              </li>
            ))}
          </ol>
          <ul className={estilo.estatisticas}>
            <li>
              ⚔ {PERFIL.estatisticas.expedicoes}: {estatisticas.expedicoes}
            </li>
            <li>
              ✔ {PERFIL.estatisticas.acertos}: {estatisticas.acertos}
            </li>
            <li>
              🏹 {PERFIL.estatisticas.contestacoes}: {estatisticas.contestacoes_vencidas}
            </li>
          </ul>

          <h2 className="janela-titulo">{PERFIL.aventuras}</h2>
          {aventuras.length === 0 ? (
            <p>
              {PERFIL.semAventuras} <Link href="/tutorial">▶ {PERFIL.jogarTutorial}</Link>
            </p>
          ) : (
            <ul className={estilo.aventuras}>
              {aventuras.map((a) => {
                const tutorial = a.id === ID_AVENTURA_TUTORIAL;
                return (
                  <li key={a.id}>
                    {tutorial ? PERFIL.tutorial : PERFIL.aventura(a.id)} ·{' '}
                    {CLASSES.find((c) => c.id === a.classe)?.nome}{' '}
                    <Barra
                      valor={Math.round(a.progresso / 10)}
                      maximo={10}
                      rotulo={PERFIL.progresso}
                    />{' '}
                    {a.progresso}%
                    {!tutorial && (
                      <span className={`${estiloSite.apagado} ${estiloSite.pequeno}`}>
                        {' '}
                        — {PERFIL.nomeLocal}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Janela>
      </div>

      <Janela titulo={ENVIADO.titulo}>
        <section id="enviado">
          <p className={estiloSite.ouro}>
            {guardado?.ultimoEnvioEm
              ? ENVIADO.ultimo(quando(guardado.ultimoEnvioEm))
              : ENVIADO.nenhum}
          </p>
          <ul className={estiloSite.lista}>
            {ENVIADO.sobe.map((item) => (
              <li key={item}>✔ {item}</li>
            ))}
          </ul>
          <p className={estiloSite.nunca}>✘ {ENVIADO.nunca}</p>
          <p className={estiloSite.apagado}>{ENVIADO.conta}</p>
          {guardado?.ultimoEnvio && (
            <>
              <p className={estiloSite.apagado}>{ENVIADO.json}</p>
              <pre className={estiloSite.codigo} data-testid="ultimo-envio">
                {JSON.stringify(guardado.ultimoEnvio, null, 2)}
              </pre>
            </>
          )}
          <p className={estiloSite.apagado}>
            {ENVIADO.bug} <a href={`${REPOSITORIO}/issues`}>▶ issues</a>
          </p>
        </section>
      </Janela>
    </article>
  );
}
