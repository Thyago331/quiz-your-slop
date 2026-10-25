// `preparar_expedicao` (contrato §3; spec §5, §7): o Mestre prepara os Desafios e as Ligações da
// região numa só chamada. O Jogo confere cada Desafio contra o código de verdade (Evidências,
// opções de Apontar, gabarito, referências), descarta os inválidos e pede só os que faltam, até 2
// vezes. Com 3 ou mais válidos a Expedição roda; com menos, erro claro.
import { normalizarCaminho } from './caminhos.ts';
import type {
  Desafio,
  Evidencia,
  FormatoDesafio,
  Opcao,
  OpcaoApontar,
  OpcaoTracarFluxo,
  RegiaoNova,
  TipoLigacao,
} from './contrato.ts';
import { conferirOpcaoApontar, conferirOuRelocalizar } from './evidencia.ts';
import type { Esquema } from './esquema.ts';
import { escolherDesafios, type Aleatorio } from './expedicao.ts';
import {
  ErroDoMestre,
  NOME_DO_IDIOMA,
  PAPEL,
  REGRAS_DE_CAMINHO,
  chamarComTentativas,
  conferirCaminhos,
  type EntradaPrepararExpedicao,
  type OpcoesDaChamada,
  type Transporte,
} from './mestre.ts';

/** 5 Desafios por Expedição (spec §5). */
export const DESAFIOS_POR_EXPEDICAO = 5;
/** Com menos que isso, a Expedição não roda (regra 5). */
export const MINIMO_DE_DESAFIOS = 3;
/** Pedidos extras para repor Desafios descartados (regra 5). */
export const TENTATIVAS_DE_REPOSICAO = 2;

/** Lê um arquivo do Projeto pelo caminho do Jogo (`repo:caminho` em Projeto de vários); undefined se não existe. */
export type LerArquivoDoProjeto = (caminho: string) => Promise<string | undefined>;

/** Uma Ligação conferida, com o id do Jogo; fica escondida até a vitória. */
export type LigacaoPreparada = {
  id: string;
  tipo: TipoLigacao;
  descricao: string;
  destino: { regiao_id: string } | { nova: RegiaoNova };
  evidencias: Evidencia[];
};

/** Um Desafio ou Ligação que o Jogo recusou, e por quê. */
export type Descarte = { onde: string; problemas: string[] };

export type ExpedicaoPreparada = {
  /** De 3 a `quantidade`, com ids do Jogo, em dificuldade crescente. */
  desafios: Desafio[];
  /** Presente quando as Ligações ficaram conhecidas nesta preparação (pode ser vazia). */
  ligacoes?: LigacaoPreparada[];
  descartados: Descarte[];
  /** Quantos pedidos ao Mestre (o primeiro e as reposições). */
  pedidos: number;
};

export type EventoDaPreparacao =
  | { tipo: 'pedido'; numero: number; quantidade: number }
  | { tipo: 'conferida'; validos: number; descartados: number; quantidade: number };

export type OpcoesDaPreparacao = OpcoesDaChamada & {
  lerArquivo: LerArquivoDoProjeto;
  gerarId: () => string;
  /** Com `ligacoes_conhecidas`: se as Ligações já guardadas existem (pede um Traçar o fluxo). */
  temLigacoes?: boolean;
  aleatorio?: Aleatorio;
  aoPreparar?: (evento: EventoDaPreparacao) => void;
};

/** Poucos Desafios válidos mesmo depois das reposições: a Expedição não roda. */
export class PoucosDesafios extends ErroDoMestre {
  constructor(
    readonly validos: number,
    pedidos: number,
    problemas: readonly string[],
  ) {
    super('preparar_expedicao', pedidos, problemas);
    this.message = `preparar_expedicao: só ${validos} Desafios válidos depois de ${pedidos} pedidos`;
    this.name = 'PoucosDesafios';
  }
}

// ---------------------------------------------------------------------------------------------
// Schema

const texto: Esquema = { type: 'string', minLength: 1 };
const objeto = (
  properties: Record<string, Esquema>,
  opcionais: readonly string[] = [],
): Esquema => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((k) => !opcionais.includes(k)),
  additionalProperties: false,
});
const TIPOS_DE_LIGACAO: readonly TipoLigacao[] = ['chamada', 'consulta', 'evento', 'dependencia'];

