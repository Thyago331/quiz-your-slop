import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { banco } from '@/servidor/banco';
import { inscricaoDoJogador } from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';
import { FormularioLista } from './FormularioLista';
import estiloSite from '../Site.module.css';

export async function generateMetadata() {
  return { title: LISTA[await idiomaDaRequisicao()].titulo };
}

export default async function ListaDeEspera() {
  const t = LISTA[await idiomaDaRequisicao()];
  const sessao = await auth();
  // O layout já garantiu a sessão.
  const atual = sessao ? await inscricaoDoJogador(banco(), sessao.user.jogadorId) : null;
  return (
    <article className={estiloSite.artigo}>
      <h1>{t.titulo}</h1>
      <Janela>
        <p>{t.introducao}</p>
        <p className={estiloSite.apagado}>
          {t.enquanto} <Link href="/tutorial">▶ {t.jogarTutorial}</Link>
        </p>
      </Janela>
      <Janela>
        {atual && (
          <p>
            {t.atual}{' '}
            <span className={estiloSite.ouro}>
              {atual.ia === 'outra' ? atual.outra : t.ias[atual.ia]}
            </span>
          </p>
        )}
        <FormularioLista atual={atual} />
        <p className={`${estiloSite.apagado} ${estiloSite.pequeno}`}>{t.privacidade}</p>
      </Janela>
    </article>
  );
}
