// A Expedição: uma batalha contra o Guardião da região (spec §3, §13). Imutável, como o mapa: cada
// passo devolve outra Expedição, e o objeto inteiro é serializável.
import type { Desafio, FormatoDesafio } from './contrato.ts';
import { corrigir, type Resposta } from './correcao.ts';
import { CALIBRAGEM_PADRAO, type Calibragem } from './progressao.ts';

/** O Guardião tem 4 vidas: 4 acertos o derrotam e revelam a região. */
export const VIDAS_DO_GUARDIAO = 4;

export type RespostaDada = { resposta: Resposta; acertou: boolean };

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

export function acertosDa(expedicao: Expedicao): number {
  return expedicao.respostas.filter((r) => r.acertou).length;
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
  xp: number;
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
  const arquivos = desafiosJogados(expedicao).flatMap((d) => d.evidencias.map((e) => e.caminho));
  return {
    regiaoId: expedicao.regiaoId,
    venceu: guardiaoDerrotado(expedicao),
    acertos,
    respondidos: expedicao.respostas.length,
    xp: acertos * calibragem.xpPorAcerto,
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
 * lugar do último sorteado que não seja o único de outro Formato exigido.
 */
function garantirMistura(
  escolhidos: Desafio[],
  prioridade: readonly Desafio[],
  exigidos: readonly FormatoDesafio[],
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
      if (!exigidos.includes(atual.formato) || quantosDe(atual.formato) > 1) break;
      k--;
    }
    if (k >= 0) resultado[k] = candidato;
  }
  return resultado;
}

/**
 * Os Desafios de uma nova tentativa: sorteia primeiro entre os ainda não vistos e completa com os
 * já vistos, respeitando a mistura mínima de Formatos quando o banco permite; a Expedição os
 * enfrenta em dificuldade crescente (spec §5).
 */
export function escolherDesafios(
  banco: readonly Desafio[],
  vistos: readonly string[],
  { quantidade = 5, aleatorio = Math.random, temLigacoes = false }: OpcoesDaEscolha = {},
): Desafio[] {
  const jaVistos = new Set(vistos);
  const novos = banco.filter((d) => !jaVistos.has(chaveDoDesafio(d)));
  const repetidos = banco.filter((d) => jaVistos.has(chaveDoDesafio(d)));
  const prioridade = [...embaralhar(novos, aleatorio), ...embaralhar(repetidos, aleatorio)];
  const exigidos: FormatoDesafio[] = temLigacoes ? ['apontar', 'tracar_fluxo'] : ['apontar'];
  return garantirMistura(prioridade.slice(0, quantidade), prioridade, exigidos).sort(
    (a, b) => a.dificuldade - b.dificuldade,
  );
}