const evidencia = objeto({
  caminho: texto,
  linha_inicio: { type: 'integer', minimum: 1 },
  linha_fim: { type: 'integer', minimum: 1 },
  trecho: texto,
});
const evidencias: Esquema = { type: 'array', minItems: 1, items: evidencia };

// Uma Opção serve aos três Formatos (o schema não tem uniões): a forma certa de cada Formato é
// conferida Desafio a Desafio, e o Desafio fora dela é descartado.
const opcao = objeto(
  {
    id: texto,
    texto,
    caminho: texto,
    simbolo: texto,
    regiao_id: { type: ['string', 'null'] },
    ligacao: { type: 'string', enum: TIPOS_DE_LIGACAO },
  },
  ['texto', 'caminho', 'simbolo', 'regiao_id', 'ligacao'],
);

const desafio = objeto({
  formato: { type: 'string', enum: ['multipla_escolha', 'apontar', 'tracar_fluxo'] },
  enunciado: texto,
  dificuldade: { type: 'integer', enum: [1, 2, 3, 4, 5] },
  opcoes: { type: 'array', minItems: 2, items: opcao },
  gabarito: { type: 'array', minItems: 1, items: texto },
  explicacao: texto,
  evidencias,
});

const regiaoNova = objeto(
  {
    nome: texto,
    resumo: texto,
    territorio_id: { type: ['string', 'null'] },
    territorio_novo: objeto({ nome: texto, raizes: { type: 'array', minItems: 1, items: texto } }),
    arquivos_semente: { type: 'array', minItems: 1, maxItems: 5, items: texto },
  },
  ['territorio_novo'],
);

const ligacao = objeto({
  tipo: { type: 'string', enum: TIPOS_DE_LIGACAO },
  descricao: texto,
  // Um dos dois: a região do mapa ou uma nova (conferido na Ligação).
  destino: objeto({ regiao_id: texto, nova: regiaoNova }, ['regiao_id', 'nova']),
  evidencias,
});

/** Com as Ligações já conhecidas, o campo some do schema (se vier, é ignorado). */
export function esquemaPrepararExpedicao(ligacoesConhecidas: boolean): Esquema {
  const ligacoes: Esquema = { type: 'array', items: ligacao };
  return objeto(
    { desafios: { type: 'array', minItems: 1, items: desafio }, ligacoes },
    ligacoesConhecidas ? ['ligacoes'] : [],
  );
}

// ---------------------------------------------------------------------------------------------
// Prompt

/** A Classe é lente, não filtro: muda o ângulo e a mistura de Formatos (spec §5). */
const LENTE_DA_CLASSE = {
  backend:
    'backend → contracts (routes, payloads, function signatures), data (models, queries, persistence), business rules and side effects (what gets written, sent or emitted).',
  frontend:
    'frontend → state (where it lives, how it changes), screens and components (what renders what), and interaction (what happens when the user clicks, types or navigates).',
  fullstack:
    'fullstack → the crossing between front end and back end: how a user action becomes a request, what the server does with it and how the answer comes back to the screen. Prefer more "tracar_fluxo".',
} as const;

const FORMATOS = `Formats (every Challenge has an objective answer key):
- "multipla_escolha" (multiple choice): 3–4 options {"id", "texto"}; "gabarito" = [the one correct id].
- "apontar" (point at the code): 3–4 options {"id", "caminho", "simbolo"?}, each an existing file of the Project and, optionally, an exact identifier (function, class, constant, component) that appears in that file. Distractors are real, plausible places. "gabarito" = the correct id(s), not all of them.
- "tracar_fluxo" (trace the flow): 3–6 steps {"id", "texto", "regiao_id", "ligacao"?} of one concrete path through the system, listed in SHUFFLED order. "regiao_id" is the id of the Region where the step happens ("regiao" or one in "mapa"), or null when it happens in a part of the Project that is not in "mapa" yet; "ligacao" is the type of Link the path crosses to enter the step, when it crosses Regions. "gabarito" = every step id, in the correct order.`;

