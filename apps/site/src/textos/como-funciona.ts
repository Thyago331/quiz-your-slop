// Textos de "Como funciona" (spec §12, GEO): frases curtas que valem sozinhas, para buscadores e
// IAs citarem. O llms.txt reaproveita estas seções.
import type { PorIdioma } from '@quiz/i18n';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/como-funciona',
  textos: {
    pt: {
      titulo: 'Como funciona',
      descricao:
        'Como o Quiz your slop funciona: a IA do Jogador vira o Mestre, lê o projeto em modo ' +
        'somente leitura, monta um mapa e gera Desafios com Evidência. O código nunca sai da ' +
        'máquina.',
      cartao: 'Como funciona',
    },
    en: {
      titulo: 'How it works',
      descricao:
        "How Quiz your slop works: the Player's AI becomes the Master, reads the project in " +
        'read-only mode, builds a map and writes Challenges with Evidence. The code never leaves ' +
        'the machine.',
      cartao: 'How it works',
    },
    es: {
      titulo: 'Cómo funciona',
      descricao:
        'Cómo funciona Quiz your slop: la IA del Jugador se vuelve el Máster, lee el proyecto en ' +
        'modo solo lectura, arma un mapa y genera Desafíos con Evidencia. El código nunca sale de ' +
        'la máquina.',
      cartao: 'Cómo funciona',
    },
  },
};

export type Secao = { id: string; titulo: string; paragrafos: string[] };

type ComoFunciona = { introducao: string; secoes: Secao[] };

