// A Aventura sobre o Projeto do Jogador (spec §4, §8): criada a partir da saída de
// `criar_aventura`, com ids do Jogo, e completada por `detalhar_regiao`. O estado inteiro mora num
// arquivo local; `lerAventuraSalva` confere o que volta do disco.
import type { Aventura } from './aventura.ts';
import type { ArquivosDoProjeto, Repositorio } from './caminhos.ts';
import {
  CLASSES,
  type Classe,
  type Evidencia,
  type RegiaoConhecida,
  type TipoLigacao,
} from './contrato.ts';
import { ESTATISTICAS_ZERADAS, ehIdDeAventura, type EstatisticasDoJogador } from './envio.ts';
import { conferirEsquema, type Esquema } from './esquema.ts';
import type { Idioma } from './idioma.ts';
import { ESTADOS_NO_MAPA, iniciarMapa } from './mapa.ts';
import {
  detalharRegiao,
  type EventoDoMestre,
  type SaidaCriarAventura,
  type SaidaDetalharRegiao,
  type TerritorioConhecido,
  type Transporte,
} from './mestre.ts';
import type { LigacaoPreparada } from './preparacao.ts';

/** As IAs que podem ser o Mestre (spec §7). */
export const IAS_DO_MESTRE = ['claude_code', 'codex'] as const;
export type IaDoMestre = (typeof IAS_DO_MESTRE)[number];

/**
 * v2 (#35): XP, estatísticas e Ligações (as reveladas e as escondidas até a vitória).
 * v3 (#38): o commit da revelação de cada região (`revelada_em`), para a Região desatualizada.
 */
export const VERSAO_DA_AVENTURA = 3;

/** Um repositório do Projeto e o commit em que estava quando a Aventura foi criada. */
export type RepositorioDaAventura = Repositorio & { commit: string };

export type RegiaoDoProjeto = {
  id: string;
  nome: string;
  resumo: string;
  territorio_id: string;
  /** A lista completa, depois de `detalhar_regiao`; vazia antes. */
  arquivos: string[];
  arquivos_semente: string[];
  /**
   * Repositório → commit em que a região foi revelada pela última vez (spec §6): a detecção da
   * Região desatualizada compara com ele. Só em região revelada ou desatualizada.
   */
  revelada_em?: Record<string, string>;
};

/** Uma Ligação já no mapa: quem fala com quem, como, e onde isso está no código. */
export type LigacaoDoProjeto = {
  id: string;
  origem: string;
  destino: string;
  tipo: TipoLigacao;
  descricao: string;
  evidencias: Evidencia[];
};

export type AventuraNoProjeto = Aventura & {
  versao: typeof VERSAO_DA_AVENTURA;
  /** UUID: o id opaco que também vai no envio de progresso. */
  id: string;
  criada_em: string;
  atualizada_em: string;
  mestre: IaDoMestre;
  repositorios: RepositorioDaAventura[];
  territorios: TerritorioConhecido[];
  regioes: RegiaoDoProjeto[];
  aviso_classe?: string;
  /** O XP ganho nesta Aventura; o do Jogador é a soma de todas. */
  xp: number;
  estatisticas: EstatisticasDoJogador;
  /** As Ligações reveladas (as mesmas de mapa.ligacoes, com o detalhe). */
  ligacoes: LigacaoDoProjeto[];
  /**
   * Região → Ligações que `preparar_expedicao` trouxe, escondidas até a vitória; a chave presente
   * (mesmo com lista vazia) quer dizer "já conhecidas", e a nova tentativa não as pede de novo.
   */
  ligacoes_escondidas: Record<string, LigacaoPreparada[]>;
};

export type GerarId = () => string;