const EVIDENCIAS = `Evidence ("evidencias", at least 1 per Challenge): the code that proves the answer key, each with "caminho", "linha_inicio" and "linha_fim" (1-based, inclusive) and "trecho" = the EXACT text of those lines, copied from the file (keep it short: 1–15 lines). The Game reads the file and discards any Challenge whose evidence does not match it, or whose "apontar" options point at files or identifiers that do not exist.`;

const LIGACOES = `- "ligacoes": every concrete communication between this Region and another part of the Project — "tipo": "chamada" (HTTP/gRPC/GraphQL call), "consulta" (database query), "evento" (queue/topic) or "dependencia" (direct import of another part); "descricao": short, e.g. "POST /orders creates the order"; "destino": {"regiao_id": "<id from mapa>"} when the other side is a Region in "mapa", or {"nova": {...}} describing a Region not in the map yet (a functional responsibility, not a folder: "nome", a 1–2 sentence "resumo" without internal jargon, "territorio_id" from "territorios" — or null with "territorio_novo" {"nome", "raizes"} — and 1–5 existing "arquivos_semente" outside this Region); "evidencias": where the communication happens in the code. An empty list if the Region talks to nothing else.`;

export type OpcoesDoPrompt = {
  varios: boolean;
  /** Formatos que ainda faltam para a mistura mínima. */
  faltando?: readonly FormatoDesafio[];
  /** Por que os Desafios do pedido anterior foram descartados. */
  descartados?: readonly Descarte[];
  problemas?: readonly string[];
};

export function montarPromptDaExpedicao(
  entrada: EntradaPrepararExpedicao,
  opcoes: OpcoesDoPrompt,
): string {
  const n = entrada.quantidade;
  const pede = [
    `Call: preparar_expedicao. The Player starts an Expedition in the Region "regiao" of the context. Read its files ("regiao.arquivos") and what they talk to, and return:`,
    `- "desafios": exactly ${n} new Challenge${n === 1 ? '' : 's'} about this Region's code, in increasing difficulty ("dificuldade" 1–5). Never repeat or rephrase a statement in "desafios_anteriores". Each has "formato", "enunciado" (the question), "dificuldade", "opcoes", "gabarito" (option ids), "explicacao" (why the answer key is right, citing the code) and "evidencias".`,
    entrada.ligacoes_conhecidas
      ? `- Do not return "ligacoes": the Game already knows this Region's Links.`
      : LIGACOES,
  ].join('\n');
  const mistura = opcoes.faltando?.length
    ? `Mix: this answer must include at least one Challenge of each format: ${opcoes.faltando.map((f) => `"${f}"`).join(', ')}.`
    : `Mix: at least 1 "apontar" and, if the Region communicates with other parts of the Project (Links), at least 1 "tracar_fluxo".`;
  const lente = `Class lens: the Player's Class ("classe") changes the angle of the questions and the mix, not the subject — ${LENTE_DA_CLASSE[entrada.classe]}`;
  const partes = [
    PAPEL,
    pede,
    FORMATOS,
    mistura,
    lente,
    EVIDENCIAS,
    REGRAS_DE_CAMINHO(opcoes.varios),
    `Language: write every human-readable text (statements, options, explanations, names, summaries) in ${NOME_DO_IDIOMA[entrada.idioma]}. Keep paths, symbols and code (including "trecho") exactly as in the repository.`,
    'Answer only with JSON that matches the given JSON Schema.',
  ];
  if (opcoes.descartados?.length) {
    partes.push(
      `Some of your previous Challenges were discarded by the Game:\n${opcoes.descartados
        .slice(0, 10)
        .map((d) => `- ${d.onde}: ${d.problemas.slice(0, 3).join('; ')}`)
        .join('\n')}\nAvoid these mistakes in the new ones.`,
    );
  }
  if (opcoes.problemas?.length) {
    partes.push(
      `Your previous answer was rejected:\n${opcoes.problemas.map((p) => `- ${p}`).join('\n')}\nAnswer again, fixing these problems.`,
    );
  }
  partes.push(`Context (JSON):\n${JSON.stringify(entrada, null, 2)}`);
  return partes.join('\n\n');
}

