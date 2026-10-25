import { notFound } from 'next/navigation';
import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { contarInscricoes, ehDono, IAS_DA_LISTA } from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';
import estiloSite from '../../Site.module.css';
import estilo from '../Lista.module.css';

export const metadata = { title: LISTA.contagemTitulo };

// Só o dono do projeto (DONO_GITHUB_LOGIN) vê; para qualquer outro, a página não existe.
export default async function ContagemDaLista() {
  const sessao = await auth();
  if (!ehDono(sessao?.user.login)) notFound();
  const contagem = await contarInscricoes(banco());
  return (
    <article className={estiloSite.artigo}>
      <h1>{LISTA.contagemTitulo}</h1>
      <Janela>
        <p>
          {LISTA.contagemTotal} <span className={estiloSite.ouro}>{contagem.total}</span>
        </p>
        <table className={estilo.tabela}>
          <tbody>
            {IAS_DA_LISTA.map((ia) => (
              <tr key={ia}>
                <th scope="row">{LISTA.ias[ia]}</th>
                <td>{contagem.porIa[ia]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Janela>
      <Janela titulo={LISTA.contagemOutras}>
        {contagem.outras.length ? (
          <table className={estilo.tabela}>
            <tbody>
              {contagem.outras.map((o) => (
                <tr key={o.nome}>
                  <th scope="row">{o.nome}</th>
                  <td>{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={estiloSite.apagado}>{LISTA.contagemVazia}</p>
        )}
      </Janela>
    </article>
  );
}
