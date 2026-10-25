// Perguntas frequentes (spec §12): a página e o JSON-LD FAQPage saem desta mesma lista, então o que
// os buscadores leem é exatamente o que está na tela.
import type { PorIdioma } from '@quiz/i18n';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/faq',
  textos: {
    pt: {
      titulo: 'Perguntas frequentes',
      descricao:
        'Perguntas frequentes sobre o Quiz your slop: qual IA usar, privacidade do código, conta ' +
        'com GitHub, sistemas suportados e o Tutorial da Taverna do Slop.',
      cartao: 'Perguntas frequentes',
    },
    en: {
      titulo: 'Frequently asked questions',
      descricao:
        'Frequently asked questions about Quiz your slop: which AI to use, code privacy, the ' +
        'GitHub account, supported systems and the Slop Tavern Tutorial.',
      cartao: 'Frequently asked questions',
    },
    es: {
      titulo: 'Preguntas frecuentes',
      descricao:
        'Preguntas frecuentes sobre Quiz your slop: qué IA usar, privacidad del código, cuenta de ' +
        'GitHub, sistemas soportados y el Tutorial de la Taberna del Slop.',
      cartao: 'Preguntas frecuentes',
    },
  },
};

export type Pergunta = {
  id: string;
  pergunta: string;
  /** Texto puro: vai igual para o JSON-LD. */
  resposta: string;
  link?: { href: string; rotulo: string };
};

