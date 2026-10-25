// A Expedição: uma batalha contra o Guardião da região (spec §3, §13). Imutável, como o mapa: cada
// passo devolve outra Expedição, e o objeto inteiro é serializável.
import type { Desafio, FormatoDesafio, SaidaContestar } from './contrato.ts';
import { corrigir, type Resposta } from './correcao.ts';
import { CALIBRAGEM_PADRAO, type Calibragem } from './progressao.ts';

/** O Guardião tem 4 vidas: 4 acertos o derrotam e revelam a região. */
export const VIDAS_DO_GUARDIAO = 4;

/** O argumento do Jogador e o que o Mestre (ou o Tutorial) respondeu. */
export type Contestacao = SaidaContestar & { argumento: string };

export type RespostaDada = {
  resposta: Resposta;
  /** A correção original, mesmo que a Contestação anule o Desafio depois. */
  acertou: boolean;
  contestacao?: Contestacao;
};

/** O argumento da Contestação é curto: uma ou duas frases. */
export const ARGUMENTO_MAXIMO = 280;

/** O argumento que contestarDesafio aceita: de 1 a ARGUMENTO_MAXIMO caracteres, sem as bordas. */
export function argumentoValido(argumento: string): boolean {
  const texto = argumento.trim();
  return texto.length > 0 && texto.length <= ARGUMENTO_MAXIMO;
}

export type FaseExpedicao = 'respondendo' | 'corrigido' | 'encerrada';

export type Expedicao = {
  regiaoId: string;
  desafios: readonly Desafio[];
  /** Uma por Desafio respondido, na ordem dos Desafios. */
  respostas: readonly RespostaDada[];
  /** Índice do Desafio em jogo (ou do último, depois de encerrada). */
  atual: number;
  fase: FaseExpedicao;
};

export function iniciarExpedicao(regiaoId: string, desafios: readonly Desafio[]): Expedicao {
  if (desafios.length === 0) throw new Error(`Expedição sem Desafios: ${regiaoId}`);
  return { regiaoId, desafios, respostas: [], atual: 0, fase: 'respondendo' };
}

export function desafioAtual(expedicao: Expedicao): Desafio {
  const desafio = expedicao.desafios[expedicao.atual];
  if (!desafio) throw new Error(`Desafio fora da Expedição: ${expedicao.atual}`);
  return desafio;
}

/** Um Desafio anulado por Contestação conta como acerto (spec §3). */
const contaComoAcerto = (r: RespostaDada) => r.acertou || r.contestacao?.veredito === 'anulado';

export function acertosDa(expedicao: Expedicao): number {
  return expedicao.respostas.filter(contaComoAcerto).length;
}

/** Contestações vencidas (Desafios anulados): cada uma vale o bônus de Caçador de Slop. */
export function contestacoesVencidas(expedicao: Expedicao): number {
  return expedicao.respostas.filter((r) => r.contestacao?.veredito === 'anulado').length;
}

export function vidasDoGuardiao(expedicao: Expedicao): number {
  return Math.max(0, VIDAS_DO_GUARDIAO - acertosDa(expedicao));
}

export function guardiaoDerrotado(expedicao: Expedicao): boolean {
  return vidasDoGuardiao(expedicao) === 0;
}

function exigirFase(expedicao: Expedicao, fase: FaseExpedicao, acao: string): void {
  if (expedicao.fase !== fase) {
    throw new Error(`Não dá para ${acao} com a Expedição ${expedicao.fase}; precisa estar ${fase}`);
  }
}

/** Corrige na hora o Desafio em jogo. Errar não custa nada ao Jogador. */
export function responderDesafio(expedicao: Expedicao, resposta: Resposta): Expedicao {
  exigirFase(expedicao, 'respondendo', 'responder');
  const acertou = corrigir(desafioAtual(expedicao), resposta);
  return {
    ...expedicao,
    respostas: [...expedicao.respostas, { resposta: [...resposta], acertou }],
    fase: 'corrigido',
  };
}

