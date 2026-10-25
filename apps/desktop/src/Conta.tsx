import { useCallback, useEffect, useState } from 'react';
import { formatar, type Idioma, type PorIdioma } from '@quiz/i18n';
import { Janela, Menu, useIdioma, type ItemMenu } from '@quiz/ui';
import * as sistema from './sistema.ts';
import type { ErroDeLogin, Sessao } from './sistema.ts';
import { useEsc } from './TelaProvisoria.tsx';

// A conta no Jogo desktop (spec §10): o item do hub que entra ou sai, a linha de quem está
// conectado e a tela de espera enquanto o login acontece no navegador.

const pt = {
  entrar: 'Entrar com GitHub',
  sair: 'Sair',
  verificando: 'Verificando a conta…',
  conectado: 'Conectado como {nome}',
  semRede: 'Conectado (o site não respondeu agora; o progresso sincroniza depois).',
  desconectado: 'Entre para guardar o seu progresso na sua conta.',
  esperando: {
    titulo: 'Entrar com GitHub',
    abrimos:
      'Abrimos o navegador na página de login do site. Entre com o GitHub e confirme a conexão: ' +
      'o Jogo continua sozinho.',
    escopo: 'O login não dá acesso aos seus repositórios — só ao seu nome, avatar e e-mail.',
    prazo: 'A espera dura até 5 minutos.',
    cancelar: 'Cancelar',
  },
  erros: {
    recusado: 'A conexão foi cancelada no navegador.',
    tempo_esgotado: 'O tempo de espera acabou. Tente de novo.',
    navegador: 'Não deu para abrir o navegador do sistema.',
    rede: 'O site não respondeu. Confira a internet e tente de novo.',
    site: 'O site recusou a conexão ({status}). Tente de novo.',
    cofre: 'O chaveiro do sistema não está disponível ({detalhe}).',
    outro: 'Não deu para entrar ({codigo}). Tente de novo.',
  },
};

const TEXTOS: PorIdioma<typeof pt> = {
  pt,
  en: {
    entrar: 'Sign in with GitHub',
    sair: 'Sign out',
    verificando: 'Checking the account…',
    conectado: 'Signed in as {nome}',
    semRede: 'Signed in (the site did not answer just now; progress syncs later).',
    desconectado: 'Sign in to keep your progress in your account.',
    esperando: {
      titulo: 'Sign in with GitHub',
      abrimos:
        "We opened the browser on the site's sign-in page. Sign in with GitHub and confirm the " +
        'connection: the Game carries on by itself.',
      escopo:
        'Signing in gives no access to your repositories — only to your name, avatar and email.',
      prazo: 'The wait lasts up to 5 minutes.',
      cancelar: 'Cancel',
    },
    erros: {
      recusado: 'The connection was cancelled in the browser.',
      tempo_esgotado: 'The wait ran out. Try again.',
      navegador: "Could not open the system's browser.",
      rede: 'The site did not answer. Check the internet and try again.',
      site: 'The site refused the connection ({status}). Try again.',
      cofre: "The system's keychain is not available ({detalhe}).",
      outro: 'Could not sign in ({codigo}). Try again.',
    },
  },
  es: {
    entrar: 'Entrar con GitHub',
    sair: 'Salir',
    verificando: 'Verificando la cuenta…',
    conectado: 'Conectado como {nome}',
    semRede: 'Conectado (el sitio no respondió ahora; el progreso se sincroniza después).',
    desconectado: 'Entra para guardar tu progreso en tu cuenta.',
    esperando: {
      titulo: 'Entrar con GitHub',
      abrimos:
        'Abrimos el navegador en la página de inicio de sesión del sitio. Entra con GitHub y ' +
        'confirma la conexión: el Juego sigue solo.',
      escopo:
        'El inicio de sesión no da acceso a tus repositorios — solo a tu nombre, avatar y correo.',
      prazo: 'La espera dura hasta 5 minutos.',
      cancelar: 'Cancelar',
    },
    erros: {
      recusado: 'La conexión se canceló en el navegador.',
      tempo_esgotado: 'Se acabó el tiempo de espera. Inténtalo de nuevo.',
      navegador: 'No se pudo abrir el navegador del sistema.',
      rede: 'El sitio no respondió. Revisa internet e inténtalo de nuevo.',
      site: 'El sitio rechazó la conexión ({status}). Inténtalo de nuevo.',
      cofre: 'El llavero del sistema no está disponible ({detalhe}).',
      outro: 'No se pudo entrar ({codigo}). Inténtalo de nuevo.',
    },
  },
};

