// A Expedição no Projeto do Jogador (spec §3, §4, §7): preparar com o Mestre, guardar as Ligações
// escondidas, e na vitória revelar a região e trazer as vizinhas sem nova chamada. Depois, cada
// vizinha nova é detalhada (`detalhar_regiao`), uma de cada vez.
import type { Desafio } from './contrato.ts';
import {
  detalharNaAventura,
  regioesConhecidas,
  type AventuraNoProjeto,
  type GerarId,
  type LigacaoDoProjeto,
  type OpcoesDoDetalhe,
  type RegiaoDoProjeto,
} from './criacao.ts';
import { somarExpedicao } from './envio.ts';
import {
  desafiosJogados,
  resultadoDaExpedicao,
  type Aleatorio,
  type Expedicao,
  type ResultadoExpedicao,
} from './expedicao.ts';
import type { Idioma } from './idioma.ts';
import { revelar } from './mapa.ts';
import type { ArquivosDoProjeto } from './caminhos.ts';
import type { EventoDoMestre, Transporte } from './mestre.ts';
import {
  DESAFIOS_POR_EXPEDICAO,
  prepararExpedicao,
  type Descarte,
  type EventoDaPreparacao,
  type LerArquivoDoProjeto,
} from './preparacao.ts';
import { CALIBRAGEM_PADRAO, type Calibragem } from './progressao.ts';

export type OpcoesDaExpedicaoNoProjeto = {
  idioma: Idioma;
  lerArquivo: LerArquivoDoProjeto;
  arquivos?: ArquivosDoProjeto;
  gerarId: GerarId;
  aleatorio?: Aleatorio;
  aoAcompanhar?: (evento: EventoDoMestre) => void;
  aoPreparar?: (evento: EventoDaPreparacao) => void;
};

/** Só região desbloqueada e já detalhada tem Expedição (desatualizada fica para o ticket dela). */
export function podePartir(aventura: AventuraNoProjeto, regiaoId: string): boolean {
  const regiao = aventura.regioes.find((r) => r.id === regiaoId);
  return aventura.mapa.estados[regiaoId] === 'desbloqueada' && (regiao?.arquivos.length ?? 0) > 0;
}

/**
 * Prepara a Expedição numa região: o Mestre recebe o mapa conhecido, os enunciados já vistos ali e
 * se as Ligações já são conhecidas. As Ligações que chegam ficam escondidas na Aventura.
 */
export async function prepararNaAventura(
  transporte: Transporte,
  aventura: AventuraNoProjeto,
  regiaoId: string,
  opcoes: OpcoesDaExpedicaoNoProjeto,
): Promise<{ aventura: AventuraNoProjeto; desafios: Desafio[]; descartados: Descarte[] }> {
  const conhecidas = regioesConhecidas(aventura);
  const regiao = conhecidas.find((r) => r.id === regiaoId);
  if (!regiao) throw new Error(`Região fora do mapa conhecido: ${regiaoId}`);
  const guardadas = aventura.ligacoes_escondidas[regiaoId];
  const preparada = await prepararExpedicao(
    transporte,
    {
      idioma: opcoes.idioma,
      regiao,
      mapa: conhecidas.filter((r) => r.id !== regiaoId),
      classe: aventura.classe,
      desafios_anteriores: [...(aventura.vistos[regiaoId] ?? [])],
      ligacoes_conhecidas: guardadas !== undefined,
      quantidade: DESAFIOS_POR_EXPEDICAO,
      territorios: aventura.territorios,
    },
    {
      repositorios: aventura.repositorios,
      lerArquivo: opcoes.lerArquivo,
      gerarId: opcoes.gerarId,
      temLigacoes: (guardadas?.length ?? 0) > 0,
      ...(opcoes.arquivos && { arquivos: opcoes.arquivos }),
      ...(opcoes.aleatorio && { aleatorio: opcoes.aleatorio }),
      ...(opcoes.aoAcompanhar && { aoAcompanhar: opcoes.aoAcompanhar }),
      ...(opcoes.aoPreparar && { aoPreparar: opcoes.aoPreparar }),
    },
  );
  const comLigacoes = preparada.ligacoes
    ? {
        ...aventura,
        ligacoes_escondidas: { ...aventura.ligacoes_escondidas, [regiaoId]: preparada.ligacoes },
      }
    : aventura;
  return {
    aventura: comLigacoes,
    desafios: preparada.desafios,
    descartados: preparada.descartados,
  };
}