export const PERGUNTAS: PorIdioma<Pergunta[]> = {
  pt: [
    {
      id: 'o-que-e',
      pergunta: 'O que é o Quiz your slop?',
      resposta:
        'Um jogo de perguntas e respostas no estilo RPG em que você aprende como o seu próprio ' +
        'projeto funciona. A sua IA de programação vira o Mestre: lê o repositório, monta um mapa ' +
        'e faz Desafios sobre o código, sempre com Evidência.',
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
        'Você pode jogar o Tutorial da Taverna do Slop, que não precisa de IA, e entrar na lista ' +
        'de espera dizendo qual IA usa (Gemini CLI, Cursor, Copilot ou outra). A lista orienta ' +
        'qual adaptador vem a seguir.',
      link: { href: '/lista-de-espera', rotulo: 'Lista de espera por IA' },
    },
    {
      id: 'editar',
      pergunta: 'O Mestre pode alterar o meu código?',
      resposta:
        'Não. O Jogo impõe o modo somente leitura: o Claude Code roda só com Read, Grep e Glob, e ' +
        'o Codex com --sandbox read-only. Sem edição, sem shell e sem rede. O comando exato ' +
        'aparece na tela antes de começar.',
    },
    {
      id: 'ia-errou',
      pergunta: 'E se a IA errar o gabarito?',
      resposta:
        'Conteste. Todo gabarito traz Evidência e pode ser contestado: o Mestre reavalia o código ' +
        'e, se reconhece o erro, o Desafio é anulado e você ganha o bônus de Caçador de Slop.',
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
        'Sim. Um Projeto pode juntar vários repositórios git locais — o front e a API, por ' +
        'exemplo — num mapa só, e as Ligações podem atravessar de um para o outro.',
    },
    {
      id: 'taverna',
      pergunta: 'O que é a Taverna do Slop?',
      resposta:
        'O Projeto do Tutorial: um app de pedidos de taverna de RPG feito sob medida, em ' +
        'TypeScript (React, API Node, SQL e um worker de fila), com slop plantado de propósito ' +
        'para você achar.',
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
        'Português, inglês e espanhol, no site, no Tutorial e no Jogo. Os Desafios do Tutorial ' +
        'existem nos três idiomas; no Jogo, o Mestre gera os Desafios no idioma do Jogador.',
    },
  ],
  en: [
    {
      id: 'o-que-e',
      pergunta: 'What is Quiz your slop?',
      resposta:
        'An RPG-style quiz game where you learn how your own project works. Your coding AI ' +
        'becomes the Master: it reads the repository, builds a map and writes Challenges about ' +
        'the code, always with Evidence.',
      link: { href: '/como-funciona', rotulo: 'How it works' },
    },
    {
      id: 'codigo',
      pergunta: 'Does my code go to your server?',
      resposta:
        'No. The Game runs on your machine and the server only receives progress: account, XP, ' +
        'Title, stats and, per Adventure, a meaningless id, the revealed percentage and the ' +
        'Class. The code is read by your AI and goes to its provider, just like in your normal ' +
        'use.',
      link: { href: '/privacidade', rotulo: 'Privacy' },
    },
    {
      id: 'qual-ia',
      pergunta: 'Which AI do I need?',
      resposta:
        'Claude Code or Codex CLI, with your own account. The Game does not provide an AI: it ' +
        'calls the CLI you already have, in read-only mode.',
    },
    {
      id: 'sem-ia',
      pergunta: "I don't have Claude Code or Codex. What now?",
      resposta:
        'You can play the Slop Tavern Tutorial, which needs no AI, and join the waitlist telling ' +
        'us which AI you use (Gemini CLI, Cursor, Copilot or another). The list decides which ' +
        'adapter comes next.',
      link: { href: '/lista-de-espera', rotulo: 'AI waitlist' },
    },
    {
      id: 'editar',
      pergunta: 'Can the Master change my code?',
      resposta:
        'No. The Game enforces read-only mode: Claude Code runs with only Read, Grep and Glob, ' +
        'and Codex with --sandbox read-only. No edits, no shell and no network. The exact command ' +
        'is shown on screen before it starts.',
    },
    {
      id: 'ia-errou',
      pergunta: 'What if the AI gets the answer key wrong?',
      resposta:
        'Dispute it. Every answer key comes with Evidence and can be disputed: the Master ' +
        're-checks the code and, if it admits the mistake, the Challenge is voided and you earn ' +
        'the Slop Hunter bonus.',
    },
    {
      id: 'conta',
      pergunta: 'Why do I need an account, even for the Tutorial?',
      resposta:
        'The account keeps your progress between the site and the desktop Game. Sign-in is ' +
        'GitHub only and asks only for identity and email — no access to your repositories.',
    },
    {
      id: 'sistemas',
      pergunta: 'Which systems does the Game run on?',
      resposta:
        'The desktop Game is for Windows and Linux (AppImage and .deb). The Tutorial runs in the ' +
        'browser. macOS comes after the MVP.',
    },
    {
      id: 'repositorios',
      pergunta: 'Does it work with more than one repository?',
      resposta:
        'Yes. A Project can bring together several local git repositories — the front end and ' +
        'the API, for example — into a single map, and Links can cross from one to the other.',
    },
    {
      id: 'taverna',
      pergunta: 'What is the Slop Tavern?',
      resposta:
        "The Tutorial's Project: a made-to-measure RPG tavern ordering app in TypeScript (React, " +
        'a Node API, SQL and a queue worker), with slop planted on purpose for you to find.',
      link: { href: '/taverna-do-slop', rotulo: 'Meet the Slop Tavern' },
    },
    {
      id: 'preco',
      pergunta: 'How much does it cost?',
      resposta:
        'Nothing. The Game is free and open source. The only thing you pay for is your own AI, ' +
        'as you already do today.',
    },
    {
      id: 'idiomas',
      pergunta: 'Which languages?',
      resposta:
        'Portuguese, English and Spanish, on the site, in the Tutorial and in the Game. The ' +
        "Tutorial's Challenges come in all three; in the Game, the Master writes the Challenges " +
        "in the Player's language.",
    },
  ],
  es: [
    {
      id: 'o-que-e',
      pergunta: '¿Qué es Quiz your slop?',
      resposta:
        'Un juego de preguntas y respuestas al estilo RPG en el que aprendes cómo funciona tu ' +
        'propio proyecto. Tu IA de programación se vuelve el Máster: lee el repositorio, arma un ' +
        'mapa y hace Desafíos sobre el código, siempre con Evidencia.',
      link: { href: '/como-funciona', rotulo: 'Cómo funciona' },
    },
    {
      id: 'codigo',
      pergunta: '¿Mi código va a su servidor?',
      resposta:
        'No. El Juego corre en tu máquina y el servidor solo recibe progreso: cuenta, XP, Título, ' +
        'estadísticas y, por Aventura, un id sin significado, el porcentaje revelado y la Clase. ' +
        'El código lo lee tu IA y va a su proveedor, como en tu uso normal.',
      link: { href: '/privacidade', rotulo: 'Privacidad' },
    },
    {
      id: 'qual-ia',
      pergunta: '¿Qué IA necesito?',
      resposta:
        'Claude Code o Codex CLI, con tu propia cuenta. El Juego no incluye IA: llama a la CLI ' +
        'que ya tienes, en modo solo lectura.',
    },
    {
      id: 'sem-ia',
      pergunta: 'No tengo Claude Code ni Codex. ¿Y ahora?',
      resposta:
        'Puedes jugar el Tutorial de la Taberna del Slop, que no necesita IA, y unirte a la lista ' +
        'de espera diciendo qué IA usas (Gemini CLI, Cursor, Copilot u otra). La lista decide qué ' +
        'adaptador viene después.',
      link: { href: '/lista-de-espera', rotulo: 'Lista de espera por IA' },
    },
    {
      id: 'editar',
      pergunta: '¿El Máster puede cambiar mi código?',
      resposta:
        'No. El Juego impone el modo solo lectura: Claude Code corre solo con Read, Grep y Glob, ' +
        'y Codex con --sandbox read-only. Sin edición, sin shell y sin red. El comando exacto ' +
        'aparece en pantalla antes de empezar.',
    },
    {
      id: 'ia-errou',
      pergunta: '¿Y si la IA se equivoca en la solución?',
      resposta:
        'Impúgnala. Toda solución trae Evidencia y se puede impugnar: el Máster vuelve a revisar ' +
        'el código y, si reconoce el error, el Desafío se anula y ganas el bono de Cazador de ' +
        'Slop.',
    },
    {
      id: 'conta',
      pergunta: '¿Por qué necesito una cuenta, incluso para el Tutorial?',
      resposta:
        'La cuenta guarda tu progreso entre el sitio y el Juego de escritorio. El inicio de ' +
        'sesión es solo con GitHub y pide solo identidad y correo — ningún acceso a tus ' +
        'repositorios.',
    },
    {
      id: 'sistemas',
      pergunta: '¿En qué sistemas corre el Juego?',
      resposta:
        'El Juego de escritorio es para Windows y Linux (AppImage y .deb). El Tutorial corre en ' +
        'el navegador. macOS queda para después del MVP.',
    },
    {
      id: 'repositorios',
      pergunta: '¿Funciona con más de un repositorio?',
      resposta:
        'Sí. Un Proyecto puede juntar varios repositorios git locales — el front y la API, por ' +
        'ejemplo — en un solo mapa, y los Enlaces pueden cruzar de uno a otro.',
    },
    {
      id: 'taverna',
      pergunta: '¿Qué es la Taberna del Slop?',
      resposta:
        'El Proyecto del Tutorial: una app de pedidos de taberna de RPG hecha a medida, en ' +
        'TypeScript (React, API Node, SQL y un worker de cola), con slop plantado a propósito ' +
        'para que lo encuentres.',
      link: { href: '/taverna-do-slop', rotulo: 'Conoce la Taberna del Slop' },
    },
    {
      id: 'preco',
      pergunta: '¿Cuánto cuesta?',
      resposta:
        'Nada. El Juego es gratuito y de código abierto. Lo único que pagas es tu propia IA, como ' +
        'ya pagas hoy.',
    },
    {
      id: 'idiomas',
      pergunta: '¿En qué idiomas?',
      resposta:
        'Portugués, inglés y español, en el sitio, en el Tutorial y en el Juego. Los Desafíos del ' +
        'Tutorial existen en los tres idiomas; en el Juego, el Máster genera los Desafíos en el ' +
        'idioma del Jugador.',
    },
  ],
};
