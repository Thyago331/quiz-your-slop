// O envio de progresso ao servidor (spec §8): a única coisa que sai da máquina do Jogador. Só
// números e ids opacos — nada de mapa, caminhos, Desafios ou nomes. A conta vem da sessão, não do
// corpo. `lerEnvio` é a lista permitida: qualquer campo a mais, em qualquer nível, é recusado.
import { CLASSES, type Classe } from './contrato.ts';
import type { Aventura } from './aventura.ts';
import { progresso, type MapaAventura } from './mapa.ts';
import { CALIBRAGEM_PADRAO, tituloDoXp, type Calibragem } from './progressao.ts';

export type EstatisticasDoJogador = {
  expedicoes: number;
  acertos: number;
  /** Já contadas nos acertos (Desafio anulado conta como acerto). */
  contestacoes_vencidas: number;
};

export type AventuraEnviada = {
  /** Opaco: "tutorial" ou um UUID sorteado pelo Jogo. Nunca o nome do Projeto ou de uma Região. */
  id: string;
  /** Progresso da Aventura, em % inteiro. */
  progresso: number;
  classe: Classe;
};

export type EnvioDeProgresso = {
  xp: number;
  titulo: string;
  estatisticas: EstatisticasDoJogador;
  aventuras: AventuraEnviada[];
};

