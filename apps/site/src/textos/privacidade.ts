// Textos da página de privacidade (spec §8, §12): o que sobe ao servidor, a IA do Jogador e o Umami.
import type { DadosDaPagina } from './pagina';
import type { Secao } from './como-funciona';

export const PAGINA: DadosDaPagina = {
  caminho: '/privacidade',
  titulo: 'Privacidade',
  descricao:
    'O que o Quiz your slop envia ao servidor (só progresso, nunca código), o papel da sua IA e ' +
    'as estatísticas sem cookie do site.',
  cartao: 'O seu código nunca sai da sua máquina',
};

export const RESUMO =
  'O seu código nunca sai da sua máquina. O Jogo roda localmente e o servidor do Quiz your slop ' +
  'só recebe progresso, sem conteúdo.';

export const SOBE = {
  titulo: 'O que sobe ao servidor',
  itens: [
    'A sua conta: o id, o login, o nome, o avatar e o e-mail do GitHub.',
    'O seu XP, o seu Título e estatísticas: Expedições, acertos e Contestações vencidas.',
    'Para cada Aventura: um código sem significado (no Tutorial, simplesmente "tutorial"), a ' +
      'porcentagem revelada (Progresso da Aventura) e a Classe.',
  ],
  exemploRotulo:
    'Um envio de progresso inteiro é assim (a conta não vai nele: o servidor sabe quem é você pela ' +
    'sessão):',
  exemplo: {
    xp: 140,
    titulo: 'Leitor de Diff',
    estatisticas: { expedicoes: 12, acertos: 47, contestacoes_vencidas: 2 },
    aventuras: [
      { id: 'tutorial', progresso: 25, classe: 'fullstack' },
      { id: '9b04d6aa-3c1e-4f2b-8a7d-5e6f0c1b2a39', progresso: 43, classe: 'backend' },
    ],
  },
} as const;

export const NUNCA = {
  titulo: 'O que nunca sai da sua máquina',
  texto:
    'O mapa (nomes de Regiões, Territórios e Ligações), caminhos de arquivo, Desafios, gabaritos, ' +
    'Evidências, trechos de código e o nome ou caminho das suas pastas. O estado completo de cada ' +
    'Aventura é um arquivo local (no Tutorial, fica guardado neste navegador). O seu Perfil tem a ' +
    'tela "O que é enviado", com o JSON exato do último envio — e o Jogo é de código aberto.',
  link: 'Ver o que foi enviado da sua conta',
};

export const SECOES: readonly Secao[] = [
  {
    id: 'ia',
    titulo: 'A sua IA',
    paragrafos: [
      'O Mestre é a sua CLI de IA (Claude Code ou Codex), com a sua conta. Ela lê o código do ' +
        'Projeto em modo somente leitura e o envia ao provedor dela (Anthropic ou OpenAI), como no ' +
        'seu uso normal. O que esse provedor faz com os dados segue os termos dele, não os nossos.',
      'O Quiz your slop não fornece IA, não intermedia essas chamadas e não vê o que elas levam.',
    ],
  },
  {
    id: 'conta',
    titulo: 'Conta e login com GitHub',
    paragrafos: [
      'Para jogar, inclusive o Tutorial, é preciso uma conta. O login é só com GitHub, com o escopo ' +
        'mínimo (read:user user:email): nome, avatar e e-mail. Nenhum acesso aos seus repositórios.',
      'A sessão fica num cookie cifrado, usado só para saber quem está jogando.',
      'Se você entrar na lista de espera por IA, guardamos também a IA que escolheu (e o nome ' +
        'que escreveu, se for "outra"), ligada à sua conta.',
    ],
  },
  {
    id: 'estatisticas',
    titulo: 'Estatísticas do site (Umami)',
    paragrafos: [
      'O site conta visitas com o Umami, hospedado por nós: sem cookies, sem identificar você e ' +
        'sem os parâmetros da URL. Serve só para saber quais páginas são lidas.',
      'O Jogo desktop não tem telemetria nenhuma. Relatórios de erro são opcionais, com os ' +
        'caminhos trocados por <projeto>/... e editáveis antes de enviar.',
    ],
  },
  {
    id: 'contato',
    titulo: 'Dúvidas',
    paragrafos: [
      'Viu algo além de números e ids sendo enviado? É um bug — abra uma issue no repositório do ' +
        'projeto.',
    ],
  },
];
