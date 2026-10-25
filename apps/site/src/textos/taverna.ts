// Textos da vitrine "Conheça a Taverna do Slop" (spec §12): o mapa e um Desafio de exemplo, sem
// login. Existe porque o Tutorial fica atrás da conta.
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/taverna-do-slop',
  titulo: 'Conheça a Taverna do Slop',
  descricao:
    'O Tutorial do Quiz your slop: o mapa da Taverna do Slop, um app de pedidos de RPG com slop ' +
    'plantado, e um Desafio de exemplo com gabarito e Evidência.',
  cartao: 'Conheça a Taverna do Slop',
};

export const TAVERNA = {
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
  formatos: {
    multipla_escolha: 'Múltipla escolha',
    apontar: 'Apontar no código',
    tracar_fluxo: 'Traçar o fluxo',
  },
  verResposta: 'Ver a resposta',
  gabarito: 'Gabarito:',
  convite: 'Pronto para enfrentar o Guardião?',
  jogar: 'Jogar o Tutorial',
  entrar: 'Entrar com GitHub e jogar o Tutorial',
} as const;