export const ID_AVENTURA_TUTORIAL = 'tutorial';
export const MAXIMO_DE_AVENTURAS = 100;
/** XP e estatísticas vão para colunas `integer` do Postgres: acima disto, o banco recusaria. */
export const INTEIRO_MAXIMO = 2_147_483_647;
export const ESTATISTICAS_ZERADAS: EstatisticasDoJogador = {
  expedicoes: 0,
  acertos: 0,
  contestacoes_vencidas: 0,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function ehIdDeAventura(id: unknown): id is string {
  return typeof id === 'string' && (id === ID_AVENTURA_TUTORIAL || UUID.test(id));
}

/** Progresso da Aventura em % inteiro (0 sem regiões conhecidas). */
export function porcentagemDoProgresso(mapa: MapaAventura): number {
  const { reveladas, conhecidas } = progresso(mapa);
  return conhecidas > 0 ? Math.round((100 * reveladas) / conhecidas) : 0;
}

/** Estatísticas só sobem: cada contador fica com o maior dos dois. */
export function mesclarEstatisticas(
  a: EstatisticasDoJogador,
  b: EstatisticasDoJogador,
): EstatisticasDoJogador {
  return {
    expedicoes: Math.max(a.expedicoes, b.expedicoes),
    acertos: Math.max(a.acertos, b.acertos),
    contestacoes_vencidas: Math.max(a.contestacoes_vencidas, b.contestacoes_vencidas),
  };
}

export function somarExpedicao(
  estatisticas: EstatisticasDoJogador,
  resultado: { acertos: number; contestacoesVencidas: number },
): EstatisticasDoJogador {
  return {
    expedicoes: estatisticas.expedicoes + 1,
    acertos: estatisticas.acertos + resultado.acertos,
    contestacoes_vencidas: estatisticas.contestacoes_vencidas + resultado.contestacoesVencidas,
  };
}

/** O envio a partir do estado local: do mapa sai só a porcentagem; da Aventura, só a Classe. */
export function montarEnvio(
  dados: {
    xp: number;
    estatisticas: EstatisticasDoJogador;
    aventuras: readonly { id: string; aventura: Aventura }[];
  },
  calibragem: Calibragem = CALIBRAGEM_PADRAO,
): EnvioDeProgresso {
  return {
    xp: dados.xp,
    titulo: tituloDoXp(dados.xp, calibragem).atual.nome,
    estatisticas: { ...dados.estatisticas },
    aventuras: dados.aventuras.map(({ id, aventura }) => ({
      id,
      progresso: porcentagemDoProgresso(aventura.mapa),
      classe: aventura.classe,
    })),
  };
}

export type LeituraDoEnvio = { ok: true; envio: EnvioDeProgresso } | { ok: false; erro: string };

class Recusa extends Error {}

function objeto(dado: unknown, onde: string, chaves: readonly string[]): Record<string, unknown> {
  if (typeof dado !== 'object' || dado === null || Array.isArray(dado))
    throw new Recusa(`${onde} precisa ser um objeto`);
  const registro = dado as Record<string, unknown>;
  for (const chave of Object.keys(registro))
    if (!chaves.includes(chave)) throw new Recusa(`campo não permitido: ${onde}.${chave}`);
  for (const chave of chaves)
    if (!(chave in registro)) throw new Recusa(`campo obrigatório: ${onde}.${chave}`);
  return registro;
}

function contagem(dado: unknown, onde: string, maximo = INTEIRO_MAXIMO): number {
  if (typeof dado !== 'number' || !Number.isSafeInteger(dado) || dado < 0 || dado > maximo)
    throw new Recusa(`${onde} precisa ser um inteiro de 0 a ${maximo}`);
  return dado;
}

function lerAventura(dado: unknown, onde: string): AventuraEnviada {
  const a = objeto(dado, onde, ['id', 'progresso', 'classe']);
  if (!ehIdDeAventura(a.id)) throw new Recusa(`${onde}.id precisa ser "tutorial" ou um UUID`);
  const classe = CLASSES.find((c) => c === a.classe);
  if (!classe) throw new Recusa(`${onde}.classe precisa ser ${CLASSES.join(', ')}`);
  return { id: a.id, progresso: contagem(a.progresso, `${onde}.progresso`, 100), classe };
}

/**
 * Valida o que chegou (já com JSON.parse) contra a lista permitida e devolve uma cópia montada
 * campo a campo — nada do objeto original passa adiante.
 */
export function lerEnvio(
  dado: unknown,
  calibragem: Calibragem = CALIBRAGEM_PADRAO,
): LeituraDoEnvio {
  try {
    const raiz = objeto(dado, 'envio', ['xp', 'titulo', 'estatisticas', 'aventuras']);
    const xp = contagem(raiz.xp, 'envio.xp');
    const titulo = tituloDoXp(xp, calibragem).atual.nome;
    if (raiz.titulo !== titulo)
      throw new Recusa(`envio.titulo precisa ser "${titulo}" para ${xp} XP`);
    const e = objeto(raiz.estatisticas, 'envio.estatisticas', [
      'expedicoes',
      'acertos',
      'contestacoes_vencidas',
    ]);
    const estatisticas: EstatisticasDoJogador = {
      expedicoes: contagem(e.expedicoes, 'envio.estatisticas.expedicoes'),
      acertos: contagem(e.acertos, 'envio.estatisticas.acertos'),
      contestacoes_vencidas: contagem(
        e.contestacoes_vencidas,
        'envio.estatisticas.contestacoes_vencidas',
      ),
    };
    if (estatisticas.contestacoes_vencidas > estatisticas.acertos)
      throw new Recusa('envio.estatisticas: Contestações vencidas já contam como acertos');
    if (!Array.isArray(raiz.aventuras)) throw new Recusa('envio.aventuras precisa ser uma lista');
    if (raiz.aventuras.length > MAXIMO_DE_AVENTURAS)
      throw new Recusa(`envio.aventuras: no máximo ${MAXIMO_DE_AVENTURAS}`);
    const aventuras = raiz.aventuras.map((a, k) => lerAventura(a, `envio.aventuras[${k}]`));
    if (new Set(aventuras.map((a) => a.id)).size !== aventuras.length)
      throw new Recusa('envio.aventuras: Aventura repetida');
    return { ok: true, envio: { xp, titulo, estatisticas, aventuras } };
  } catch (erro) {
    if (erro instanceof Recusa) return { ok: false, erro: erro.message };
    throw erro;
  }
}

/**
 * Junta um envio ao que já estava guardado. XP e estatísticas só sobem (o maior vence): reenviar,
 * repetir ou chegar fora de ordem não perde nada. O Progresso pode cair (spec §3), então por
 * Aventura vale o último envio; Aventuras que não vieram ficam como estavam.
 */
export function mesclarProgresso(
  guardado: EnvioDeProgresso | null,
  envio: EnvioDeProgresso,
  calibragem: Calibragem = CALIBRAGEM_PADRAO,
): EnvioDeProgresso {
  if (!guardado) return { ...envio, aventuras: [...envio.aventuras] };
  const xp = Math.max(guardado.xp, envio.xp);
  const novas = new Map(envio.aventuras.map((a) => [a.id, a]));
  const aventuras = guardado.aventuras.map((a) => novas.get(a.id) ?? a);
  const antigas = new Set(guardado.aventuras.map((a) => a.id));
  aventuras.push(...envio.aventuras.filter((a) => !antigas.has(a.id)));
  return {
    xp,
    titulo: tituloDoXp(xp, calibragem).atual.nome,
    estatisticas: mesclarEstatisticas(guardado.estatisticas, envio.estatisticas),
    aventuras,
  };
}