/** Depois da correção, o Desafio em jogo ainda não contestado pode ser contestado. */
export function podeContestar(expedicao: Expedicao): boolean {
  return expedicao.fase === 'corrigido' && !expedicao.respostas[expedicao.atual]?.contestacao;
}

/**
 * O Jogador contesta o gabarito do Desafio recém-corrigido; `saida` é a reavaliação (do Mestre,
 * ou roteirizada no Tutorial). Anulado, o Desafio passa a contar como acerto — e pode ser o golpe
 * que derruba o Guardião. A Expedição continua no mesmo Desafio, esperando o avançar.
 */
export function contestarDesafio(
  expedicao: Expedicao,
  argumento: string,
  saida: SaidaContestar,
): Expedicao {
  exigirFase(expedicao, 'corrigido', 'contestar');
  const resposta = expedicao.respostas[expedicao.atual];
  if (!resposta) throw new Error(`Desafio sem resposta: ${expedicao.atual}`);
  if (resposta.contestacao) throw new Error('Este Desafio já foi contestado');
  if (!argumentoValido(argumento)) {
    throw new Error(`O argumento precisa ter de 1 a ${ARGUMENTO_MAXIMO} caracteres`);
  }
  const respostas = [...expedicao.respostas];
  respostas[expedicao.atual] = {
    ...resposta,
    contestacao: { argumento: argumento.trim(), ...saida },
  };
  return { ...expedicao, respostas };
}

/**
 * Depois da correção, segue para o próximo Desafio. A Expedição encerra quando o Guardião cai (o
 * Desafio que sobra fica para outra vez) ou quando os Desafios acabam.
 */
export function avancar(expedicao: Expedicao): Expedicao {
  exigirFase(expedicao, 'corrigido', 'avançar');
  const acabou = expedicao.atual + 1 >= expedicao.desafios.length;
  if (guardiaoDerrotado(expedicao) || acabou) return { ...expedicao, fase: 'encerrada' };
  return { ...expedicao, atual: expedicao.atual + 1, fase: 'respondendo' };
}

/** Os Desafios que o Jogador chegou a ver (os que sobraram depois da vitória não contam). */
export function desafiosJogados(expedicao: Expedicao): readonly Desafio[] {
  return expedicao.desafios.slice(0, expedicao.respostas.length);
}

export type ResultadoExpedicao = {
  regiaoId: string;
  venceu: boolean;
  acertos: number;
  respondidos: number;
  /** Acertos e bônus de Caçador de Slop. */
  xp: number;
  /** Desafios anulados por Contestação (já contados nos acertos). */
  contestacoesVencidas: number;
  /** Caminhos das Evidências dos Desafios jogados, sem repetir, na ordem em que apareceram. */
  arquivosCitados: string[];
};

/** O resumo da tela de VITÓRIA (ou de "o Guardião resistiu"). */
export function resultadoDaExpedicao(
  expedicao: Expedicao,
  calibragem: Calibragem = CALIBRAGEM_PADRAO,
): ResultadoExpedicao {
  exigirFase(expedicao, 'encerrada', 'resumir');
  const acertos = acertosDa(expedicao);
  const vencidas = contestacoesVencidas(expedicao);
  const arquivos = desafiosJogados(expedicao).flatMap((d) => d.evidencias.map((e) => e.caminho));
  return {
    regiaoId: expedicao.regiaoId,
    venceu: guardiaoDerrotado(expedicao),
    acertos,
    respondidos: expedicao.respostas.length,
    xp: acertos * calibragem.xpPorAcerto + vencidas * calibragem.xpCacadorDeSlop,
    contestacoesVencidas: vencidas,
    arquivosCitados: [...new Set(arquivos)],
  };
}

/** Número em [0, 1), como Math.random; recebido de fora para os testes preverem o sorteio. */
export type Aleatorio = () => number;