export const COMO_FUNCIONA: PorIdioma<ComoFunciona> = {
  pt: {
    introducao:
      'Quiz your slop é um jogo de perguntas e respostas no estilo RPG em que você aprende como o ' +
      'seu próprio projeto de software funciona. A sua IA de programação vira o Mestre do jogo: ' +
      'ela lê o repositório, desenha um mapa a partir da estrutura do código e faz perguntas sobre ' +
      'ele. Cada região do mapa só se revela quando você mostra que entende como ela funciona.',
    secoes: [
      {
        id: 'mestre',
        titulo: 'O Mestre é a sua IA',
        paragrafos: [
          'O Jogo não fornece IA. O Mestre é a CLI de IA que você já usa — Claude Code ou Codex ' +
            'CLI — chamada pelo Jogo, na sua máquina, dentro da pasta do seu Projeto.',
          'O Mestre só pode ler. O Jogo impõe isso: o Claude Code roda só com as ferramentas ' +
            'Read, Grep e Glob, e o Codex com --sandbox read-only. Sem edição, sem shell, sem ' +
            'rede. Uma CLI sem modo restrito é recusada.',
          'O comando exato que o Jogo vai rodar aparece na tela antes de começar.',
        ],
      },
      {
        id: 'codigo',
        titulo: 'O seu código nunca sai da sua máquina',
        paragrafos: [
          'O Jogo roda localmente. O código é lido pela sua IA, que o envia ao provedor dela ' +
            '(Anthropic ou OpenAI) como no seu uso normal — nunca ao servidor do Quiz your slop.',
          'O servidor recebe só progresso, sem conteúdo: a conta, o XP, o Título, estatísticas e, ' +
            'por Aventura, um id sem significado, a porcentagem revelada e a Classe.',
        ],
      },
      {
        id: 'mapa',
        titulo: 'O mapa nasce do seu repositório',
        paragrafos: [
          'Uma Aventura é a campanha sobre um Projeto: um ou mais repositórios git tratados como ' +
            'um sistema só. Cada aplicação ou serviço vira um Território (uma ilha no mapa).',
          'Cada Região é uma responsabilidade funcional do código — Autenticação, API de pedidos, ' +
            'Esquema do banco —, não uma pasta. As Regiões se ligam por Ligações: Chamada ' +
            '(HTTP/gRPC/GraphQL), Consulta (banco), Evento (fila) ou Dependência direta (import).',
          'No começo só a região de entrada está fora da Névoa. Você escolhe uma Classe — ' +
            'Backend, Frontend ou Fullstack — e ela define por onde a Aventura começa.',
        ],
      },
      {
        id: 'expedicao',
        titulo: 'Expedições e Desafios',
        paragrafos: [
          'Uma Expedição é uma sessão curta (10 a 20 minutos) numa região: uma batalha contra o ' +
            'Guardião dela, com 5 Desafios. Quatro acertos revelam a região e desbloqueiam as ' +
            'vizinhas.',
          'Os Desafios têm três formatos, todos com gabarito objetivo: Múltipla escolha, Apontar ' +
            'no código (escolher o arquivo ou a função certos) e Traçar o fluxo (ordenar os passos ' +
            'de um caminho pelo sistema).',
          'Errar não custa nada. Depois de cada resposta aparece a explicação com a Evidência: o ' +
            'caminho:linha e o trecho de código que comprovam o gabarito.',
        ],
      },
      {
        id: 'contestacao',
        titulo: 'Desconfiar da IA é parte do jogo',
        paragrafos: [
          'Todo gabarito traz Evidência e pode ser contestado. Se você acha que o Mestre errou, ' +
            'explica por quê; ele reavalia o código. Se reconhece o erro, o Desafio é anulado e ' +
            'você ganha o bônus de Caçador de Slop.',
        ],
      },
      {
        id: 'progresso',
        titulo: 'Progressão',
        paragrafos: [
          'O Progresso da Aventura é a fração das regiões conhecidas que você já revelou — e pode ' +
            'cair quando o código muda: uma região revelada cujo código mudou bastante fica ' +
            'desatualizada e pede uma nova Expedição sobre o que mudou.',
          'O XP soma todas as Aventuras e dá um Título cosmético: Comitador Cego → Leitor de Diff ' +
            '→ Arqueólogo de Código → Unslopper. Nível não libera poder: aprender é a recompensa.',
        ],
      },
      {
        id: 'tutorial',
        titulo: 'Tutorial: a Taverna do Slop',
        paragrafos: [
          'Para aprender a jogar sem IA nenhuma, o site tem o Tutorial: uma Aventura fixa sobre a ' +
            'Taverna do Slop, um app de pedidos de taverna feito sob medida, com Desafios escritos ' +
            'à mão e slop plantado de propósito. Basta entrar com GitHub.',
        ],
      },
    ],
  },
  en: {
    introducao:
      'Quiz your slop is an RPG-style quiz game where you learn how your own software project ' +
      'works. Your coding AI becomes the Master of the game: it reads the repository, draws a map ' +
      'from the structure of the code and asks questions about it. Each region of the map is only ' +
      'revealed once you show you understand how it works.',
    secoes: [
      {
        id: 'mestre',
        titulo: 'The Master is your AI',
        paragrafos: [
          'The Game does not provide an AI. The Master is the AI CLI you already use — Claude Code ' +
            'or Codex CLI — called by the Game, on your machine, inside your Project folder.',
          'The Master can only read. The Game enforces it: Claude Code runs with only the Read, ' +
            'Grep and Glob tools, and Codex with --sandbox read-only. No edits, no shell, no ' +
            'network. A CLI without a restricted mode is refused.',
          'The exact command the Game will run is shown on screen before it starts.',
        ],
      },
      {
        id: 'codigo',
        titulo: 'Your code never leaves your machine',
        paragrafos: [
          'The Game runs locally. The code is read by your AI, which sends it to its own provider ' +
            '(Anthropic or OpenAI) just like in your normal use — never to the Quiz your slop ' +
            'server.',
          'The server only receives progress, no content: the account, the XP, the Title, stats ' +
            'and, per Adventure, a meaningless id, the revealed percentage and the Class.',
        ],
      },
      {
        id: 'mapa',
        titulo: 'The map grows from your repository',
        paragrafos: [
          'An Adventure is the campaign over a Project: one or more git repositories treated as a ' +
            'single system. Each application or service becomes a Territory (an island on the ' +
            'map).',
          'Each Region is a functional responsibility of the code — Authentication, Orders API, ' +
            'Database schema — not a folder. Regions connect through Links: Call ' +
            '(HTTP/gRPC/GraphQL), Query (database), Event (queue) or Direct dependency (import).',
          'At the start only the entry region is out of the Fog. You pick a Class — Backend, ' +
            'Frontend or Fullstack — and it decides where the Adventure begins.',
        ],
      },
      {
        id: 'expedicao',
        titulo: 'Expeditions and Challenges',
        paragrafos: [
          'An Expedition is a short session (10 to 20 minutes) in a region: a battle against its ' +
            'Guardian, with 5 Challenges. Four hits reveal the region and unlock its neighbours.',
          'Challenges come in three formats, all with an objective answer key: Multiple choice, ' +
            'Point to the code (pick the right file or function) and Trace the flow (order the ' +
            'steps of a path through the system).',
          'Getting it wrong costs nothing. After each answer comes the explanation with the ' +
            'Evidence: the path:line and the code snippet that prove the answer key.',
        ],
      },
      {
        id: 'contestacao',
        titulo: 'Doubting the AI is part of the game',
        paragrafos: [
          'Every answer key comes with Evidence and can be disputed. If you think the Master got ' +
            'it wrong, explain why; it re-checks the code. If it admits the mistake, the Challenge ' +
            'is voided and you earn the Slop Hunter bonus.',
        ],
      },
      {
        id: 'progresso',
        titulo: 'Progression',
        paragrafos: [
          'Adventure Progress is the share of known regions you have already revealed — and it ' +
            'can drop when the code changes: a revealed region whose code changed enough becomes ' +
            'outdated and asks for a new Expedition on what changed.',
          'XP adds up across all Adventures and gives a cosmetic Title: Blind Committer → Diff ' +
            'Reader → Code Archaeologist → Unslopper. Levels grant no power: learning is the ' +
            'reward.',
        ],
      },
      {
        id: 'tutorial',
        titulo: 'Tutorial: the Slop Tavern',
        paragrafos: [
          'To learn to play without any AI, the site has the Tutorial: a fixed Adventure about the ' +
            'Slop Tavern, a made-to-measure tavern ordering app, with hand-written Challenges and ' +
            'slop planted on purpose. Just sign in with GitHub.',
        ],
      },
    ],
  },
  es: {
    introducao:
      'Quiz your slop es un juego de preguntas y respuestas al estilo RPG en el que aprendes cómo ' +
      'funciona tu propio proyecto de software. Tu IA de programación se vuelve el Máster del ' +
      'juego: lee el repositorio, dibuja un mapa a partir de la estructura del código y hace ' +
      'preguntas sobre él. Cada región del mapa solo se revela cuando demuestras que entiendes ' +
      'cómo funciona.',
    secoes: [
      {
        id: 'mestre',
        titulo: 'El Máster es tu IA',
        paragrafos: [
          'El Juego no incluye IA. El Máster es la CLI de IA que ya usas — Claude Code o Codex CLI ' +
            '— llamada por el Juego, en tu máquina, dentro de la carpeta de tu Proyecto.',
          'El Máster solo puede leer. El Juego lo impone: Claude Code corre solo con las ' +
            'herramientas Read, Grep y Glob, y Codex con --sandbox read-only. Sin edición, sin ' +
            'shell, sin red. Una CLI sin modo restringido se rechaza.',
          'El comando exacto que el Juego va a ejecutar aparece en pantalla antes de empezar.',
        ],
      },
      {
        id: 'codigo',
        titulo: 'Tu código nunca sale de tu máquina',
        paragrafos: [
          'El Juego corre en local. El código lo lee tu IA, que lo envía a su proveedor ' +
            '(Anthropic u OpenAI) como en tu uso normal — nunca al servidor de Quiz your slop.',
          'El servidor solo recibe progreso, sin contenido: la cuenta, el XP, el Título, ' +
            'estadísticas y, por Aventura, un id sin significado, el porcentaje revelado y la ' +
            'Clase.',
        ],
      },
      {
        id: 'mapa',
        titulo: 'El mapa nace de tu repositorio',
        paragrafos: [
          'Una Aventura es la campaña sobre un Proyecto: uno o más repositorios git tratados como ' +
            'un solo sistema. Cada aplicación o servicio se vuelve un Territorio (una isla en el ' +
            'mapa).',
          'Cada Región es una responsabilidad funcional del código — Autenticación, API de ' +
            'pedidos, Esquema de la base de datos —, no una carpeta. Las Regiones se unen por ' +
            'Enlaces: Llamada (HTTP/gRPC/GraphQL), Consulta (base de datos), Evento (cola) o ' +
            'Dependencia directa (import).',
          'Al principio solo la región de entrada está fuera de la Niebla. Eliges una Clase — ' +
            'Backend, Frontend o Fullstack — y ella define por dónde empieza la Aventura.',
        ],
      },
      {
        id: 'expedicao',
        titulo: 'Expediciones y Desafíos',
        paragrafos: [
          'Una Expedición es una sesión corta (10 a 20 minutos) en una región: una batalla contra ' +
            'su Guardián, con 5 Desafíos. Cuatro aciertos revelan la región y desbloquean las ' +
            'vecinas.',
          'Los Desafíos tienen tres formatos, todos con solución objetiva: Opción múltiple, ' +
            'Señalar en el código (elegir el archivo o la función correctos) y Trazar el flujo ' +
            '(ordenar los pasos de un camino por el sistema).',
          'Equivocarse no cuesta nada. Después de cada respuesta aparece la explicación con la ' +
            'Evidencia: la ruta:línea y el fragmento de código que prueban la solución.',
        ],
      },
      {
        id: 'contestacao',
        titulo: 'Desconfiar de la IA es parte del juego',
        paragrafos: [
          'Toda solución trae Evidencia y se puede impugnar. Si crees que el Máster se equivocó, ' +
            'explica por qué; él vuelve a revisar el código. Si reconoce el error, el Desafío se ' +
            'anula y ganas el bono de Cazador de Slop.',
        ],
      },
      {
        id: 'progresso',
        titulo: 'Progresión',
        paragrafos: [
          'El Progreso de la Aventura es la fracción de las regiones conocidas que ya revelaste — ' +
            'y puede bajar cuando el código cambia: una región revelada cuyo código cambió ' +
            'bastante queda desactualizada y pide una nueva Expedición sobre lo que cambió.',
          'El XP suma todas las Aventuras y da un Título cosmético: Commiteador Ciego → Lector de ' +
            'Diff → Arqueólogo de Código → Unslopper. Subir de nivel no da poder: aprender es la ' +
            'recompensa.',
        ],
      },
      {
        id: 'tutorial',
        titulo: 'Tutorial: la Taberna del Slop',
        paragrafos: [
          'Para aprender a jugar sin ninguna IA, el sitio tiene el Tutorial: una Aventura fija ' +
            'sobre la Taberna del Slop, una app de pedidos de taberna hecha a medida, con Desafíos ' +
            'escritos a mano y slop plantado a propósito. Basta con entrar con GitHub.',
        ],
      },
    ],
  },
};
