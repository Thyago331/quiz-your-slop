// Textos de "Como funciona" (spec §12, GEO): frases curtas que valem sozinhas, para buscadores e
// IAs citarem. O llms.txt reaproveita estas seções.
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/como-funciona',
  titulo: 'Como funciona',
  descricao:
    'Como o Quiz your slop funciona: a IA do Jogador vira o Mestre, lê o projeto em modo somente ' +
    'leitura, monta um mapa e gera Desafios com Evidência. O código nunca sai da máquina.',
  cartao: 'Como funciona',
};

export type Secao = { id: string; titulo: string; paragrafos: readonly string[] };

export const INTRODUCAO =
  'Quiz your slop é um jogo de perguntas e respostas no estilo RPG em que você aprende como o seu ' +
  'próprio projeto de software funciona. A sua IA de programação vira o Mestre do jogo: ela lê o ' +
  'repositório, desenha um mapa a partir da estrutura do código e faz perguntas sobre ele. Cada ' +
  'região do mapa só se revela quando você mostra que entende como ela funciona.';

export const SECOES: readonly Secao[] = [
  {
    id: 'mestre',
    titulo: 'O Mestre é a sua IA',
    paragrafos: [
      'O Jogo não fornece IA. O Mestre é a CLI de IA que você já usa — Claude Code ou Codex CLI — ' +
        'chamada pelo Jogo, na sua máquina, dentro da pasta do seu Projeto.',
      'O Mestre só pode ler. O Jogo impõe isso: o Claude Code roda só com as ferramentas Read, ' +
        'Grep e Glob, e o Codex com --sandbox read-only. Sem edição, sem shell, sem rede. Uma CLI ' +
        'sem modo restrito é recusada.',
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
      'Uma Aventura é a campanha sobre um Projeto: um ou mais repositórios git tratados como um ' +
        'sistema só. Cada aplicação ou serviço vira um Território (uma ilha no mapa).',
      'Cada Região é uma responsabilidade funcional do código — Autenticação, API de pedidos, ' +
        'Esquema do banco —, não uma pasta. As Regiões se ligam por Ligações: Chamada ' +
        '(HTTP/gRPC/GraphQL), Consulta (banco), Evento (fila) ou Dependência direta (import).',
      'No começo só a região de entrada está fora da Névoa. Você escolhe uma Classe — Backend, ' +
        'Frontend ou Fullstack — e ela define por onde a Aventura começa.',
    ],
  },
  {
    id: 'expedicao',
    titulo: 'Expedições e Desafios',
    paragrafos: [
      'Uma Expedição é uma sessão curta (10 a 20 minutos) numa região: uma batalha contra o ' +
        'Guardião dela, com 5 Desafios. Quatro acertos revelam a região e desbloqueiam as vizinhas.',
      'Os Desafios têm três formatos, todos com gabarito objetivo: Múltipla escolha, Apontar no ' +
        'código (escolher o arquivo ou a função certos) e Traçar o fluxo (ordenar os passos de um ' +
        'caminho pelo sistema).',
      'Errar não custa nada. Depois de cada resposta aparece a explicação com a Evidência: o ' +
        'caminho:linha e o trecho de código que comprovam o gabarito.',
    ],
  },
  {
    id: 'contestacao',
    titulo: 'Desconfiar da IA é parte do jogo',
    paragrafos: [
      'Todo gabarito traz Evidência e pode ser contestado. Se você acha que o Mestre errou, ' +
        'explica por quê; ele reavalia o código. Se reconhece o erro, o Desafio é anulado e você ' +
        'ganha o bônus de Caçador de Slop.',
    ],
  },
  {
    id: 'progresso',
    titulo: 'Progressão',
    paragrafos: [
      'O Progresso da Aventura é a fração das regiões conhecidas que você já revelou — e pode ' +
        'cair quando o código muda: uma região revelada cujo código mudou bastante fica ' +
        'desatualizada e pede uma nova Expedição sobre o que mudou.',
      'O XP soma todas as Aventuras e dá um Título cosmético: Comitador Cego → Leitor de Diff → ' +
        'Arqueólogo de Código → Unslopper. Nível não libera poder: aprender é a recompensa.',
    ],
  },
  {
    id: 'tutorial',
    titulo: 'Tutorial: a Taverna do Slop',
    paragrafos: [
      'Para aprender a jogar sem IA nenhuma, o site tem o Tutorial: uma Aventura fixa sobre a ' +
        'Taverna do Slop, um app de pedidos de taverna feito sob medida, com Desafios escritos à ' +
        'mão e slop plantado de propósito. Basta entrar com GitHub.',
    ],
  },
];