/** O Jogador confirmou uma candidata: o Jogo cria os Territórios e a região de entrada, com ids. */
export function montarAventura(dados: {
  id: string;
  agora: string;
  mestre: IaDoMestre;
  classe: Classe;
  repositorios: RepositorioDaAventura[];
  saida: SaidaCriarAventura;
  /** Índice em `candidatas_entrada`. */
  escolhida: number;
  gerarId: GerarId;
}): AventuraNoProjeto {
  const { saida, gerarId } = dados;
  const candidata = saida.candidatas_entrada[dados.escolhida];
  if (!candidata) throw new Error(`Candidata inexistente: ${dados.escolhida}`);
  const territorios: TerritorioConhecido[] = saida.territorios.map((t) => ({
    id: gerarId(),
    ...t,
  }));
  const territorio = territorios.find((t) => t.nome === candidata.territorio_novo?.nome);
  if (!territorio) throw new Error(`Território da candidata inexistente: ${candidata.nome}`);
  const entrada: RegiaoDoProjeto = {
    id: gerarId(),
    nome: candidata.nome,
    resumo: candidata.resumo,
    territorio_id: territorio.id,
    arquivos: [],
    arquivos_semente: candidata.arquivos_semente,
  };
  return {
    versao: VERSAO_DA_AVENTURA,
    id: dados.id,
    criada_em: dados.agora,
    atualizada_em: dados.agora,
    mestre: dados.mestre,
    classe: dados.classe,
    repositorios: dados.repositorios,
    territorios,
    regioes: [entrada],
    mapa: iniciarMapa({ regioes: [entrada.id], ligacoes: [] }, entrada.id),
    vistos: {},
    ...(saida.aviso_classe !== undefined && { aviso_classe: saida.aviso_classe }),
    xp: 0,
    estatisticas: ESTATISTICAS_ZERADAS,
    ligacoes: [],
    ligacoes_escondidas: {},
  };
}

/** As regiões conhecidas (fora da Névoa), como o Jogo as descreve ao Mestre. */
export function regioesConhecidas(aventura: AventuraNoProjeto): RegiaoConhecida[] {
  return aventura.regioes.flatMap((r) => {
    const estado = aventura.mapa.estados[r.id];
    if (estado === undefined || estado === 'nevoa') return [];
    return [
      {
        id: r.id,
        nome: r.nome,
        resumo: r.resumo,
        territorio_id: r.territorio_id,
        estado,
        arquivos: r.arquivos,
      },
    ];
  });
}

/**
 * Aplica a saída de `detalhar_regiao`. Com `dividir`, a região some e as novas entram no lugar,
 * no mesmo estado dela (Territórios novos ganham id aqui). Devolve os ids que ainda pedem detalhe.
 */
export function aplicarDetalhe(
  aventura: AventuraNoProjeto,
  regiaoId: string,
  saida: SaidaDetalharRegiao,
  gerarId: GerarId,
): { aventura: AventuraNoProjeto; novas: string[] } {
  const regiao = aventura.regioes.find((r) => r.id === regiaoId);
  const estado = aventura.mapa.estados[regiaoId];
  if (!regiao || estado === undefined) throw new Error(`Região fora da Aventura: ${regiaoId}`);
  if (!saida.dividir?.length) {
    const regioes = aventura.regioes.map((r) =>
      r.id === regiaoId ? { ...r, resumo: saida.resumo, arquivos: saida.arquivos } : r,
    );
    return { aventura: { ...aventura, regioes }, novas: [] };
  }
  const territorios = [...aventura.territorios];
  const novas: RegiaoDoProjeto[] = saida.dividir.map((n) => {
    let territorioId = n.territorio_id;
    if (territorioId === null && n.territorio_novo) {
      const novo = {
        id: gerarId(),
        nome: n.territorio_novo.nome,
        resumo: '',
        raizes: n.territorio_novo.raizes,
      };
      territorios.push(novo);
      territorioId = novo.id;
    }
    return {
      id: gerarId(),
      nome: n.nome,
      resumo: n.resumo,
      territorio_id: territorioId ?? regiao.territorio_id,
      arquivos: [],
      arquivos_semente: n.arquivos_semente,
    };
  });
  const indice = aventura.regioes.indexOf(regiao);
  const regioes = [...aventura.regioes];
  regioes.splice(indice, 1, ...novas);
  const estados = { ...aventura.mapa.estados };
  delete estados[regiaoId];
  for (const n of novas) estados[n.id] = estado;
  // As Ligações da região dividida passam à parte que tem o arquivo da Evidência (ou à primeira).
  const parte = (evidencias: readonly Evidencia[]) =>
    (
      novas.find((n) => evidencias.some((e) => n.arquivos_semente.includes(e.caminho))) ??
      (novas[0] as RegiaoDoProjeto)
    ).id;
  const trocar = (id: string, evidencias: readonly Evidencia[]) =>
    id === regiaoId ? parte(evidencias) : id;
  const ligacoes = aventura.ligacoes.map((l) => ({
    ...l,
    origem: trocar(l.origem, l.evidencias),
    destino: trocar(l.destino, l.evidencias),
  }));
  const escondidas: Record<string, LigacaoPreparada[]> = {};
  for (const [origem, lista] of Object.entries(aventura.ligacoes_escondidas)) {
    const trocadas = lista.map((l) =>
      'regiao_id' in l.destino && l.destino.regiao_id === regiaoId
        ? { ...l, destino: { regiao_id: parte(l.evidencias) } }
        : l,
    );
    // As escondidas da própria região dividida se perdem: cada parte pede as suas.
    if (origem !== regiaoId) escondidas[origem] = trocadas;
  }
  const mapa = {
    ...aventura.mapa,
    estados,
    ligacoes: ligacoes.map(({ id, origem, destino }) => ({ id, origem, destino })),
  };
  return {
    aventura: {
      ...aventura,
      territorios,
      regioes,
      mapa,
      ligacoes,
      ligacoes_escondidas: escondidas,
    },
    novas: novas.map((n) => n.id),
  };
}