const mesmoNome = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * As Ligações escondidas de uma região entram no mapa. Região `nova` ganha id do Jogo e entra na
 * Névoa (revelar a desbloqueia logo em seguida); se já existe uma com o mesmo nome, a Ligação vai
 * para ela. Território novo também ganha id. Ligação repetida (mesmas pontas e tipo) entra uma vez.
 */
function trazerLigacoes(
  aventura: AventuraNoProjeto,
  regiaoId: string,
  gerarId: GerarId,
): { aventura: AventuraNoProjeto; novas: string[] } {
  const escondidas = aventura.ligacoes_escondidas[regiaoId] ?? [];
  const regiaoAtual = aventura.regioes.find((r) => r.id === regiaoId);
  const territorios = [...aventura.territorios];
  const regioes = [...aventura.regioes];
  const estados = { ...aventura.mapa.estados };
  const ligacoes = [...aventura.ligacoes];
  const novas: string[] = [];

  for (const l of escondidas) {
    let destino: string | undefined;
    if ('regiao_id' in l.destino) {
      destino = estados[l.destino.regiao_id] !== undefined ? l.destino.regiao_id : undefined;
    } else {
      const nova = l.destino.nova;
      destino = regioes.find((r) => mesmoNome(r.nome, nova.nome))?.id;
      if (!destino) {
        let territorioId = nova.territorio_id;
        if (territorioId !== null && !territorios.some((t) => t.id === territorioId))
          territorioId = null;
        if (territorioId === null && nova.territorio_novo) {
          const { nome, raizes } = nova.territorio_novo;
          let territorio = territorios.find((t) => mesmoNome(t.nome, nome));
          if (!territorio) {
            territorio = { id: gerarId(), nome, resumo: '', raizes };
            territorios.push(territorio);
          }
          territorioId = territorio.id;
        }
        const criada: RegiaoDoProjeto = {
          id: gerarId(),
          nome: nova.nome,
          resumo: nova.resumo,
          territorio_id: territorioId ?? regiaoAtual?.territorio_id ?? '',
          arquivos: [],
          arquivos_semente: nova.arquivos_semente,
        };
        regioes.push(criada);
        estados[criada.id] = 'nevoa';
        novas.push(criada.id);
        destino = criada.id;
      }
    }
    if (!destino || destino === regiaoId) continue;
    const repetida = ligacoes.some(
      (x) =>
        x.tipo === l.tipo &&
        ((x.origem === regiaoId && x.destino === destino) ||
          (x.origem === destino && x.destino === regiaoId)),
    );
    if (repetida) continue;
    const ligacao: LigacaoDoProjeto = {
      id: l.id,
      origem: regiaoId,
      destino,
      tipo: l.tipo,
      descricao: l.descricao,
      evidencias: l.evidencias,
    };
    ligacoes.push(ligacao);
  }

  const restantes = { ...aventura.ligacoes_escondidas };
  delete restantes[regiaoId];
  return {
    aventura: {
      ...aventura,
      territorios,
      regioes,
      ligacoes,
      ligacoes_escondidas: restantes,
      mapa: {
        ...aventura.mapa,
        estados,
        ligacoes: ligacoes.map(({ id, origem, destino }) => ({ id, origem, destino })),
      },
    },
    novas,
  };
}

export type ExpedicaoConcluida = {
  aventura: AventuraNoProjeto;
  resultado: ResultadoExpedicao;
  /** Regiões que saíram da Névoa com esta vitória. */
  descobertas: string[];
  /** As regiões criadas agora, que pedem `detalhar_regiao`. */
  novas: string[];
};

/**
 * Fim da Expedição: guarda os enunciados jogados (a próxima tentativa traz outros), soma XP e
 * estatísticas e, na vitória, revela a região com as vizinhas — sem nova chamada ao Mestre.
 */