/** Quem é o Desafio para "já visto": o id que o Jogo deu, ou o enunciado (como no contrato). */
export function chaveDoDesafio(desafio: Desafio): string {
  return desafio.id ?? desafio.enunciado;
}

function embaralhar<T>(itens: readonly T[], aleatorio: Aleatorio): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  }
  return copia;
}

export type OpcoesDaEscolha = {
  /** Normalmente 5 (spec §5). */
  quantidade?: number;
  aleatorio?: Aleatorio;
  /** A região tem Ligações: a Expedição precisa de um Traçar o fluxo. */
  temLigacoes?: boolean;
};

/**
 * Mistura mínima (contrato, Validação 4): falta um Formato exigido e o banco tem um → ele entra no
 * lugar do último sorteado que não seja o único de outro Formato exigido nem intocável (a isca).
 */
function garantirMistura(
  escolhidos: Desafio[],
  prioridade: readonly Desafio[],
  exigidos: readonly FormatoDesafio[],
  intocaveis: readonly Desafio[],
): Desafio[] {
  const resultado = [...escolhidos];
  const quantosDe = (formato: FormatoDesafio) =>
    resultado.filter((d) => d.formato === formato).length;
  for (const formato of exigidos) {
    if (quantosDe(formato) > 0) continue;
    const candidato = prioridade.find((d) => d.formato === formato && !resultado.includes(d));
    if (!candidato) continue;
    let k = resultado.length - 1;
    while (k >= 0) {
      const atual = resultado[k] as Desafio;
      const sobra = !exigidos.includes(atual.formato) || quantosDe(atual.formato) > 1;
      if (sobra && !intocaveis.includes(atual)) break;
      k--;
    }
    if (k >= 0) resultado[k] = candidato;
  }
  return resultado;
}

/**
 * Os Desafios de uma nova tentativa: sorteia primeiro entre os ainda não vistos (a isca não vista
 * sempre entra) e completa com os já vistos, respeitando a mistura mínima de Formatos quando o
 * banco permite; a Expedição os enfrenta em dificuldade crescente (spec §5).
 *
 * Entre os inéditos, um de cada Formato exigido vai na frente e outro fica guardado para o fim:
 * assim a próxima tentativa ainda acha os Formatos exigidos sem repetir Desafio.
 */
export function escolherDesafios(
  banco: readonly Desafio[],
  vistos: readonly string[],
  { quantidade = 5, aleatorio = Math.random, temLigacoes = false }: OpcoesDaEscolha = {},
): Desafio[] {
  const jaVistos = new Set(vistos);
  const novos = banco.filter((d) => !jaVistos.has(chaveDoDesafio(d)));
  const repetidos = banco.filter((d) => jaVistos.has(chaveDoDesafio(d)));
  const exigidos: FormatoDesafio[] = temLigacoes ? ['apontar', 'tracar_fluxo'] : ['apontar'];
  // A isca da Contestação roteirizada ainda não vista vem na frente: o Tutorial não a esconde.
  const iscas = embaralhar(
    novos.filter((d) => d.isca),
    aleatorio,
  );
  const ineditos = embaralhar(
    novos.filter((d) => !d.isca),
    aleatorio,
  );
  const frente: Desafio[] = [];
  const reserva: Desafio[] = [];
  for (const formato of exigidos) {
    const [primeiro, segundo] = ineditos.filter((d) => d.formato === formato);
    if (primeiro) frente.push(primeiro);
    if (segundo) reserva.push(segundo);
  }
  const prioridade = [
    ...iscas,
    ...frente,
    ...ineditos.filter((d) => !frente.includes(d) && !reserva.includes(d)),
    ...reserva,
    ...embaralhar(repetidos, aleatorio),
  ];
  return garantirMistura(prioridade.slice(0, quantidade), prioridade, exigidos, iscas).sort(
    (a, b) => a.dificuldade - b.dificuldade,
  );
}
