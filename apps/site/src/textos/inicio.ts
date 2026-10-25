// Textos da página inicial (spec §12, §13 tela 8), nos três idiomas. Ficam todos aqui, fora do JSX.
import type { PorIdioma } from '@quiz/i18n';
import type { NomeSprite } from '@quiz/ui';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/',
  textos: {
    pt: {
      titulo: 'Você comitou. Mas você leu?',
      descricao:
        'Um RPG em que você aprende como o seu próprio projeto funciona: a sua IA (Claude Code ou ' +
        'Codex) vira o Mestre, o mapa nasce do seu repositório e o código nunca sai da sua máquina.',
      cartao: 'Você comitou. Mas você leu?',
    },
    en: {
      titulo: 'You committed it. But did you read it?',
      descricao:
        'An RPG where you learn how your own project works: your AI (Claude Code or Codex) ' +
        'becomes the Master, the map grows from your repository and the code never leaves your ' +
        'machine.',
      cartao: 'You committed it. But did you read it?',
    },
    es: {
      titulo: 'Hiciste commit. ¿Pero lo leíste?',
      descricao:
        'Un RPG en el que aprendes cómo funciona tu propio proyecto: tu IA (Claude Code o Codex) ' +
        'se vuelve el Máster, el mapa nace de tu repositorio y el código nunca sale de tu máquina.',
      cartao: 'Hiciste commit. ¿Pero lo leíste?',
    },
  },
};

type Passo = { sprite: NomeSprite; titulo: string; texto: string };

const pt = {
  /** A chamada em quatro pedaços: o terceiro sai em ouro. */
  chamada: ['Você comitou.', 'Mas você ', 'leu', '?'],
  premissa:
    'Nunca se commitou tanto código e se leu tão pouco. Quiz your slop transforma o seu projeto ' +
    'num RPG: a sua IA vira o Mestre, o mapa nasce da estrutura do seu repositório, e cada região ' +
    'só se revela quando você entende como ela funciona.',
  entrar: 'Entrar com GitHub',
  jogarTutorial: 'Jogar o Tutorial',
  conhecerTaverna: 'Conheça a Taverna do Slop',
  avisoLogin: 'O login pede só identidade e e-mail — nenhum acesso aos seus repositórios.',
  desktop:
    'Jogo desktop para Windows e Linux (AppImage, .deb): em breve no GitHub Releases, com ' +
    'checksums SHA-256 e attestations.',
  passosTitulo: 'Como se joga',
  passos: [
    {
      sprite: 'cavaleiro',
      titulo: '1. Escolha seu Projeto',
      texto:
        'O Jogo roda na sua máquina. A sua IA (Claude Code ou Codex) lê o código em modo ' +
        'somente leitura.',
    },
    {
      sprite: 'mago',
      titulo: '2. Explore o mapa',
      texto:
        'Regiões, Territórios e as Ligações entre front, back e banco — escondidos na Névoa até ' +
        'você revelar.',
    },
    {
      sprite: 'bardo',
      titulo: '3. Vença os Desafios',
      texto:
        'Perguntas sobre o seu código, com Evidência. Desconfie: contestar um gabarito errado ' +
        'também vale XP.',
    },
  ] as Passo[],
  semIa: 'Não tem Claude Code nem Codex?',
  semIaLink: 'Entre na lista de espera da sua IA',
  saibaMais: 'Como funciona',
};

export const INICIO: PorIdioma<typeof pt> = {
  pt,
  en: {
    chamada: ['You committed it.', 'But did you ', 'read', ' it?'],
    premissa:
      'Never has so much code been committed and so little of it read. Quiz your slop turns ' +
      'your project into an RPG: your AI becomes the Master, the map grows from the structure of ' +
      'your repository, and each region is only revealed once you understand how it works.',
    entrar: 'Sign in with GitHub',
    jogarTutorial: 'Play the Tutorial',
    conhecerTaverna: 'Meet the Slop Tavern',
    avisoLogin: 'Sign-in asks only for identity and email — no access to your repositories.',
    desktop:
      'Desktop game for Windows and Linux (AppImage, .deb): coming soon on GitHub Releases, with ' +
      'SHA-256 checksums and attestations.',
    passosTitulo: 'How to play',
    passos: [
      {
        sprite: 'cavaleiro',
        titulo: '1. Pick your Project',
        texto:
          'The Game runs on your machine. Your AI (Claude Code or Codex) reads the code in ' +
          'read-only mode.',
      },
      {
        sprite: 'mago',
        titulo: '2. Explore the map',
        texto:
          'Regions, Territories and the Links between front end, back end and database — hidden ' +
          'in the Fog until you reveal them.',
      },
      {
        sprite: 'bardo',
        titulo: '3. Beat the Challenges',
        texto:
          'Questions about your code, with Evidence. Be suspicious: disputing a wrong answer key ' +
          'earns XP too.',
      },
    ],
    semIa: "Don't have Claude Code or Codex?",
    semIaLink: 'Join the waitlist for your AI',
    saibaMais: 'How it works',
  },
  es: {
    chamada: ['Hiciste commit.', '¿Pero lo ', 'leíste', '?'],
    premissa:
      'Nunca se hizo commit de tanto código ni se leyó tan poco. Quiz your slop convierte tu ' +
      'proyecto en un RPG: tu IA se vuelve el Máster, el mapa nace de la estructura de tu ' +
      'repositorio y cada región solo se revela cuando entiendes cómo funciona.',
    entrar: 'Entrar con GitHub',
    jogarTutorial: 'Jugar el Tutorial',
    conhecerTaverna: 'Conoce la Taberna del Slop',
    avisoLogin:
      'El inicio de sesión pide solo identidad y correo — ningún acceso a tus repositorios.',
    desktop:
      'Juego de escritorio para Windows y Linux (AppImage, .deb): pronto en GitHub Releases, con ' +
      'checksums SHA-256 y attestations.',
    passosTitulo: 'Cómo se juega',
    passos: [
      {
        sprite: 'cavaleiro',
        titulo: '1. Elige tu Proyecto',
        texto:
          'El Juego corre en tu máquina. Tu IA (Claude Code o Codex) lee el código en modo solo ' +
          'lectura.',
      },
      {
        sprite: 'mago',
        titulo: '2. Explora el mapa',
        texto:
          'Regiones, Territorios y los Enlaces entre front, back y base de datos — ocultos en la ' +
          'Niebla hasta que los reveles.',
      },
      {
        sprite: 'bardo',
        titulo: '3. Vence los Desafíos',
        texto:
          'Preguntas sobre tu código, con Evidencia. Desconfía: impugnar una solución equivocada ' +
          'también da XP.',
      },
    ],
    semIa: '¿No tienes Claude Code ni Codex?',
    semIaLink: 'Únete a la lista de espera de tu IA',
    saibaMais: 'Cómo funciona',
  },
};