// ---------------------------------------------------------------------------------------------
// Conferência

type DesafioCru = {
  formato: FormatoDesafio;
  enunciado: string;
  dificuldade: Desafio['dificuldade'];
  opcoes: {
    id: string;
    texto?: string;
    caminho?: string;
    simbolo?: string;
    regiao_id?: string | null;
    ligacao?: TipoLigacao;
  }[];
  gabarito: string[];
  explicacao: string;
  evidencias: Evidencia[];
};
type LigacaoCrua = {
  tipo: TipoLigacao;
  descricao: string;
  destino: { regiao_id?: string; nova?: RegiaoNova };
  evidencias: Evidencia[];
};
type SaidaCrua = { desafios: DesafioCru[]; ligacoes?: LigacaoCrua[] };

/** O que a conferência precisa: os caminhos, os arquivos lidos e os ids válidos. */
type Contexto = {
  opcoes: OpcoesDaPreparacao;
  /** Leitura síncrona do que já foi carregado (as funções de evidencia.ts são síncronas). */
  lido: (caminho: string) => string | undefined;
  carregar: (caminhos: readonly string[]) => Promise<void>;
  regiaoId: string;
  regioes: ReadonlySet<string>;
  territorios: ReadonlySet<string>;
  arquivosDaRegiao: ReadonlySet<string>;
};

/** Normaliza o caminho do Mestre; caminho fora do Projeto conhecido conta como inexistente. */
function caminhoDoProjeto(ctx: Contexto, caminho: string, problemas: string[], onde: string) {
  const r = normalizarCaminho(ctx.opcoes.repositorios, caminho);
  if (!r.ok) {
    problemas.push(`${onde}: ${r.motivo}`);
    return undefined;
  }
  return r.caminho;
}

async function conferirEvidencias(
  ctx: Contexto,
  lista: readonly Evidencia[],
  onde: string,
  problemas: string[],
): Promise<Evidencia[]> {
  const normalizadas = lista.map((ev, k) => {
    const caminho = caminhoDoProjeto(ctx, ev.caminho, problemas, `${onde}[${k}]`);
    return caminho === undefined ? undefined : { ...ev, caminho };
  });
  await ctx.carregar(normalizadas.flatMap((ev) => (ev ? [ev.caminho] : [])));
  const certas: Evidencia[] = [];
  normalizadas.forEach((ev, k) => {
    if (!ev) return;
    const r = conferirOuRelocalizar(ctx.lido, ev);
    if (r.ok) certas.push(r.evidencia);
    else problemas.push(`${onde}[${k}] ${ev.caminho}:${ev.linha_inicio}: ${r.motivo}`);
  });
  return certas;
}

function embaralhar<T>(itens: readonly T[], aleatorio: Aleatorio): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  }
  return copia;
}

const repetidos = (ids: readonly string[]) => ids.length !== new Set(ids).size;