export type OpcoesDoDetalhe = {
  idioma: Idioma;
  arquivos?: ArquivosDoProjeto;
  gerarId: GerarId;
  aoAcompanhar?: (evento: EventoDoMestre) => void;
};

/**
 * Detalha uma região recém-desbloqueada. Se o Mestre a dividir, detalha cada parte uma vez, já sem
 * a opção de dividir de novo (uma divisão por desbloqueio basta para chegar ao tamanho certo).
 */
export async function detalharNaAventura(
  transporte: Transporte,
  aventura: AventuraNoProjeto,
  regiaoId: string,
  opcoes: OpcoesDoDetalhe,
): Promise<AventuraNoProjeto> {
  const pedir = async (atual: AventuraNoProjeto, id: string, permitirDividir: boolean) => {
    const regiao = regioesConhecidas(atual).find((r) => r.id === id);
    const semente = atual.regioes.find((r) => r.id === id)?.arquivos_semente ?? [];
    if (!regiao) throw new Error(`Região fora do mapa conhecido: ${id}`);
    const saida = await detalharRegiao(
      transporte,
      {
        idioma: opcoes.idioma,
        regiao: { ...regiao, arquivos_semente: semente },
        mapa: regioesConhecidas(atual).filter((r) => r.id !== id),
        classe: atual.classe,
        territorios: atual.territorios,
      },
      {
        repositorios: atual.repositorios,
        ...(opcoes.arquivos && { arquivos: opcoes.arquivos }),
        ...(opcoes.aoAcompanhar && { aoAcompanhar: opcoes.aoAcompanhar }),
        permitirDividir,
      },
    );
    return aplicarDetalhe(atual, id, saida, opcoes.gerarId);
  };
  const primeira = await pedir(aventura, regiaoId, true);
  let atual = primeira.aventura;
  for (const id of primeira.novas) atual = (await pedir(atual, id, false)).aventura;
  return atual;
}

// ---------------------------------------------------------------------------------------------
// O arquivo local

const texto: Esquema = { type: 'string' };
const textos: Esquema = { type: 'array', items: texto };
const objeto = (properties: Record<string, Esquema>, opcionais: string[] = []): Esquema => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((k) => !opcionais.includes(k)),
  additionalProperties: false,
});

const inteiro: Esquema = { type: 'integer', minimum: 0 };
const tipoDeLigacao: Esquema = {
  type: 'string',
  enum: ['chamada', 'consulta', 'evento', 'dependencia'],
};
const evidencias: Esquema = {
  type: 'array',
  items: objeto({ caminho: texto, linha_inicio: inteiro, linha_fim: inteiro, trecho: texto }),
};
const territorioNovo = objeto({ nome: texto, raizes: textos });
const ligacaoEscondida = objeto({
  id: texto,
  tipo: tipoDeLigacao,
  descricao: texto,
  destino: objeto(
    {
      regiao_id: texto,
      nova: objeto(
        {
          nome: texto,
          resumo: texto,
          territorio_id: { type: ['string', 'null'] },
          territorio_novo: territorioNovo,
          arquivos_semente: textos,
        },
        ['territorio_novo'],
      ),
    },
    ['regiao_id', 'nova'],
  ),
  evidencias,
});

/** Os campos da v2; um arquivo da v1 chega sem eles e ganha os valores de uma Aventura nova. */
const DA_V2 = ['xp', 'estatisticas', 'ligacoes', 'ligacoes_escondidas'] as const;

