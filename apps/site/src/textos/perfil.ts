// Textos do Perfil (ficha de personagem) e da tela "O que é enviado" (spec §8, §13).
import type { PorIdioma } from '@quiz/i18n';

type Perfil = {
  titulo: string;
  ficha: string;
  xp: string;
  xpAteProximo: string;
  faltam: string;
  noTopo: string;
  escada: string;
  estatisticas: { expedicoes: string; acertos: string; contestacoes: string };
  aventuras: string;
  tutorial: string;
  aventura: string;
  nomeLocal: string;
  semAventuras: string;
  jogarTutorial: string;
  progresso: string;
};

type Enviado = {
  titulo: string;
  ultimo: string;
  nenhum: string;
  sobe: string[];
  nunca: string;
  conta: string;
  json: string;
  bug: string;
};

export const PERFIL: PorIdioma<Perfil> = {
  pt: {
    titulo: 'Perfil',
    ficha: 'Ficha',
    xp: 'XP',
    xpAteProximo: 'XP até o próximo Título',
    faltam: 'faltam {xp} para {proximo}',
    noTopo: 'Título máximo alcançado.',
    escada: 'Escada de Títulos',
    estatisticas: {
      expedicoes: 'Expedições',
      acertos: 'Acertos',
      contestacoes: 'Contestações vencidas',
    },
    aventuras: 'Aventuras',
    tutorial: 'Taverna do Slop (Tutorial)',
    aventura: 'Aventura {id}',
    nomeLocal: 'o nome fica só no Jogo, na sua máquina',
    semAventuras: 'Nenhuma Aventura ainda.',
    jogarTutorial: 'Jogar o Tutorial',
    progresso: 'Progresso da Aventura',
  },
  en: {
    titulo: 'Profile',
    ficha: 'Character sheet',
    xp: 'XP',
    xpAteProximo: 'XP to the next Title',
    faltam: '{xp} to go for {proximo}',
    noTopo: 'Highest Title reached.',
    escada: 'Title ladder',
    estatisticas: { expedicoes: 'Expeditions', acertos: 'Hits', contestacoes: 'Disputes won' },
    aventuras: 'Adventures',
    tutorial: 'Slop Tavern (Tutorial)',
    aventura: 'Adventure {id}',
    nomeLocal: 'the name stays in the Game, on your machine',
    semAventuras: 'No Adventures yet.',
    jogarTutorial: 'Play the Tutorial',
    progresso: 'Adventure Progress',
  },
  es: {
    titulo: 'Perfil',
    ficha: 'Ficha',
    xp: 'XP',
    xpAteProximo: 'XP hasta el próximo Título',
    faltam: 'faltan {xp} para {proximo}',
    noTopo: 'Título máximo alcanzado.',
    escada: 'Escalera de Títulos',
    estatisticas: {
      expedicoes: 'Expediciones',
      acertos: 'Aciertos',
      contestacoes: 'Impugnaciones ganadas',
    },
    aventuras: 'Aventuras',
    tutorial: 'Taberna del Slop (Tutorial)',
    aventura: 'Aventura {id}',
    nomeLocal: 'el nombre se queda en el Juego, en tu máquina',
    semAventuras: 'Ninguna Aventura todavía.',
    jogarTutorial: 'Jugar el Tutorial',
    progresso: 'Progreso de la Aventura',
  },
};

export const ENVIADO: PorIdioma<Enviado> = {
  pt: {
    titulo: 'O que é enviado',
    ultimo: 'Último envio ao servidor · {quando}',
    nenhum: 'Nada foi enviado ainda: o primeiro envio sai no fim da sua primeira Expedição.',
    sobe: [
      'Seu XP, seu Título e suas estatísticas.',
      'Para cada Aventura: um código sem significado, a porcentagem revelada e a Classe.',
    ],
    nunca:
      'Nunca: nomes de Regiões, caminhos de arquivo, Desafios, gabaritos, trechos de código ou o ' +
      'nome das suas pastas.',
    conta: 'A conta não vai no envio: o servidor sabe quem é você pela sessão do login.',
    json: 'JSON exato do último envio (o Título vai sempre com o nome em português):',
    bug: 'Viu algo além de números e ids aqui? É um bug — reporte. O Jogo é de código aberto.',
  },
  en: {
    titulo: 'What is sent',
    ultimo: 'Last upload to the server · {quando}',
    nenhum:
      'Nothing has been sent yet: the first upload goes out at the end of your first Expedition.',
    sobe: [
      'Your XP, your Title and your stats.',
      'For each Adventure: a meaningless code, the revealed percentage and the Class.',
    ],
    nunca:
      'Never: names of Regions, file paths, Challenges, answer keys, code snippets or the name of ' +
      'your folders.',
    conta:
      'The account is not in the upload: the server knows who you are from the sign-in session.',
    json: 'Exact JSON of the last upload (the Title always goes with its Portuguese name):',
    bug: "Saw anything other than numbers and ids here? That's a bug — report it. The Game is open source.",
  },
  es: {
    titulo: 'Lo que se envía',
    ultimo: 'Último envío al servidor · {quando}',
    nenhum: 'Todavía no se envió nada: el primer envío sale al final de tu primera Expedición.',
    sobe: [
      'Tu XP, tu Título y tus estadísticas.',
      'Para cada Aventura: un código sin significado, el porcentaje revelado y la Clase.',
    ],
    nunca:
      'Nunca: nombres de Regiones, rutas de archivo, Desafíos, soluciones, fragmentos de código ni ' +
      'el nombre de tus carpetas.',
    conta: 'La cuenta no va en el envío: el servidor sabe quién eres por la sesión de inicio.',
    json: 'JSON exacto del último envío (el Título va siempre con su nombre en portugués):',
    bug: '¿Ves algo más que números e ids aquí? Es un bug — repórtalo. El Juego es de código abierto.',
  },
};
