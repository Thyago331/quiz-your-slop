// Textos da vitrine "Conheça a Taverna do Slop" (spec §12): o mapa e um Desafio de exemplo, sem
// login. Existe porque o Tutorial fica atrás da conta.
import type { PorIdioma } from '@quiz/i18n';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/taverna-do-slop',
  textos: {
    pt: {
      titulo: 'Conheça a Taverna do Slop',
      descricao:
        'O Tutorial do Quiz your slop: o mapa da Taverna do Slop, um app de pedidos de RPG com ' +
        'slop plantado, e um Desafio de exemplo com gabarito e Evidência.',
      cartao: 'Conheça a Taverna do Slop',
    },
    en: {
      titulo: 'Meet the Slop Tavern',
      descricao:
        "Quiz your slop's Tutorial: the map of the Slop Tavern, an RPG ordering app with planted " +
        'slop, and a sample Challenge with its answer key and Evidence.',
      cartao: 'Meet the Slop Tavern',
    },
    es: {
      titulo: 'Conoce la Taberna del Slop',
      descricao:
        'El Tutorial de Quiz your slop: el mapa de la Taberna del Slop, una app de pedidos de RPG ' +
        'con slop plantado, y un Desafío de ejemplo con su solución y Evidencia.',
      cartao: 'Conoce la Taberna del Slop',
    },
  },
};

const pt = {
  introducao:
    'A Taverna do Slop é o Projeto do Tutorial: um app de pedidos de taverna de RPG feito sob ' +
    'medida para o jogo, com ~30 arquivos de TypeScript — um site React, uma API Node, um banco ' +
    'SQL e um worker de fila. Tem slop plantado de propósito: comentário mentiroso, total ' +
    'calculado diferente no front e na API, função com nome enganoso, código morto e erro ' +
    'engolido.',
  mapaTitulo: 'O mapa',
  mapaTexto:
    'Quatro Territórios — Salão, Balcão, Adega e Cozinha — e sete Regiões. Assim fica o mapa de ' +
    'um Bardo Fullstack depois da primeira vitória: Carrinho e Checkout revelada, as vizinhas ' +
    'desbloqueadas e o resto ainda na Névoa.',
  mapaRotulo: 'Mapa-mundi da Taverna do Slop (exemplo)',
  selecione: 'Escolha uma região do mapa para ver o que ela faz.',
  desafioTitulo: 'Um Desafio de exemplo',
  desafioTexto: 'Da API de Pedidos, a região de entrada do Cavaleiro do Backend ·',
  /** Aparece quando o Desafio não está no idioma da página (os do Tutorial, até o #30). */
  desafioEmPortugues: 'Os Desafios do Tutorial estão em português.',
  verResposta: 'Ver a resposta',
  gabarito: 'Gabarito:',
  convite: 'Pronto para enfrentar o Guardião?',
  jogar: 'Jogar o Tutorial',
  entrar: 'Entrar com GitHub e jogar o Tutorial',
};

export const TAVERNA: PorIdioma<typeof pt> = {
  pt,
  en: {
    introducao:
      "The Slop Tavern is the Tutorial's Project: an RPG tavern ordering app made to measure for " +
      'the game, with ~30 TypeScript files — a React site, a Node API, a SQL database and a queue ' +
      'worker. It has slop planted on purpose: a lying comment, a total computed differently in ' +
      'the front end and in the API, a function with a misleading name, dead code and a ' +
      'swallowed error.',
    mapaTitulo: 'The map',
    mapaTexto:
      'Four Territories — Hall, Counter, Cellar and Kitchen — and seven Regions. This is the map ' +
      'of a Fullstack Bard after the first victory: Cart & Checkout revealed, its neighbours ' +
      'unlocked and the rest still in the Fog.',
    mapaRotulo: 'World map of the Slop Tavern (sample)',
    selecione: 'Pick a region on the map to see what it does.',
    desafioTitulo: 'A sample Challenge',
    desafioTexto: 'From the Orders API, the entry region of the Backend Knight ·',
    desafioEmPortugues:
      "The Tutorial's Challenges are still in Portuguese; English versions are on the way.",
    verResposta: 'Show the answer',
    gabarito: 'Answer key:',
    convite: 'Ready to face the Guardian?',
    jogar: 'Play the Tutorial',
    entrar: 'Sign in with GitHub and play the Tutorial',
  },
  es: {
    introducao:
      'La Taberna del Slop es el Proyecto del Tutorial: una app de pedidos de taberna de RPG ' +
      'hecha a medida para el juego, con ~30 archivos de TypeScript — un sitio React, una API ' +
      'Node, una base de datos SQL y un worker de cola. Tiene slop plantado a propósito: un ' +
      'comentario mentiroso, un total calculado distinto en el front y en la API, una función con ' +
      'nombre engañoso, código muerto y un error tragado.',
    mapaTitulo: 'El mapa',
    mapaTexto:
      'Cuatro Territorios — Salón, Barra, Bodega y Cocina — y siete Regiones. Así queda el mapa ' +
      'de un Bardo Fullstack después de la primera victoria: Carrito y Pago revelada, las vecinas ' +
      'desbloqueadas y el resto todavía en la Niebla.',
    mapaRotulo: 'Mapamundi de la Taberna del Slop (ejemplo)',
    selecione: 'Elige una región del mapa para ver qué hace.',
    desafioTitulo: 'Un Desafío de ejemplo',
    desafioTexto: 'De la API de Pedidos, la región de entrada del Caballero del Backend ·',
    desafioEmPortugues:
      'Los Desafíos del Tutorial todavía están en portugués; la versión en español está en camino.',
    verResposta: 'Ver la respuesta',
    gabarito: 'Solución:',
    convite: '¿Listo para enfrentar al Guardián?',
    jogar: 'Jugar el Tutorial',
    entrar: 'Entrar con GitHub y jugar el Tutorial',
  },
};
