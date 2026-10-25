// Textos da lista de espera por IA (spec §7) e da contagem do dono.
import type { PorIdioma } from '@quiz/i18n';
import type { ErroDaInscricao, IaDaLista } from '@/servidor/lista-de-espera';

type Lista = {
  titulo: string;
  introducao: string;
  enquanto: string;
  jogarTutorial: string;
  pergunta: string;
  ias: Record<IaDaLista, string>;
  qualOutra: string;
  enviar: string;
  trocar: string;
  enviando: string;
  salvo: string;
  atual: string;
  privacidade: string;
  semConta: string;
  erros: Record<ErroDaInscricao, string>;
  contagemTitulo: string;
  contagemTotal: string;
  contagemOutras: string;
  contagemVazia: string;
};

export const LISTA: PorIdioma<Lista> = {
  pt: {
    titulo: 'Lista de espera por IA',
    introducao:
      'O Jogo usa como Mestre o Claude Code ou o Codex CLI que você já tem. Não tem nenhum dos ' +
      'dois? Diga qual IA você usa: a lista decide qual adaptador vem a seguir.',
    enquanto: 'Enquanto isso, o Tutorial da Taverna do Slop não precisa de IA nenhuma.',
    jogarTutorial: 'Jogar o Tutorial',
    pergunta: 'Qual IA de programação você usa?',
    ias: { gemini: 'Gemini CLI', cursor: 'Cursor', copilot: 'GitHub Copilot', outra: 'Outra' },
    qualOutra: 'Qual?',
    enviar: 'Entrar na lista',
    trocar: 'Trocar a minha escolha',
    enviando: 'Enviando…',
    salvo: 'Anotado! Você está na lista de espera.',
    atual: 'A sua escolha:',
    privacidade: 'Guardamos só a IA escolhida, ligada à sua conta.',
    semConta: 'Entre com GitHub para entrar na lista.',
    erros: {
      semIa: 'Escolha uma das IAs da lista.',
      semOutra: 'Diga qual é a outra IA.',
      outraLonga: 'Use até {maximo} caracteres.',
    },
    contagemTitulo: 'Lista de espera: contagem por IA',
    contagemTotal: 'Jogadores na lista:',
    contagemOutras: 'O que escreveram em "Outra":',
    contagemVazia: 'Ninguém escreveu outra IA ainda.',
  },
  en: {
    titulo: 'AI waitlist',
    introducao:
      'The Game uses as its Master the Claude Code or Codex CLI you already have. Have neither? ' +
      'Tell us which AI you use: the list decides which adapter comes next.',
    enquanto: 'Meanwhile, the Slop Tavern Tutorial needs no AI at all.',
    jogarTutorial: 'Play the Tutorial',
    pergunta: 'Which coding AI do you use?',
    ias: { gemini: 'Gemini CLI', cursor: 'Cursor', copilot: 'GitHub Copilot', outra: 'Other' },
    qualOutra: 'Which one?',
    enviar: 'Join the list',
    trocar: 'Change my choice',
    enviando: 'Sending…',
    salvo: "Noted! You're on the waitlist.",
    atual: 'Your choice:',
    privacidade: 'We keep only the AI you picked, tied to your account.',
    semConta: 'Sign in with GitHub to join the list.',
    erros: {
      semIa: 'Pick one of the AIs on the list.',
      semOutra: 'Tell us which other AI.',
      outraLonga: 'Use at most {maximo} characters.',
    },
    contagemTitulo: 'Waitlist: count per AI',
    contagemTotal: 'Players on the list:',
    contagemOutras: 'What they typed under "Other":',
    contagemVazia: 'Nobody typed another AI yet.',
  },
  es: {
    titulo: 'Lista de espera por IA',
    introducao:
      'El Juego usa como Máster el Claude Code o el Codex CLI que ya tienes. ¿No tienes ninguno? ' +
      'Dinos qué IA usas: la lista decide qué adaptador viene después.',
    enquanto: 'Mientras tanto, el Tutorial de la Taberna del Slop no necesita ninguna IA.',
    jogarTutorial: 'Jugar el Tutorial',
    pergunta: '¿Qué IA de programación usas?',
    ias: { gemini: 'Gemini CLI', cursor: 'Cursor', copilot: 'GitHub Copilot', outra: 'Otra' },
    qualOutra: '¿Cuál?',
    enviar: 'Unirme a la lista',
    trocar: 'Cambiar mi elección',
    enviando: 'Enviando…',
    salvo: '¡Anotado! Estás en la lista de espera.',
    atual: 'Tu elección:',
    privacidade: 'Guardamos solo la IA elegida, ligada a tu cuenta.',
    semConta: 'Entra con GitHub para unirte a la lista.',
    erros: {
      semIa: 'Elige una de las IAs de la lista.',
      semOutra: 'Dinos cuál es la otra IA.',
      outraLonga: 'Usa como máximo {maximo} caracteres.',
    },
    contagemTitulo: 'Lista de espera: conteo por IA',
    contagemTotal: 'Jugadores en la lista:',
    contagemOutras: 'Lo que escribieron en "Otra":',
    contagemVazia: 'Nadie escribió otra IA todavía.',
  },
};
