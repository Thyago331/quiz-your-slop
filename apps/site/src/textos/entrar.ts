// Textos da tela de login (spec §10).
import type { PorIdioma } from '@quiz/i18n';

const pt = {
  titulo: 'Entrar',
  conta: 'Para jogar, inclusive o Tutorial, é preciso uma conta. O login é só com GitHub.',
  escopo:
    'Entrar com GitHub não dá acesso aos seus repositórios — só ao seu nome, avatar e e-mail.',
  erro: 'Não deu para entrar ({erro}). Tente de novo.',
  github: 'Entrar com GitHub',
  indo: 'Indo ao GitHub…',
  voltar: 'Voltar',
};

export const ENTRAR: PorIdioma<typeof pt> = {
  pt,
  en: {
    titulo: 'Sign in',
    conta: 'To play, the Tutorial included, you need an account. Sign-in is GitHub only.',
    escopo:
      'Signing in with GitHub gives no access to your repositories — only to your name, avatar ' +
      'and email.',
    erro: 'Could not sign in ({erro}). Try again.',
    github: 'Sign in with GitHub',
    indo: 'Going to GitHub…',
    voltar: 'Back',
  },
  es: {
    titulo: 'Entrar',
    conta:
      'Para jugar, incluso el Tutorial, hace falta una cuenta. El inicio de sesión es solo con GitHub.',
    escopo:
      'Entrar con GitHub no da acceso a tus repositorios — solo a tu nombre, avatar y correo.',
    erro: 'No se pudo entrar ({erro}). Inténtalo de nuevo.',
    github: 'Entrar con GitHub',
    indo: 'Yendo a GitHub…',
    voltar: 'Volver',
  },
};
