// Textos da página de privacidade (spec §8, §12): o que sobe ao servidor, a IA do Jogador e o Umami.
import type { PorIdioma } from '@quiz/i18n';
import type { Secao } from './como-funciona';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/privacidade',
  textos: {
    pt: {
      titulo: 'Privacidade',
      descricao:
        'O que o Quiz your slop envia ao servidor (só progresso, nunca código), o papel da sua IA ' +
        'e as estatísticas sem cookie do site.',
      cartao: 'O seu código nunca sai da sua máquina',
    },
    en: {
      titulo: 'Privacy',
      descricao:
        'What Quiz your slop sends to the server (progress only, never code), the role of your ' +
        "AI and the site's cookie-free stats.",
      cartao: 'Your code never leaves your machine',
    },
    es: {
      titulo: 'Privacidad',
      descricao:
        'Lo que Quiz your slop envía al servidor (solo progreso, nunca código), el papel de tu IA ' +
        'y las estadísticas sin cookies del sitio.',
      cartao: 'Tu código nunca sale de tu máquina',
    },
  },
};

/**
 * Um envio de progresso inteiro, como o servidor o recebe. É o mesmo em todo idioma: o Título vai
 * sempre com o nome em português (docs/glossario-traducoes.md).
 */
export const EXEMPLO_DE_ENVIO = {
  xp: 140,
  titulo: 'Leitor de Diff',
  estatisticas: { expedicoes: 12, acertos: 47, contestacoes_vencidas: 2 },
  aventuras: [
    { id: 'tutorial', progresso: 25, classe: 'fullstack' },
    { id: '9b04d6aa-3c1e-4f2b-8a7d-5e6f0c1b2a39', progresso: 43, classe: 'backend' },
  ],
} as const;

type Privacidade = {
  resumo: string;
  sobe: { titulo: string; itens: string[]; exemploRotulo: string };
  nunca: { titulo: string; texto: string; link: string };
  secoes: Secao[];
};

