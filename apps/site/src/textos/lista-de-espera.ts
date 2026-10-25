// Textos da lista de espera por IA (spec §7) e da contagem do dono.
import type { IaDaLista } from '@/servidor/lista-de-espera';

export const LISTA = {
  titulo: 'Lista de espera por IA',
  introducao:
    'O Jogo usa como Mestre o Claude Code ou o Codex CLI que você já tem. Não tem nenhum dos ' +
    'dois? Diga qual IA você usa: a lista decide qual adaptador vem a seguir.',
  enquanto: 'Enquanto isso, o Tutorial da Taverna do Slop não precisa de IA nenhuma.',
  jogarTutorial: 'Jogar o Tutorial',
  pergunta: 'Qual IA de programação você usa?',
  ias: {
    gemini: 'Gemini CLI',
    cursor: 'Cursor',
    copilot: 'GitHub Copilot',
    outra: 'Outra',
  } satisfies Record<IaDaLista, string>,
  qualOutra: 'Qual?',
  enviar: 'Entrar na lista',
  trocar: 'Trocar a minha escolha',
  enviando: 'Enviando…',
  salvo: 'Anotado! Você está na lista de espera.',
  atual: 'A sua escolha:',
  privacidade: 'Guardamos só a IA escolhida, ligada à sua conta.',
  contagemTitulo: 'Lista de espera: contagem por IA',
  contagemTotal: 'Jogadores na lista:',
  contagemOutras: 'O que escreveram em "Outra":',
  contagemVazia: 'Ninguém escreveu outra IA ainda.',
} as const;