/** O id do item da conta no hub. */
export const ITEM_DA_CONTA = 'conta';

export type Conta = {
  /** `null` enquanto confere o token guardado. */
  sessao: Sessao | null;
  entrando: boolean;
  erro: ErroDeLogin | null;
  /** Entra (abrindo o navegador) ou sai, conforme a sessão. */
  alternar: () => void;
  cancelar: () => void;
};

const DESCONECTADO: Sessao = { estado: 'desconectado' };
const erroDe = (e: unknown): ErroDeLogin =>
  sistema.ehErroDeLogin(e) ? e : { codigo: 'io', detalhe: String(e) };

/** O estado da conta e as ações, para o hub. */
export function useConta(idioma: Idioma): Conta {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<ErroDeLogin | null>(null);

  useEffect(() => {
    let vivo = true;
    sistema
      .sessaoAtual()
      .then((s) => vivo && setSessao(s))
      // Sem a camada Rust (ou com o chaveiro fora do ar), o Jogo segue sem conta.
      .catch(() => vivo && setSessao(DESCONECTADO));
    return () => {
      vivo = false;
    };
  }, []);

  const alternar = useCallback(() => {
    setErro(null);
    if (sessao && sessao.estado !== 'desconectado') {
      sistema.sair().then(setSessao, (e: unknown) => setErro(erroDe(e)));
      return;
    }
    setEntrando(true);
    sistema
      .entrar(idioma)
      .then(setSessao, (e: unknown) => {
        const lido = erroDe(e);
        if (lido.codigo !== 'cancelado') setErro(lido);
      })
      .finally(() => setEntrando(false));
  }, [idioma, sessao]);

  const cancelar = useCallback(() => {
    void sistema.cancelarEntrada().catch(() => {});
  }, []);

  return { sessao, entrando, erro, alternar, cancelar };
}

/** O item do hub: "Entrar com GitHub" ou "Sair". */
export function itemDaConta({ sessao }: Conta, idioma: Idioma): ItemMenu {
  const t = TEXTOS[idioma];
  if (!sessao) return { id: ITEM_DA_CONTA, rotulo: t.verificando, desabilitado: true };
  return { id: ITEM_DA_CONTA, rotulo: sessao.estado === 'desconectado' ? t.entrar : t.sair };
}

function mensagemDoErro(t: typeof pt, erro: ErroDeLogin): string {
  switch (erro.codigo) {
    case 'recusado':
    case 'tempo_esgotado':
    case 'navegador':
    case 'rede':
      return t.erros[erro.codigo];
    case 'site':
      return formatar(t.erros.site, { status: erro.detalhe.status });
    case 'cofre':
      return formatar(t.erros.cofre, { detalhe: erro.detalhe });
    default:
      return formatar(t.erros.outro, { codigo: erro.codigo });
  }
}

/** Abaixo do menu do hub: quem está conectado, ou o erro do último login. */
export function ResumoDaConta({ sessao, erro }: Conta) {
  const t = TEXTOS[useIdioma()];
  let texto: string | null = null;
  if (sessao?.estado === 'conectado') {
    const { nome, login } = sessao.perfil;
    texto = formatar(t.conectado, { nome: nome ? `${nome} (@${login})` : `@${login}` });
  } else if (sessao?.estado === 'sem_rede') texto = t.semRede;
  else if (sessao) texto = t.desconectado;
  return (
    <>
      {texto && <p className="conta-resumo">{texto}</p>}
      {erro && (
        <p role="alert" className="texto-erro">
          {mensagemDoErro(t, erro)}
        </p>
      )}
    </>
  );
}

/** Enquanto o login acontece no navegador. */
export function TelaDeEntrada({ onCancelar }: { onCancelar: () => void }) {
  const t = TEXTOS[useIdioma()].esperando;
  useEsc(onCancelar);
  return (
    <main className="tela-provisoria">
      <Janela titulo={t.titulo} className="conta-espera">
        <p>{t.abrimos}</p>
        <p>
          <strong>{t.escopo}</strong>
        </p>
        <p className="tela-provisoria-ajuda">{t.prazo}</p>
        <Menu
          rotulo={t.titulo}
          itens={[{ id: 'cancelar', rotulo: t.cancelar }]}
          onEscolher={onCancelar}
          autoFoco
        />
      </Janela>
    </main>
  );
}
