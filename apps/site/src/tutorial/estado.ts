// O estado do Tutorial num objeto só, serializável: XP e estatísticas do Jogador, a Aventura e a
// Expedição em curso. O estado inteiro fica neste navegador (localStorage); ao servidor só vai o
// resumo sem conteúdo de envioDoTutorial (spec §8) — o mapa retoma só neste aparelho.
import {
  CLASSES,
  ESTADOS_NO_MAPA,
  ESTATISTICAS_ZERADAS,
  ID_AVENTURA_TUTORIAL,
  argumentoValido,
  avancar,
  concluirExpedicao,
  contestacaoRoteirizada,
  contestarDesafio,
  desafioAtual,
  escolherDesafios,
  iniciarAventura,
  iniciarExpedicao,
  iniciarMapa,
  mesclarEstatisticas,
  montarEnvio,
  podeContestar,
  responderDesafio,
  resultadoDaExpedicao,
  somarExpedicao,
  vizinhas,
  type Aleatorio,
  type Aventura,
  type Classe,
  type Desafio,
  type EnvioDeProgresso,
  type EstatisticasDoJogador,
  type EstruturaMapa,
  type Expedicao,
  type Idioma,
  type MapaAventura,
} from '@quiz/jogo';
import {
  DESAFIOS,
  ENTRADAS,
  LIGACOES,
  REGIOES,
  desafiosDaRegiao,
  type DesafioTaverna,
} from '@quiz/taverna';

export const ESTRUTURA: EstruturaMapa = {
  regioes: REGIOES.map((r) => r.id),
  ligacoes: LIGACOES.map((l) => ({
    id: l.id,
    origem: l.origem.regiao_id,
    destino: l.destino.regiao_id,
  })),
};

export type EstadoTutorial = {
  /** Do Jogador, não da Aventura: recomeçar o Tutorial não o apaga. */
  xp: number;
  /** Também do Jogador: Expedições, acertos e Contestações vencidas. */
  estatisticas: EstatisticasDoJogador;
  /** null enquanto o Jogador escolhe a Classe. */
  aventura: Aventura | null;
  /** A Expedição em curso; encerrada, ela fica até o Jogador sair do resumo. */
  expedicao: Expedicao | null;
  /** Regiões que saíram da Névoa na última revelação ("A Névoa recua!"). */
  descobertas: string[];
};

export const ESTADO_INICIAL: EstadoTutorial = {
  xp: 0,
  estatisticas: ESTATISTICAS_ZERADAS,
  aventura: null,
  expedicao: null,
  descobertas: [],
};

export type AcaoTutorial =
  | { tipo: 'escolherClasse'; classe: Classe }
  /** Os Desafios vêm sorteados de fora (desafiosParaPartir), para o redutor ficar puro. */
  | { tipo: 'partir'; regiaoId: string; desafios: readonly Desafio[] }
  | { tipo: 'responder'; resposta: string[] }
  /** Contestação roteirizada: sem Mestre, só a isca é anulada. */
  | { tipo: 'contestar'; argumento: string }
  | { tipo: 'avancar' }
  | { tipo: 'voltarAoMapa' }
  | { tipo: 'recomecar' }
  /** O progresso do servidor (de outro aparelho, talvez): XP e estatísticas só sobem. */
  | { tipo: 'sincronizar'; servidor: EnvioDeProgresso };

export const temDesafios = (regiaoId: string) => (DESAFIOS[regiaoId]?.length ?? 0) > 0;

function emExpedicao(estado: EstadoTutorial, regiaoId: string): boolean {
  const atual = estado.aventura?.mapa.estados[regiaoId];
  return atual === 'desbloqueada' || atual === 'desatualizada';
}

/** Há Expedição numa região desbloqueada (ou desatualizada) com Desafios no banco. */
export function podePartir(estado: EstadoTutorial, regiaoId: string): boolean {
  return emExpedicao(estado, regiaoId) && temDesafios(regiaoId);
}

/** Só as Ligações importam aqui (para vizinhas); a entrada é qualquer região. */
const MAPA_COMPLETO = iniciarMapa(ESTRUTURA, ESTRUTURA.regioes[0]!);
const temLigacoes = (regiaoId: string) => vizinhas(MAPA_COMPLETO, regiaoId).length > 0;

/**
 * Sorteia os 5 Desafios da tentativa no idioma da tela, preferindo os que o Jogador ainda não viu
 * na região e respeitando a mistura mínima de Formatos. Os ids são os mesmos em todo idioma, então
 * trocar de idioma não faz rever Desafio.
 */
export function desafiosParaPartir(
  estado: EstadoTutorial,
  regiaoId: string,
  aleatorio: Aleatorio = Math.random,
  idioma: Idioma = 'pt',
): Desafio[] {
  const vistos = estado.aventura?.vistos[regiaoId] ?? [];
  return escolherDesafios(desafiosDaRegiao(regiaoId, idioma), vistos, {
    aleatorio,
    temLigacoes: temLigacoes(regiaoId),
  });
}

/**
 * O texto de anulação mora no banco da Taverna, junto da isca: vem no próprio Desafio sorteado, no
 * idioma em que saiu (a tradução sempre o leva junto).
 */
