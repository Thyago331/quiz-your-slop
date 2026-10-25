// Perguntas frequentes (spec §12): a página e o JSON-LD FAQPage saem desta mesma lista, então o que
// os buscadores leem é exatamente o que está na tela.
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/faq',
  titulo: 'Perguntas frequentes',
  descricao:
    'Perguntas frequentes sobre o Quiz your slop: qual IA usar, privacidade do código, conta com ' +
    'GitHub, sistemas suportados e o Tutorial da Taverna do Slop.',
  cartao: 'Perguntas frequentes',
};

export type Pergunta = {
  id: string;
  pergunta: string;
  /** Texto puro: vai igual para o JSON-LD. */
  resposta: string;
  link?: { href: string; rotulo: string };
};

export const PERGUNTAS: readonly Pergunta[] = [
  {
    id: 'o-que-e',
    pergunta: 'O que é o Quiz your slop?',
    resposta:
      'Um jogo de perguntas e respostas no estilo RPG em que você aprende como o seu próprio ' +
      'projeto funciona. A sua IA de programação vira o Mestre: lê o repositório, monta um mapa e ' +
      'faz Desafios sobre o código, sempre com Evidência.',
    link: { href: '/como-funciona', rotulo: 'Como funciona' },
  },
  {
    id: 'codigo',
    pergunta: 'O meu código vai para o servidor de vocês?',
    resposta:
      'Não. O Jogo roda na sua máquina e o servidor só recebe progresso: conta, XP, Título, ' +
      'estatísticas e, por Aventura, um id sem significado, a porcentagem revelada e a Classe. O ' +
      'código é lido pela sua IA e vai para o provedor dela, como no seu uso normal.',
    link: { href: '/privacidade', rotulo: 'Privacidade' },
  },
  {
    id: 'qual-ia',
    pergunta: 'Que IA eu preciso?',
    resposta:
      'Claude Code ou Codex CLI, com a sua própria conta. O Jogo não fornece IA: ele chama a CLI ' +
      'que você já tem, em modo somente leitura.',
  },
  {
    id: 'sem-ia',
    pergunta: 'Não tenho Claude Code nem Codex. E agora?',
    resposta:
      'Você pode jogar o Tutorial da Taverna do Slop, que não precisa de IA. Adaptadores para ' +
      'Gemini CLI, Cursor e Copilot ficam para depois do MVP.',
    link: { href: '/taverna-do-slop', rotulo: 'Conheça a Taverna do Slop' },
  },
  {
    id: 'editar',
    pergunta: 'O Mestre pode alterar o meu código?',
    resposta:
      'Não. O Jogo impõe o modo somente leitura: o Claude Code roda só com Read, Grep e Glob, e o ' +
      'Codex com --sandbox read-only. Sem edição, sem shell e sem rede. O comando exato aparece na ' +
      'tela antes de começar.',
  },
  {
    id: 'ia-errou',
    pergunta: 'E se a IA errar o gabarito?',
    resposta:
      'Conteste. Todo gabarito traz Evidência e pode ser contestado: o Mestre reavalia o código e, ' +
      'se reconhece o erro, o Desafio é anulado e você ganha o bônus de Caçador de Slop.',
  },
  {
    id: 'conta',
    pergunta: 'Por que preciso de conta, até para o Tutorial?',
    resposta:
      'A conta guarda o seu progresso entre o site e o Jogo desktop. O login é só com GitHub e ' +
      'pede só identidade e e-mail — nenhum acesso aos seus repositórios.',
  },
  {
    id: 'sistemas',
    pergunta: 'Em quais sistemas o Jogo roda?',
    resposta:
      'O Jogo desktop é para Windows e Linux (AppImage e .deb). O Tutorial roda no navegador. ' +
      'macOS fica para depois do MVP.',
  },
  {
    id: 'repositorios',
    pergunta: 'Funciona com mais de um repositório?',
    resposta:
      'Sim. Um Projeto pode juntar vários repositórios git locais — o front e a API, por exemplo — ' +
      'num mapa só, e as Ligações podem atravessar de um para o outro.',
  },
  {
    id: 'taverna',
    pergunta: 'O que é a Taverna do Slop?',
    resposta:
      'O Projeto do Tutorial: um app de pedidos de taverna de RPG feito sob medida, em TypeScript ' +
      '(React, API Node, SQL e um worker de fila), com slop plantado de propósito para você achar.',
    link: { href: '/taverna-do-slop', rotulo: 'Conheça a Taverna do Slop' },
  },
  {
    id: 'preco',
    pergunta: 'Quanto custa?',
    resposta:
      'Nada. O Jogo é gratuito e de código aberto. A única coisa que você paga é a sua própria ' +
      'IA, como já paga hoje.',
  },
  {
    id: 'idiomas',
    pergunta: 'Em quais idiomas?',
    resposta:
      'Por enquanto em português; inglês e espanhol chegam em seguida. O Mestre gera os Desafios ' +
      'no idioma do Jogador.',
  },
];
