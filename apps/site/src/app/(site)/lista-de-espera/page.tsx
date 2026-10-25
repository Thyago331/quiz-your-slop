import Link from 'next/link';
import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { inscricaoDoJogador } from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';
import { FormularioLista } from './FormularioLista';
import estiloSite from '../Site.module.css';

export const metadata = { title: LISTA.titulo };

export default async function ListaDeEspera() {
  const sessao = await auth();
  // O layout já garantiu a sessão.
  const atual = sessao ? await inscricaoDoJogador(banco(), sessao.user.jogadorId) : null;
  return (
    <article className={estiloSite.artigo}>
      <h1>{LISTA.titulo}</h1>
      <Janela>
        <p>{LISTA.introducao}</p>
        <p className={estiloSite.apagado}>
          {LISTA.enquanto} <Link href="/tutorial">▶ {LISTA.jogarTutorial}</Link>
        </p>
      </Janela>
      <Janela>
        {atual && (
          <p>
            {LISTA.atual}{' '}
            <span className={estiloSite.ouro}>
              {atual.ia === 'outra' ? atual.outra : LISTA.ias[atual.ia]}
            </span>
          </p>
        )}
        <FormularioLista atual={atual} />
        <p className={`${estiloSite.apagado} ${estiloSite.pequeno}`}>{LISTA.privacidade}</p>
      </Janela>
    </article>
  );
}