const anulacaoDo = (desafio: Desafio) => (desafio as Partial<DesafioTaverna>).anulacao;

const saidasDaNevoa = (antes: MapaAventura, depois: MapaAventura) =>
  Object.keys(depois.estados).filter(
    (id) => antes.estados[id] === 'nevoa' && depois.estados[id] !== 'nevoa',
  );

export function tutorial(estado: EstadoTutorial, acao: AcaoTutorial): EstadoTutorial {
  const { aventura, expedicao } = estado;
  switch (acao.tipo) {
    case 'escolherClasse':
      return {
        ...estado,
        aventura: iniciarAventura(ESTRUTURA, acao.classe, ENTRADAS),
        expedicao: null,
        descobertas: [],
      };
    case 'partir':
      if (!podePartir(estado, acao.regiaoId) || expedicao) return estado;
      return {
        ...estado,
        expedicao: iniciarExpedicao(acao.regiaoId, acao.desafios),
        descobertas: [],
      };
    case 'responder':
      if (expedicao?.fase !== 'respondendo') return estado;
      return { ...estado, expedicao: responderDesafio(expedicao, acao.resposta) };
    case 'contestar': {
      if (!expedicao || !podeContestar(expedicao)) return estado;
      // contestarDesafio lança com argumento inválido; o redutor só ignora.
      if (!argumentoValido(acao.argumento)) return estado;
      const desafio = desafioAtual(expedicao);
      const saida = contestacaoRoteirizada(desafio, anulacaoDo(desafio));
      return { ...estado, expedicao: contestarDesafio(expedicao, acao.argumento, saida) };
    }
    case 'avancar': {
      if (!aventura || expedicao?.fase !== 'corrigido') return estado;
      const seguinte = avancar(expedicao);
      if (seguinte.fase !== 'encerrada') return { ...estado, expedicao: seguinte };
      const depois = concluirExpedicao(aventura, seguinte);
      const resultado = resultadoDaExpedicao(seguinte);
      return {
        ...estado,
        xp: estado.xp + resultado.xp,
        estatisticas: somarExpedicao(estado.estatisticas, resultado),
        aventura: depois,
        expedicao: seguinte,
        descobertas: saidasDaNevoa(aventura.mapa, depois.mapa),
      };
    }
    case 'voltarAoMapa':
      return expedicao?.fase === 'encerrada' ? { ...estado, expedicao: null } : estado;
    case 'recomecar':
      return { ...ESTADO_INICIAL, xp: estado.xp, estatisticas: estado.estatisticas };
    case 'sincronizar': {
      const { xp, estatisticas } = acao.servidor;
      return {
        ...estado,
        xp: Math.max(estado.xp, xp),
        estatisticas: mesclarEstatisticas(estado.estatisticas, estatisticas),
      };
    }
  }
}

/** O que vai ao servidor: XP, Título, estatísticas e a Aventura do Tutorial como id fixo + % + Classe. */
export function envioDoTutorial(estado: EstadoTutorial): EnvioDeProgresso {
  return montarEnvio({
    xp: estado.xp,
    estatisticas: estado.estatisticas,
    aventuras: estado.aventura ? [{ id: ID_AVENTURA_TUTORIAL, aventura: estado.aventura }] : [],
  });
}

const contagem = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const ehUmDe = (lista: readonly string[], valor: unknown) =>
  typeof valor === 'string' && lista.includes(valor);

/**
 * O estado guardado neste navegador, se ainda servir: o mapa precisa ter as mesmas regiões da
 * Taverna. Volta sempre ao mapa (sem Expedição em curso), porque o banco de Desafios pode ter
 * mudado desde então. Qualquer coisa estranha vira null e o Tutorial começa do zero.
 */
export function estadoSalvo(salvo: unknown): EstadoTutorial | null {
  if (typeof salvo !== 'object' || salvo === null) return null;
  const s = salvo as Partial<Record<keyof EstadoTutorial, unknown>>;
  const e = s.estatisticas as Partial<EstatisticasDoJogador> | undefined;
  if (!contagem(s.xp) || !e || !contagem(e.expedicoes) || !contagem(e.acertos)) return null;
  if (!contagem(e.contestacoes_vencidas)) return null;
  const estatisticas: EstatisticasDoJogador = {
    expedicoes: e.expedicoes,
    acertos: e.acertos,
    contestacoes_vencidas: e.contestacoes_vencidas,
  };
  const base = { ...ESTADO_INICIAL, xp: s.xp, estatisticas };
  if (s.aventura === null) return base;
  const a = s.aventura as Partial<Aventura> | undefined;
  const estados = a?.mapa?.estados as Record<string, unknown> | undefined;
  const regioes = estados ? Object.keys(estados) : [];
  const mesmoMapa =
    regioes.length === ESTRUTURA.regioes.length &&
    ESTRUTURA.regioes.every((id) => ehUmDe(ESTADOS_NO_MAPA, estados?.[id]));
  if (!a || !ehUmDe(CLASSES, a.classe) || !mesmoMapa) return null;
  const listas = Array.isArray(a.mapa?.ligacoes) && Array.isArray(a.mapa?.ligacoesConhecidas);
  if (!listas || typeof a.vistos !== 'object' || !a.vistos) return null;
  return { ...base, aventura: a as Aventura };
}