/** Regras 2–4 para um Desafio: a forma do Formato, o gabarito, as referências e as Evidências. */
async function conferirDesafio(
  ctx: Contexto,
  d: DesafioCru,
  onde: string,
): Promise<{ ok: true; desafio: Desafio } | { ok: false; problemas: string[] }> {
  const problemas: string[] = [];
  const ids = d.opcoes.map((o) => o.id);
  if (repetidos(ids)) problemas.push(`${onde}.opcoes: ids repetidos`);
  if (repetidos(d.gabarito)) problemas.push(`${onde}.gabarito: ids repetidos`);
  const fora = d.gabarito.filter((id) => !ids.includes(id));
  if (fora.length) problemas.push(`${onde}.gabarito: ids fora das opcoes: ${fora.join(', ')}`);

  let opcoes: Opcao[] = [];
  if (d.formato === 'multipla_escolha') {
    if (d.opcoes.length < 2) problemas.push(`${onde}.opcoes: menos de 2`);
    if (d.gabarito.length !== 1) problemas.push(`${onde}.gabarito: precisa de exatamente 1 id`);
    opcoes = d.opcoes.map((o, k) => {
      if (!o.texto) problemas.push(`${onde}.opcoes[${k}]: sem texto`);
      return { id: o.id, texto: o.texto ?? '' };
    });
  } else if (d.formato === 'apontar') {
    if (d.opcoes.length < 2) problemas.push(`${onde}.opcoes: menos de 2`);
    if (d.gabarito.length >= d.opcoes.length)
      problemas.push(`${onde}.gabarito: todas as opções são aceitas`);
    const caminhos = d.opcoes.map((o, k) =>
      o.caminho === undefined
        ? (problemas.push(`${onde}.opcoes[${k}]: sem caminho`), undefined)
        : caminhoDoProjeto(ctx, o.caminho, problemas, `${onde}.opcoes[${k}]`),
    );
    await ctx.carregar(caminhos.flatMap((c) => (c ? [c] : [])));
    opcoes = d.opcoes.map((o, k): OpcaoApontar => {
      const caminho = caminhos[k];
      const opcao: OpcaoApontar = { id: o.id, caminho: caminho ?? o.caminho ?? '' };
      if (o.simbolo !== undefined) opcao.simbolo = o.simbolo;
      if (caminho !== undefined) {
        const existe = !ctx.opcoes.arquivos || ctx.opcoes.arquivos.arquivos.has(caminho);
        const r = existe
          ? conferirOpcaoApontar(ctx.lido, opcao)
          : { ok: false as const, motivo: 'arquivo_inexistente' as const };
        if (!r.ok) {
          const alvo = opcao.simbolo ? `${caminho} → ${opcao.simbolo}` : caminho;
          problemas.push(`${onde}.opcoes[${k}] ${alvo}: ${r.motivo}`);
        }
      }
      return opcao;
    });
  } else {
    if (d.opcoes.length < 3) problemas.push(`${onde}.opcoes: menos de 3 passos`);
    if (d.gabarito.length !== d.opcoes.length)
      problemas.push(`${onde}.gabarito: precisa da ordem completa dos passos`);
    opcoes = d.opcoes.map((o, k): OpcaoTracarFluxo => {
      if (!o.texto) problemas.push(`${onde}.opcoes[${k}]: sem texto`);
      const regiao = o.regiao_id ?? null;
      // Regra 3: um passo só cita região do mapa enviado; fora dele, null (Névoa).
      if (regiao !== null && !ctx.regioes.has(regiao))
        problemas.push(`${onde}.opcoes[${k}].regiao_id: id desconhecido: ${regiao}`);
      const passo: OpcaoTracarFluxo = { id: o.id, texto: o.texto ?? '', regiao_id: regiao };
      if (o.ligacao !== undefined) passo.ligacao = o.ligacao;
      return passo;
    });
    // Passos já na ordem certa não são Desafio: o Jogo embaralha até sair dela.
    for (let k = 0; k < 10 && opcoes.every((o, j) => o.id === d.gabarito[j]); k++) {
      opcoes = embaralhar(opcoes, ctx.opcoes.aleatorio ?? Math.random);
    }
  }

  const evidencias = await conferirEvidencias(ctx, d.evidencias, `${onde}.evidencias`, problemas);
  if (problemas.length > 0) return { ok: false, problemas };
  return {
    ok: true,
    desafio: {
      id: ctx.opcoes.gerarId(),
      formato: d.formato,
      enunciado: d.enunciado.trim(),
      dificuldade: d.dificuldade,
      opcoes,
      gabarito: d.gabarito,
      explicacao: d.explicacao,
      evidencias,
    },
  };
}

/**
 * Uma Ligação: destino conhecido (e que não seja a própria região) ou região `nova` com arquivos
 * que existem fora desta região. Das Evidências, ficam as que batem com o código (ao menos uma).
 */