export function concluirNaAventura(
  aventura: AventuraNoProjeto,
  expedicao: Expedicao,
  opcoes: { gerarId: GerarId; agora: string; calibragem?: Calibragem },
): ExpedicaoConcluida {
  const resultado = resultadoDaExpedicao(expedicao, opcoes.calibragem ?? CALIBRAGEM_PADRAO);
  const { regiaoId } = expedicao;
  const antes = aventura.vistos[regiaoId] ?? [];
  const jogados = desafiosJogados(expedicao).map((d) => d.enunciado);
  let atual: AventuraNoProjeto = {
    ...aventura,
    atualizada_em: opcoes.agora,
    xp: aventura.xp + resultado.xp,
    estatisticas: somarExpedicao(aventura.estatisticas, resultado),
    vistos: { ...aventura.vistos, [regiaoId]: [...new Set([...antes, ...jogados])] },
  };
  if (!resultado.venceu) return { aventura: atual, resultado, descobertas: [], novas: [] };

  const trazidas = trazerLigacoes(atual, regiaoId, opcoes.gerarId);
  atual = trazidas.aventura;
  const mapa = revelar(atual.mapa, regiaoId);
  const descobertas = Object.keys(mapa.estados).filter(
    (id) => atual.mapa.estados[id] === 'nevoa' && mapa.estados[id] !== 'nevoa',
  );
  return {
    aventura: { ...atual, mapa },
    resultado,
    descobertas,
    novas: trazidas.novas.filter((id) => mapa.estados[id] === 'desbloqueada'),
  };
}

export type EventoDasVizinhas =
  | { tipo: 'detalhando'; regiaoId: string; indice: number; total: number }
  | { tipo: 'detalhada'; regiaoId: string; aventura: AventuraNoProjeto }
  | { tipo: 'falhou'; regiaoId: string; erro: unknown };

/**
 * Detalha cada vizinha nova, uma de cada vez (cada chamada é uma CLI inteira). Uma falha não para
 * as outras: a região fica desbloqueada com os arquivos-semente, e o mapa oferece tentar de novo.
 */
export async function detalharVizinhas(
  transporte: Transporte,
  aventura: AventuraNoProjeto,
  ids: readonly string[],
  opcoes: OpcoesDoDetalhe & { aoAvancar?: (evento: EventoDasVizinhas) => void },
): Promise<{ aventura: AventuraNoProjeto; falhas: string[] }> {
  let atual = aventura;
  const falhas: string[] = [];
  for (const [indice, regiaoId] of ids.entries()) {
    opcoes.aoAvancar?.({ tipo: 'detalhando', regiaoId, indice, total: ids.length });
    try {
      atual = await detalharNaAventura(transporte, atual, regiaoId, opcoes);
      opcoes.aoAvancar?.({ tipo: 'detalhada', regiaoId, aventura: atual });
    } catch (erro) {
      falhas.push(regiaoId);
      opcoes.aoAvancar?.({ tipo: 'falhou', regiaoId, erro });
    }
  }
  return { aventura: atual, falhas };
}

/**
 * A entrada do explorador de código para um Projeto: as regiões conhecidas com os seus arquivos e,
 * como Névoa, o resto dos arquivos commitados de cada Território (pela raiz mais longa que casa).
 * Os arquivos citados na Expedição (Evidências, opções de Apontar) ficam visíveis.
 */
export function regioesDoExplorador(
  aventura: AventuraNoProjeto,
  todos: readonly string[],
  citados: readonly string[] = [],
): {
  regioes: { id: string; territorio_id: string; arquivos: string[] }[];
  estados: Record<string, AventuraNoProjeto['mapa']['estados'][string]>;
  todos: string[];
} {
  const estados = { ...aventura.mapa.estados };
  const conhecidas = aventura.regioes.filter((r) => (estados[r.id] ?? 'nevoa') !== 'nevoa');
  const usados = new Set([...conhecidas.flatMap((r) => r.arquivos), ...citados]);
  const raizes = aventura.territorios
    .flatMap((t) => t.raizes.map((raiz) => ({ id: t.id, raiz: raiz.replace(/\/?\.$/, '') })))
    .sort((a, b) => b.raiz.length - a.raiz.length);
  const naNevoa = new Map<string, string[]>();
  for (const caminho of todos) {
    if (usados.has(caminho)) continue;
    const dono = raizes.find(({ raiz }) =>
      raiz === '' || raiz.endsWith(':') ? caminho.startsWith(raiz) : caminho.startsWith(`${raiz}/`),
    );
    if (!dono) continue;
    const lista = naNevoa.get(dono.id) ?? [];
    lista.push(caminho);
    naNevoa.set(dono.id, lista);
  }
  const regioes = conhecidas.map((r) => ({
    id: r.id,
    territorio_id: r.territorio_id,
    arquivos: r.arquivos,
  }));
  for (const [territorio_id, arquivos] of naNevoa) {
    const id = `nevoa:${territorio_id}`;
    regioes.push({ id, territorio_id, arquivos });
    estados[id] = 'nevoa';
  }
  return { regioes, estados, todos: [...citados] };
}
