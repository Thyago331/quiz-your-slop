import { redirect } from 'next/navigation';
import { formatar } from '@quiz/i18n';
import { Janela } from '@quiz/ui';
import { auth } from '@/auth';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import {
  consultaDoPedido,
  lerPedidoDeConexao,
  VALIDADE_DO_TOKEN_EM_DIAS,
} from '@/servidor/desktop';
import { ENTRAR_DESKTOP } from '@/textos/entrar-desktop';
import { ConfirmarDesktop } from './ConfirmarDesktop';

export async function generateMetadata() {
  return {
    title: ENTRAR_DESKTOP[await idiomaDaRequisicao()].titulo,
    robots: { index: false, follow: false },
  };
}

type Parametro = string | string[] | undefined;
type Props = {
  searchParams: Promise<{ porta?: Parametro; estado?: Parametro; desafio?: Parametro }>;
};

/** Aberta pelo Jogo desktop no navegador: login normal do site e, depois, a confirmação. */
export default async function PaginaEntrarDesktop({ searchParams }: Props) {
  const idioma = await idiomaDaRequisicao();
  const t = ENTRAR_DESKTOP[idioma];
  const pedido = lerPedidoDeConexao(await searchParams);
  if (!pedido) {
    return (
      <main>
        <Janela titulo={t.titulo}>
          <p role="alert">{t.invalido}</p>
        </Janela>
      </main>
    );
  }
  const sessao = await auth();
  if (!sessao) redirect(caminhoDoLogin(idioma, `/entrar/desktop?${consultaDoPedido(pedido)}`));

  return (
    <main>
      <Janela titulo={t.titulo}>
        <p>
          <strong>{t.pergunta}</strong>
        </p>
        <p>{formatar(t.conta, { login: `@${sessao.user.login}` })}</p>
        <p>{formatar(t.explicacao, { dias: VALIDADE_DO_TOKEN_EM_DIAS })}</p>
        <p className="texto-erro">{t.aviso}</p>
        <ConfirmarDesktop
          porta={String(pedido.porta)}
          estado={pedido.estado}
          desafio={pedido.desafio}
        />
      </Janela>
    </main>
  );
}
