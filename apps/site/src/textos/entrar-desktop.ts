// Textos da página que conecta o Jogo desktop à conta (spec §10).
import type { PorIdioma } from '@quiz/i18n';

const pt = {
  titulo: 'Conectar o Jogo desktop',
  pergunta: 'Conectar o Jogo desktop a esta conta?',
  conta: 'Conta: {login}',
  explicacao:
    'O Jogo guarda um acesso a esta conta no chaveiro do seu sistema, por até {dias} dias, só para ' +
    'sincronizar o progresso. Sair no Jogo apaga esse acesso.',
  aviso: 'Só confirme se foi você quem pediu isto no Jogo agora.',
  conectar: 'Conectar',
  conectando: 'Conectando…',
  cancelar: 'Cancelar',
  invalido:
    'Este link de conexão está incompleto ou não é válido. Volte ao Jogo e escolha "Entrar com ' +
    'GitHub" de novo.',
};

export const ENTRAR_DESKTOP: PorIdioma<typeof pt> = {
  pt,
  en: {
    titulo: 'Connect the desktop Game',
    pergunta: 'Connect the desktop Game to this account?',
    conta: 'Account: {login}',
    explicacao:
      "The Game keeps access to this account in your system's keychain, for up to {dias} days, " +
      'only to sync progress. Signing out in the Game deletes that access.',
    aviso: 'Only confirm if you asked for this in the Game just now.',
    conectar: 'Connect',
    conectando: 'Connecting…',
    cancelar: 'Cancel',
    invalido:
      'This connection link is incomplete or not valid. Go back to the Game and choose "Sign in ' +
      'with GitHub" again.',
  },
  es: {
    titulo: 'Conectar el Juego de escritorio',
    pergunta: '¿Conectar el Juego de escritorio a esta cuenta?',
    conta: 'Cuenta: {login}',
    explicacao:
      'El Juego guarda un acceso a esta cuenta en el llavero de tu sistema, por hasta {dias} días, ' +
      'solo para sincronizar el progreso. Salir en el Juego borra ese acceso.',
    aviso: 'Confirma solo si fuiste tú quien lo pidió en el Juego ahora.',
    conectar: 'Conectar',
    conectando: 'Conectando…',
    cancelar: 'Cancelar',
    invalido:
      'Este enlace de conexión está incompleto o no es válido. Vuelve al Juego y elige "Entrar ' +
      'con GitHub" de nuevo.',
  },
};