const ESQUEMA_DA_AVENTURA_SALVA: Esquema = objeto(
  {
    versao: { type: 'integer', enum: [1, 2, VERSAO_DA_AVENTURA] },
    id: texto,
    criada_em: texto,
    atualizada_em: texto,
    mestre: { type: 'string', enum: IAS_DO_MESTRE },
    classe: { type: 'string', enum: CLASSES },
    repositorios: {
      type: 'array',
      minItems: 1,
      items: objeto({ nome: texto, caminho_local: texto, commit: texto }),
    },
    territorios: {
      type: 'array',
      items: objeto({ id: texto, nome: texto, resumo: texto, raizes: textos }),
    },
    regioes: {
      type: 'array',
      minItems: 1,
      items: objeto(
        {
          id: texto,
          nome: texto,
          resumo: texto,
          territorio_id: texto,
          arquivos: textos,
          arquivos_semente: textos,
          revelada_em: { type: 'object', additionalProperties: texto },
        },
        ['revelada_em'],
      ),
    },
    mapa: objeto({
      ligacoes: { type: 'array', items: objeto({ id: texto, origem: texto, destino: texto }) },
      estados: { type: 'object', additionalProperties: { type: 'string', enum: ESTADOS_NO_MAPA } },
      ligacoesConhecidas: textos,
    }),
    vistos: { type: 'object', additionalProperties: textos },
    aviso_classe: texto,
    xp: inteiro,
    estatisticas: objeto({ expedicoes: inteiro, acertos: inteiro, contestacoes_vencidas: inteiro }),
    ligacoes: {
      type: 'array',
      items: objeto({
        id: texto,
        origem: texto,
        destino: texto,
        tipo: tipoDeLigacao,
        descricao: texto,
        evidencias,
      }),
    },
    ligacoes_escondidas: {
      type: 'object',
      additionalProperties: { type: 'array', items: ligacaoEscondida },
    },
  },
  ['aviso_classe', ...DA_V2],
);

/**
 * O que voltou do disco, se for uma Aventura inteira e coerente; senão, undefined. Versões antigas
 * sobem para a atual: a v1 ganha os campos da v2 zerados; na v1 e na v2, região já revelada (ou
 * desatualizada) sem `revelada_em` ganha o commit de criação de cada repositório — o único que
 * elas guardavam. Se o código mudou entre a criação e a revelação, a detecção pode marcá-la
 * desatualizada antes da hora: uma Expedição a mais, nunca uma mudança perdida.
 */
export function lerAventuraSalva(conteudo: string): AventuraNoProjeto | undefined {
  let valor: unknown;
  try {
    valor = JSON.parse(conteudo);
  } catch {
    return undefined;
  }
  if (conferirEsquema(ESQUEMA_DA_AVENTURA_SALVA, valor).length > 0) return undefined;
  const lida = valor as Omit<AventuraNoProjeto, 'versao' | (typeof DA_V2)[number]> &
    Partial<Pick<AventuraNoProjeto, (typeof DA_V2)[number]>> & { versao: number };
  const presentes = DA_V2.filter((k) => k in lida).length;
  // A v1 não tem nenhum dos campos novos; a v2 tem todos.
  if (presentes !== (lida.versao === 1 ? 0 : DA_V2.length)) return undefined;
  const daCriacao = Object.fromEntries(lida.repositorios.map((r) => [r.nome, r.commit]));
  const conhecida = (id: string) =>
    ['revelada', 'desatualizada'].includes(lida.mapa.estados[id] ?? '');
  const a: AventuraNoProjeto = {
    ...lida,
    regioes: lida.regioes.map((r) =>
      r.revelada_em || !conhecida(r.id) ? r : { ...r, revelada_em: daCriacao },
    ),
    versao: VERSAO_DA_AVENTURA,
    xp: lida.xp ?? 0,
    estatisticas: lida.estatisticas ?? ESTATISTICAS_ZERADAS,
    ligacoes: lida.ligacoes ?? [],
    ligacoes_escondidas: lida.ligacoes_escondidas ?? {},
  };
  if (!ehIdDeAventura(a.id) || a.id === 'tutorial') return undefined;
  const territorios = new Set(a.territorios.map((t) => t.id));
  const regioes = a.regioes.map((r) => r.id);
  const existe = (id: string) => a.mapa.estados[id] !== undefined;
  const coerente =
    a.regioes.every((r) => territorios.has(r.territorio_id)) &&
    regioes.length === Object.keys(a.mapa.estados).length &&
    regioes.every(existe) &&
    a.mapa.ligacoes.every((l) => existe(l.origem) && existe(l.destino)) &&
    a.ligacoes.every((l) => existe(l.origem) && existe(l.destino));
  return coerente ? a : undefined;
}

/** A Aventura para o "Continuar": a mexida por último. */
export function aventuraMaisRecente(
  aventuras: readonly AventuraNoProjeto[],
): AventuraNoProjeto | undefined {
  return [...aventuras].sort((a, b) => b.atualizada_em.localeCompare(a.atualizada_em))[0];
}
