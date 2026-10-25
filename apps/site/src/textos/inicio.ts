// Textos da página inicial (spec §12, §13 tela 8). Só português por enquanto; ficam todos aqui para
// a tradução (en, es) vir depois sem caçar strings no JSX.
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/',
  titulo: 'Você comitou. Mas você leu?',
  descricao:
    'Um RPG em que você aprende como o seu próprio projeto funciona: a sua IA (Claude Code ou ' +
    'Codex) vira o Mestre, o mapa nasce do seu repositório e o código nunca sai da sua máquina.',
  cartao: 'Você comitou. Mas você leu?',
};

export const INICIO = {
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
  ],
  semIa: 'Não tem Claude Code nem Codex?',
  semIaLink: 'Entre na lista de espera da sua IA',
  saibaMais: 'Como funciona',
} as const;
