// XP, Títulos (spec §3) e o limiar da Região desatualizada (spec §6). Os números são calibragem,
// não regra: ficam num objeto que o Jogo pode trocar sem mexer na lógica.

export type Titulo = { nome: string; xpMinimo: number };

export type Calibragem = {
  xpPorAcerto: number;
  /** Bônus de Caçador de Slop: Contestação vencida (Desafio anulado). */
  xpCacadorDeSlop: number;
  /** Em ordem crescente de xpMinimo; o primeiro começa em 0. */
  titulos: readonly Titulo[];
  /** Fração das linhas da região (no commit da revelação) que, mudada, a deixa desatualizada. */
  limiarDesatualizada: number;
  /** Bytes do `git diff` que ainda vão ao Mestre; acima disso, só a lista de arquivos alterados. */
  limiteDoDiff: number;
};

export const CALIBRAGEM_PADRAO: Calibragem = {
  xpPorAcerto: 20,
  xpCacadorDeSlop: 50,
  titulos: [
    { nome: 'Comitador Cego', xpMinimo: 0 },
    { nome: 'Leitor de Diff', xpMinimo: 100 },
    { nome: 'Arqueólogo de Código', xpMinimo: 300 },
    { nome: 'Unslopper', xpMinimo: 600 },
  ],
  limiarDesatualizada: 0.2,
  limiteDoDiff: 40_000,
};

export type TituloDoXp = { atual: Titulo; proximo: Titulo | null };

/** O Título é cosmético: nome do maior limiar alcançado, e o próximo a alcançar. */
export function tituloDoXp(xp: number, calibragem: Calibragem = CALIBRAGEM_PADRAO): TituloDoXp {
  const { titulos } = calibragem;
  const primeiro = titulos[0];
  if (!primeiro) throw new Error('A calibragem precisa de ao menos um Título');
  let atual = primeiro;
  let proximo: Titulo | null = null;
  for (const titulo of titulos) {
    if (xp >= titulo.xpMinimo) atual = titulo;
    else {
      proximo = titulo;
      break;
    }
  }
  return { atual, proximo };
}
