// O estado do Tutorial num objeto só, serializável: XP do Jogador, a Aventura e a Expedição em
// curso. Por enquanto vive em memória; guardá-lo no servidor é um passo seguinte.
import {
  ARGUMENTO_MAXIMO,
  avancar,
  concluirExpedicao,
  contestacaoRoteirizada,
  contestarDesafio,
  desafioAtual,
  escolherDesafios,
  iniciarAventura,
  iniciarExpedicao,
  podeContestar,
  responderDesafio,
  resultadoDaExpedicao,
  revelar,
  type Aleatorio,
  type Aventura,
  type Classe,
  type Desafio,
  type EstruturaMapa,
  type Expedicao,
  type MapaAventura,
} from '@quiz/jogo';
import { DESAFIOS, ENTRADAS, LIGACOES, REGIOES } from '@quiz/taverna';

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
  /** null enquanto o Jogador escolhe a Classe. */
  aventura: Aventura | null;
  /** A Expedição em curso; encerrada, ela fica até o Jogador sair do resumo. */
  expedicao: Expedicao | null;
  /** Regiões que saíram da Névoa na última revelação ("A Névoa recua!"). */
  descobertas: string[];
};

export const ESTADO_INICIAL: EstadoTutorial = {
  xp: 0,
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
  /** Temporário: revela sem Expedição as regiões que ainda não têm Desafios. */
  | { tipo: 'revelarTeste'; regiaoId: string }
  | { tipo: 'recomecar' };

export const temDesafios = (regiaoId: string) => (DESAFIOS[regiaoId]?.length ?? 0) > 0;

function emExpedicao(estado: EstadoTutorial, regiaoId: string): boolean {
  const atual = estado.aventura?.mapa.estados[regiaoId];
  return atual === 'desbloqueada' || atual === 'desatualizada';
}

/** Há Expedição numa região desbloqueada (ou desatualizada) com Desafios no banco. */
export function podePartir(estado: EstadoTutorial, regiaoId: string): boolean {
  return emExpedicao(estado, regiaoId) && temDesafios(regiaoId);
}

const temLigacoes = (regiaoId: string) =>
  ESTRUTURA.ligacoes.some((l) => l.origem === regiaoId || l.destino === regiaoId);

/**
 * Sorteia os 5 Desafios da tentativa, preferindo os que o Jogador ainda não viu na região e
 * respeitando a mistura mínima de Formatos.
 */
export function desafiosParaPartir(
  estado: EstadoTutorial,
  regiaoId: string,
  aleatorio: Aleatorio = Math.random,
): Desafio[] {
  const vistos = estado.aventura?.vistos[regiaoId] ?? [];
  return escolherDesafios(DESAFIOS[regiaoId] ?? [], vistos, {
    aleatorio,
    temLigacoes: temLigacoes(regiaoId),
  });
}

/** O texto de anulação mora no banco da Taverna, junto da isca. */
const anulacaoDo = (desafio: Desafio) =>
  Object.values(DESAFIOS)
    .flat()
    .find((d) => d.id === desafio.id)?.anulacao;

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
      const argumento = acao.argumento.trim();
      if (!expedicao || !podeContestar(expedicao)) return estado;
      if (argumento.length === 0 || argumento.length > ARGUMENTO_MAXIMO) return estado;
      const desafio = desafioAtual(expedicao);
      const saida = contestacaoRoteirizada(desafio, anulacaoDo(desafio));
      return { ...estado, expedicao: contestarDesafio(expedicao, argumento, saida) };
    }
    case 'avancar': {
      if (!aventura || expedicao?.fase !== 'corrigido') return estado;
      const seguinte = avancar(expedicao);
      if (seguinte.fase !== 'encerrada') return { ...estado, expedicao: seguinte };
      const depois = concluirExpedicao(aventura, seguinte);
      return {
        ...estado,
        xp: estado.xp + resultadoDaExpedicao(seguinte).xp,
        aventura: depois,
        expedicao: seguinte,
        descobertas: saidasDaNevoa(aventura.mapa, depois.mapa),
      };
    }
    case 'voltarAoMapa':
      return expedicao?.fase === 'encerrada' ? { ...estado, expedicao: null } : estado;
    case 'revelarTeste': {
      if (!aventura || expedicao) return estado;
      if (!emExpedicao(estado, acao.regiaoId) || temDesafios(acao.regiaoId)) return estado;
      const mapa = revelar(aventura.mapa, acao.regiaoId);
      return {
        ...estado,
        aventura: { ...aventura, mapa },
        descobertas: saidasDaNevoa(aventura.mapa, mapa),
      };
    }
    case 'recomecar':
      return { ...ESTADO_INICIAL, xp: estado.xp };
  }
}
