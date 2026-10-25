// Textos do Perfil (ficha de personagem) e da tela "O que é enviado" (spec §8, §13).
export const PERFIL = {
  titulo: 'Perfil',
  ficha: 'Ficha',
  xp: 'XP',
  faltam: (xp: number, proximo: string) => `faltam ${xp} para ${proximo}`,
  noTopo: 'Título máximo alcançado.',
  escada: 'Escada de Títulos',
  estatisticas: {
    expedicoes: 'Expedições',
    acertos: 'Acertos',
    contestacoes: 'Contestações vencidas',
  },
  aventuras: 'Aventuras',
  tutorial: 'Taverna do Slop (Tutorial)',
  aventura: (id: string) => `Aventura ${id.slice(0, 8)}`,
  nomeLocal: 'o nome fica só no Jogo, na sua máquina',
  semAventuras: 'Nenhuma Aventura ainda.',
  jogarTutorial: 'Jogar o Tutorial',
  progresso: 'Progresso da Aventura',
} as const;

export const ENVIADO = {
  titulo: 'O que é enviado',
  ultimo: (quando: string) => `Último envio ao servidor · ${quando}`,
  nenhum: 'Nada foi enviado ainda: o primeiro envio sai no fim da sua primeira Expedição.',
  sobe: [
    'Seu XP, seu Título e suas estatísticas.',
    'Para cada Aventura: um código sem significado, a porcentagem revelada e a Classe.',
  ],
  nunca:
    'Nunca: nomes de Regiões, caminhos de arquivo, Desafios, gabaritos, trechos de código ou o ' +
    'nome das suas pastas.',
  conta: 'A conta não vai no envio: o servidor sabe quem é você pela sessão do login.',
  json: 'JSON exato do último envio:',
  bug: 'Viu algo além de números e ids aqui? É um bug — reporte. O Jogo é de código aberto.',
} as const;
