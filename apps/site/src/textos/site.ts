// Textos do cabeçalho e do rodapé das páginas do site.
import type { PorIdioma } from '@quiz/i18n';

const pt = {
  marca: 'QUIZ YOUR SLOP',
  navegacao: [
    { href: '/como-funciona', rotulo: 'Como funciona' },
    { href: '/taverna-do-slop', rotulo: 'Taverna do Slop' },
    { href: '/privacidade', rotulo: 'Privacidade' },
    { href: '/faq', rotulo: 'FAQ' },
  ],
  rotuloNavegacao: 'Páginas do site',
  entrar: 'Entrar com GitHub',
  perfil: 'Perfil',
  sair: 'Sair',
  rodape: ['Seu código nunca sai da sua máquina.', 'Jogo de código aberto'],
  repositorio: 'GitHub',
};

export const SITE: PorIdioma<typeof pt> = {
  pt,
  en: {
    marca: 'QUIZ YOUR SLOP',
    navegacao: [
      { href: '/como-funciona', rotulo: 'How it works' },
      { href: '/taverna-do-slop', rotulo: 'Slop Tavern' },
      { href: '/privacidade', rotulo: 'Privacy' },
      { href: '/faq', rotulo: 'FAQ' },
    ],
    rotuloNavegacao: 'Site pages',
    entrar: 'Sign in with GitHub',
    perfil: 'Profile',
    sair: 'Sign out',
    rodape: ['Your code never leaves your machine.', 'Open source game'],
    repositorio: 'GitHub',
  },
  es: {
    marca: 'QUIZ YOUR SLOP',
    navegacao: [
      { href: '/como-funciona', rotulo: 'Cómo funciona' },
      { href: '/taverna-do-slop', rotulo: 'Taberna del Slop' },
      { href: '/privacidade', rotulo: 'Privacidad' },
      { href: '/faq', rotulo: 'FAQ' },
    ],
    rotuloNavegacao: 'Páginas del sitio',
    entrar: 'Entrar con GitHub',
    perfil: 'Perfil',
    sair: 'Salir',
    rodape: ['Tu código nunca sale de tu máquina.', 'Juego de código abierto'],
    repositorio: 'GitHub',
  },
};