async function conferirLigacao(
  ctx: Contexto,
  l: LigacaoCrua,
  onde: string,
): Promise<{ ok: true; ligacao: LigacaoPreparada } | { ok: false; problemas: string[] }> {
  const problemas: string[] = [];
  let destino: LigacaoPreparada['destino'] | undefined;
  const { regiao_id, nova } = l.destino;
  if ((regiao_id === undefined) === (nova === undefined)) {
    problemas.push(`${onde}.destino: precisa de regiao_id ou nova (um dos dois)`);
  } else if (regiao_id !== undefined) {
    if (regiao_id === ctx.regiaoId) problemas.push(`${onde}.destino: a própria região`);
    else if (!ctx.regioes.has(regiao_id))
      problemas.push(`${onde}.destino.regiao_id: id desconhecido: ${regiao_id}`);
    else destino = { regiao_id };
  } else if (nova) {
    const daqui: string[] = [];
    if (nova.territorio_id === null) {
      if (!nova.territorio_novo) problemas.push(`${onde}.destino.nova: sem territorio_novo`);
    } else if (!ctx.territorios.has(nova.territorio_id)) {
      problemas.push(`${onde}.destino.nova.territorio_id: id desconhecido: ${nova.territorio_id}`);
    }
    const sementes = conferirCaminhos(
      nova.arquivos_semente,
      `${onde}.destino.nova.arquivos_semente`,
      ctx.opcoes,
      daqui,
    ).filter((c) => !ctx.arquivosDaRegiao.has(c));
    if (sementes.length === 0 && daqui.length === 0)
      daqui.push(`${onde}.destino.nova.arquivos_semente: só arquivos desta região`);
    const territorio_novo = nova.territorio_novo && {
      nome: nova.territorio_novo.nome,
      raizes: conferirCaminhos(
        nova.territorio_novo.raizes,
        `${onde}.destino.nova.territorio_novo.raizes`,
        ctx.opcoes,
        daqui,
        true,
      ),
    };
    problemas.push(...daqui);
    destino = {
      nova: {
        nome: nova.nome.trim(),
        resumo: nova.resumo,
        territorio_id: nova.territorio_id,
        ...(territorio_novo && { territorio_novo }),
        arquivos_semente: sementes,
      },
    };
  }
  const recusadas: string[] = [];
  const evidencias = await conferirEvidencias(ctx, l.evidencias, `${onde}.evidencias`, recusadas);
  if (evidencias.length === 0) problemas.push(...recusadas);
  if (problemas.length > 0 || !destino) return { ok: false, problemas };
  return {
    ok: true,
    ligacao: {
      id: ctx.opcoes.gerarId(),
      tipo: l.tipo,
      descricao: l.descricao,
      destino,
      evidencias,
    },
  };
}

/** Os Formatos exigidos que ainda faltam entre os válidos (regra 4). */
export function formatosFaltando(
  desafios: readonly Pick<Desafio, 'formato'>[],
  temLigacoes: boolean,
): FormatoDesafio[] {
  const exigidos: FormatoDesafio[] = temLigacoes ? ['apontar', 'tracar_fluxo'] : ['apontar'];
  return exigidos.filter((f) => !desafios.some((d) => d.formato === f));
}

const normalizarEnunciado = (e: string) => e.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * `preparar_expedicao` com a conferência inteira. Saída quebrada (JSON, schema) tenta a mesma
 * chamada de novo (até 2 vezes); Desafio inválido é descartado e reposto com `quantidade` = os
 * que faltam, até TENTATIVAS_DE_REPOSICAO pedidos extras. Pedido extra também serve para a
 * mistura mínima de Formatos, se faltar.
 */