export const PRIVACIDADE: PorIdioma<Privacidade> = {
  pt: {
    resumo:
      'O seu código nunca sai da sua máquina. O Jogo roda localmente e o servidor do Quiz your ' +
      'slop só recebe progresso, sem conteúdo.',
    sobe: {
      titulo: 'O que sobe ao servidor',
      itens: [
        'A sua conta: o id, o login, o nome, o avatar e o e-mail do GitHub.',
        'O seu XP, o seu Título e estatísticas: Expedições, acertos e Contestações vencidas.',
        'Para cada Aventura: um código sem significado (no Tutorial, simplesmente "tutorial"), a ' +
          'porcentagem revelada (Progresso da Aventura) e a Classe.',
      ],
      exemploRotulo:
        'Um envio de progresso inteiro é assim (a conta não vai nele: o servidor sabe quem é você ' +
        'pela sessão):',
    },
    nunca: {
      titulo: 'O que nunca sai da sua máquina',
      texto:
        'O mapa (nomes de Regiões, Territórios e Ligações), caminhos de arquivo, Desafios, ' +
        'gabaritos, Evidências, trechos de código e o nome ou caminho das suas pastas. O estado ' +
        'completo de cada Aventura é um arquivo local (no Tutorial, fica guardado neste ' +
        'navegador). O seu Perfil tem a tela "O que é enviado", com o JSON exato do último envio ' +
        '— e o Jogo é de código aberto.',
      link: 'Ver o que foi enviado da sua conta',
    },
    secoes: [
      {
        id: 'ia',
        titulo: 'A sua IA',
        paragrafos: [
          'O Mestre é a sua CLI de IA (Claude Code ou Codex), com a sua conta. Ela lê o código do ' +
            'Projeto em modo somente leitura e o envia ao provedor dela (Anthropic ou OpenAI), ' +
            'como no seu uso normal. O que esse provedor faz com os dados segue os termos dele, ' +
            'não os nossos.',
          'O Quiz your slop não fornece IA, não intermedia essas chamadas e não vê o que elas ' +
            'levam.',
        ],
      },
      {
        id: 'conta',
        titulo: 'Conta e login com GitHub',
        paragrafos: [
          'Para jogar, inclusive o Tutorial, é preciso uma conta. O login é só com GitHub, com o ' +
            'escopo mínimo (read:user user:email): nome, avatar e e-mail. Nenhum acesso aos seus ' +
            'repositórios.',
          'A sessão fica num cookie cifrado, usado só para saber quem está jogando. O idioma ' +
            'escolhido fica num cookie à parte (NEXT_LOCALE), só para o site abrir nele.',
          'Se você entrar na lista de espera por IA, guardamos também a IA que escolheu (e o nome ' +
            'que escreveu, se for "outra"), ligada à sua conta.',
        ],
      },
      {
        id: 'estatisticas',
        titulo: 'Estatísticas do site (Umami)',
        paragrafos: [
          'O site conta visitas com o Umami, hospedado por nós: sem cookies, sem identificar você ' +
            'e sem os parâmetros da URL. Serve só para saber quais páginas são lidas.',
          'O Jogo desktop não tem telemetria nenhuma. Relatórios de erro são opcionais, com os ' +
            'caminhos trocados por <projeto>/... e editáveis antes de enviar.',
        ],
      },
      {
        id: 'contato',
        titulo: 'Dúvidas',
        paragrafos: [
          'Viu algo além de números e ids sendo enviado? É um bug — abra uma issue no ' +
            'repositório do projeto.',
        ],
      },
    ],
  },
  en: {
    resumo:
      'Your code never leaves your machine. The Game runs locally and the Quiz your slop server ' +
      'only receives progress, no content.',
    sobe: {
      titulo: 'What goes up to the server',
      itens: [
        'Your account: your GitHub id, login, name, avatar and email.',
        'Your XP, your Title and stats: Expeditions, hits and Disputes won.',
        'For each Adventure: a meaningless code (in the Tutorial, simply "tutorial"), the revealed ' +
          'percentage (Adventure Progress) and the Class.',
      ],
      exemploRotulo:
        'A whole progress upload looks like this (the account is not in it: the server knows who ' +
        'you are from the session):',
    },
    nunca: {
      titulo: 'What never leaves your machine',
      texto:
        'The map (names of Regions, Territories and Links), file paths, Challenges, answer keys, ' +
        'Evidence, code snippets and the name or path of your folders. The full state of each ' +
        'Adventure is a local file (in the Tutorial, it is kept in this browser). Your Profile ' +
        'has the "What is sent" screen, with the exact JSON of the last upload — and the Game is ' +
        'open source.',
      link: 'See what was sent from your account',
    },
    secoes: [
      {
        id: 'ia',
        titulo: 'Your AI',
        paragrafos: [
          'The Master is your AI CLI (Claude Code or Codex), with your account. It reads the ' +
            "Project's code in read-only mode and sends it to its provider (Anthropic or OpenAI), " +
            'just like in your normal use. What that provider does with the data follows its ' +
            'terms, not ours.',
          'Quiz your slop does not provide an AI, does not broker those calls and does not see ' +
            'what they carry.',
        ],
      },
      {
        id: 'conta',
        titulo: 'Account and GitHub sign-in',
        paragrafos: [
          'To play, the Tutorial included, you need an account. Sign-in is GitHub only, with the ' +
            'minimum scope (read:user user:email): name, avatar and email. No access to your ' +
            'repositories.',
          'The session lives in an encrypted cookie, used only to know who is playing. The ' +
            'language you pick lives in a separate cookie (NEXT_LOCALE), only so the site opens ' +
            'in it.',
          'If you join the AI waitlist, we also keep the AI you picked (and the name you typed, ' +
            'if it is "other"), tied to your account.',
        ],
      },
      {
        id: 'estatisticas',
        titulo: 'Site stats (Umami)',
        paragrafos: [
          'The site counts visits with Umami, hosted by us: no cookies, no identifying you and no ' +
            'URL parameters. It only tells us which pages are read.',
          'The desktop Game has no telemetry at all. Error reports are opt-in, with paths ' +
            'replaced by <project>/... and editable before sending.',
        ],
      },
      {
        id: 'contato',
        titulo: 'Questions',
        paragrafos: [
          "Saw anything other than numbers and ids being sent? That's a bug — open an issue in " +
            "the project's repository.",
        ],
      },
    ],
  },
  es: {
    resumo:
      'Tu código nunca sale de tu máquina. El Juego corre en local y el servidor de Quiz your ' +
      'slop solo recibe progreso, sin contenido.',
    sobe: {
      titulo: 'Lo que sube al servidor',
      itens: [
        'Tu cuenta: el id, el login, el nombre, el avatar y el correo de GitHub.',
        'Tu XP, tu Título y estadísticas: Expediciones, aciertos e Impugnaciones ganadas.',
        'Para cada Aventura: un código sin significado (en el Tutorial, simplemente "tutorial"), ' +
          'el porcentaje revelado (Progreso de la Aventura) y la Clase.',
      ],
      exemploRotulo:
        'Un envío de progreso completo es así (la cuenta no va en él: el servidor sabe quién eres ' +
        'por la sesión):',
    },
    nunca: {
      titulo: 'Lo que nunca sale de tu máquina',
      texto:
        'El mapa (nombres de Regiones, Territorios y Enlaces), rutas de archivo, Desafíos, ' +
        'soluciones, Evidencias, fragmentos de código y el nombre o la ruta de tus carpetas. El ' +
        'estado completo de cada Aventura es un archivo local (en el Tutorial, queda guardado en ' +
        'este navegador). Tu Perfil tiene la pantalla "Lo que se envía", con el JSON exacto del ' +
        'último envío — y el Juego es de código abierto.',
      link: 'Ver lo que se envió desde tu cuenta',
    },
    secoes: [
      {
        id: 'ia',
        titulo: 'Tu IA',
        paragrafos: [
          'El Máster es tu CLI de IA (Claude Code o Codex), con tu cuenta. Lee el código del ' +
            'Proyecto en modo solo lectura y lo envía a su proveedor (Anthropic u OpenAI), como en ' +
            'tu uso normal. Lo que ese proveedor hace con los datos sigue sus términos, no los ' +
            'nuestros.',
          'Quiz your slop no incluye IA, no intermedia esas llamadas y no ve lo que llevan.',
        ],
      },
      {
        id: 'conta',
        titulo: 'Cuenta e inicio de sesión con GitHub',
        paragrafos: [
          'Para jugar, incluso el Tutorial, hace falta una cuenta. El inicio de sesión es solo con ' +
            'GitHub, con el alcance mínimo (read:user user:email): nombre, avatar y correo. Ningún ' +
            'acceso a tus repositorios.',
          'La sesión vive en una cookie cifrada, usada solo para saber quién está jugando. El ' +
            'idioma elegido vive en otra cookie (NEXT_LOCALE), solo para que el sitio se abra en ' +
            'él.',
          'Si te unes a la lista de espera por IA, guardamos también la IA que elegiste (y el ' +
            'nombre que escribiste, si es "otra"), ligada a tu cuenta.',
        ],
      },
      {
        id: 'estatisticas',
        titulo: 'Estadísticas del sitio (Umami)',
        paragrafos: [
          'El sitio cuenta visitas con Umami, alojado por nosotros: sin cookies, sin identificarte ' +
            'y sin los parámetros de la URL. Sirve solo para saber qué páginas se leen.',
          'El Juego de escritorio no tiene ninguna telemetría. Los informes de error son ' +
            'opcionales, con las rutas cambiadas por <proyecto>/... y editables antes de enviar.',
        ],
      },
      {
        id: 'contato',
        titulo: 'Dudas',
        paragrafos: [
          '¿Viste algo más que números e ids en el envío? Es un bug — abre un issue en el ' +
            'repositorio del proyecto.',
        ],
      },
    ],
  },
};
