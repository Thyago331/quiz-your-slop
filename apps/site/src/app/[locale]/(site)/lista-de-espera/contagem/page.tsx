import { notFound } from 'next/navigation';
import { Janela } from '@quiz/ui';
import { formatarNumero } from '@quiz/i18n';
import { auth } from '@/auth';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { banco } from '@/servidor/banco';
import { contarInscricoes, ehDono, IAS_DA_LISTA } from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';
import estiloSite from '../../Site.module.css';
import estilo from '../Lista.module.css';

export async function generateMetadata() {
  return { title: LISTA[await idiomaDaRequisicao()].contagemTitulo };
}

// Só o dono do projeto (DONO_GITHUB_ID) vê; para qualquer outro, a página não existe.
export default async function ContagemDaLista() {
  const sessao = await auth();
  if (!ehDono(sessao?.user.githubId)) notFound();
  const contagem = await contarInscricoes(banco());
  const idioma = await idiomaDaRequisicao();
  const t = LISTA[idioma];
  const numero = (n: number) => formatarNumero(idioma, n);
  return (
    <article className={estiloSite.artigo}>
      <h1>{t.contagemTitulo}</h1>
      <Janela>
        <p>
          {t.contagemTotal} <span className={estiloSite.ouro}>{numero(contagem.total)}</span>
        </p>
        <table className={estilo.tabela}>
          <tbody>
            {IAS_DA_LISTA.map((ia) => (
              <tr key={ia}>
                <th scope="row">{t.ias[ia]}</th>
                <td>{numero(contagem.porIa[ia])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Janela>
      <Janela titulo={t.contagemOutras}>
        {contagem.outras.length ? (
          <table className={estilo.tabela}>
            <tbody>
              {contagem.outras.map((o) => (
                <tr key={o.nome}>
                  <th scope="row">{o.nome}</th>
                  <td>{numero(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={estiloSite.apagado}>{t.contagemVazia}</p>
        )}
      </Janela>
    </article>
  );
}