export async function prepararExpedicao(
  transporte: Transporte,
  entrada: EntradaPrepararExpedicao,
  opcoes: OpcoesDaPreparacao,
): Promise<ExpedicaoPreparada> {
  const varios = opcoes.repositorios.length > 1;
  const lidos = new Map<string, string | undefined>();
  const ctx: Contexto = {
    opcoes,
    lido: (c) => lidos.get(c),
    carregar: async (caminhos) => {
      for (const c of new Set(caminhos)) {
        if (!lidos.has(c)) lidos.set(c, await opcoes.lerArquivo(c).catch(() => undefined));
      }
    },
    regiaoId: entrada.regiao.id,
    regioes: new Set([entrada.regiao.id, ...entrada.mapa.map((r) => r.id)]),
    territorios: new Set([
      ...entrada.territorios.map((t) => t.id),
      entrada.regiao.territorio_id,
      ...entrada.mapa.map((r) => r.territorio_id),
    ]),
    arquivosDaRegiao: new Set(entrada.regiao.arquivos),
  };

  const quantidade = entrada.quantidade;
  const validos: Desafio[] = [];
  const descartados: Descarte[] = [];
  const vistos = new Set(entrada.desafios_anteriores.map(normalizarEnunciado));
  let conhecidas = entrada.ligacoes_conhecidas;
  let ligacoes: LigacaoPreparada[] | undefined;
  let temLigacoes = conhecidas && (opcoes.temLigacoes ?? false);
  let recentes: Descarte[] = [];
  let pedidos = 0;

  for (let extra = 0; extra <= TENTATIVAS_DE_REPOSICAO; extra++) {
    const faltando = formatosFaltando(validos, temLigacoes);
    const faltam = quantidade - validos.length;
    if (faltam <= 0 && faltando.length === 0) break;
    // Já há Desafios bastantes, mas falta um Formato exigido: pede só esse(s).
    const pedir = faltam > 0 ? faltam : faltando.length;
    pedidos++;
    opcoes.aoPreparar?.({ tipo: 'pedido', numero: pedidos, quantidade: pedir });
    const daVez: EntradaPrepararExpedicao = {
      ...entrada,
      desafios_anteriores: [...entrada.desafios_anteriores, ...validos.map((d) => d.enunciado)],
      ligacoes_conhecidas: conhecidas,
      quantidade: pedir,
    };
    let saida: SaidaCrua;
    try {
      saida = await chamarComTentativas<SaidaCrua>(
        'preparar_expedicao',
        transporte,
        (problemas) =>
          montarPromptDaExpedicao(daVez, {
            varios,
            ...(extra > 0 && { faltando, descartados: recentes }),
            problemas,
          }),
        esquemaPrepararExpedicao(conhecidas),
        (valor) => ({ ok: true, valor: valor as SaidaCrua }),
        opcoes.aoAcompanhar,
      );
    } catch (e) {
      // Uma reposição que falha não estraga o que já foi conferido: com 3 ou mais, a Expedição roda.
      if (extra > 0 && validos.length >= MINIMO_DE_DESAFIOS) break;
      throw e;
    }

    recentes = [];
    if (!conhecidas && saida.ligacoes) {
      const certas: LigacaoPreparada[] = [];
      for (const [k, l] of saida.ligacoes.entries()) {
        const r = await conferirLigacao(ctx, l, `ligacoes[${k}]`);
        if (r.ok) certas.push(r.ligacao);
        else descartados.push({ onde: `ligacoes[${k}]`, problemas: r.problemas });
      }
      // Todas recusadas: continuam desconhecidas, e a próxima tentativa pede de novo.
      if (saida.ligacoes.length === 0 || certas.length > 0) {
        ligacoes = certas;
        conhecidas = true;
        temLigacoes = certas.length > 0;
      }
    }
    for (const [k, d] of saida.desafios.entries()) {
      const onde = `desafios[${k}]`;
      const chave = normalizarEnunciado(d.enunciado);
      const r = vistos.has(chave)
        ? { ok: false as const, problemas: [`${onde}: enunciado repetido`] }
        : await conferirDesafio(ctx, d, onde);
      if (r.ok) {
        vistos.add(chave);
        validos.push(r.desafio);
      } else {
        recentes.push({ onde, problemas: r.problemas });
      }
    }
    descartados.push(...recentes);
    opcoes.aoPreparar?.({
      tipo: 'conferida',
      validos: validos.length,
      descartados: recentes.length,
      quantidade,
    });
  }

  if (validos.length < MINIMO_DE_DESAFIOS) {
    throw new PoucosDesafios(
      validos.length,
      pedidos,
      descartados.flatMap((d) => d.problemas).slice(0, 20),
    );
  }
  const desafios = escolherDesafios(validos, [], {
    quantidade,
    temLigacoes,
    ...(opcoes.aleatorio && { aleatorio: opcoes.aleatorio }),
  });
  return { desafios, ...(ligacoes && { ligacoes }), descartados, pedidos };
}
