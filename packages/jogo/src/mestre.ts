// A interface única de Mestre (spec §7, docs/contrato-mestre.md): cada chamada monta o prompt
// (papel de Mestre + JSON de contexto com `idioma`), manda junto o JSON Schema da saída, confere a
// resposta (schema, referências, caminhos) e tenta de novo até 2 vezes. Quem fala com a CLI é o
// transporte, injetado: Claude Code ou Codex no desktop, um fake nos testes.
import { normalizarCaminho, type ArquivosDoProjeto, type Repositorio } from './caminhos.ts';
import type {
  Classe,
  Desafio,
  Evidencia,
  Ligacao,
  RegiaoConhecida,
  RegiaoNova,
} from './contrato.ts';
import { conferirEsquema, type Esquema } from './esquema.ts';
import type { Idioma } from './idioma.ts';

export type NomeDaChamada =
  'criar_aventura' | 'detalhar_regiao' | 'preparar_expedicao' | 'contestar';

export type PedidoAoMestre = { chamada: NomeDaChamada; prompt: string; schema: Esquema };

/** Entrega o pedido à IA e devolve o JSON da saída como texto (já fora do envelope da CLI). */
export type Transporte = (pedido: PedidoAoMestre) => Promise<string>;

/** A resposta não serve (envelope sem saída, JSON quebrado, schema, referências): vale nova tentativa. */
export class SaidaInvalida extends Error {
  constructor(readonly problemas: readonly string[]) {
    super(problemas.join('; '));
    this.name = 'SaidaInvalida';
  }
}

/** Depois das novas tentativas, o erro claro para o Jogador (com os problemas da última). */
export class ErroDoMestre extends Error {
  constructor(
    readonly chamada: NomeDaChamada,
    readonly tentativas: number,
    readonly problemas: readonly string[],
  ) {
    super(`${chamada}: saída inválida depois de ${tentativas} tentativas`);
    this.name = 'ErroDoMestre';
  }
}

/** Saída inteira inválida: até 2 novas tentativas da mesma chamada (regra 5). */
export const NOVAS_TENTATIVAS = 2;

export type EventoDoMestre =
  | { tipo: 'tentativa'; chamada: NomeDaChamada; numero: number; de: number }
  | { tipo: 'recusada'; chamada: NomeDaChamada; numero: number; problemas: readonly string[] };

export type OpcoesDaChamada = {
  /** Os repositórios do Projeto: decidem se os caminhos levam prefixo. */
  repositorios: readonly Repositorio[];
  /** Os arquivos commitados; com eles, caminho que não existe é recusado. */
  arquivos?: ArquivosDoProjeto;
  aoAcompanhar?: (evento: EventoDoMestre) => void;
};

// ---------------------------------------------------------------------------------------------
// Tipos das chamadas

export type EntradaCriarAventura = {
  idioma: Idioma;
  repositorios: Repositorio[];
  classe: Classe;
};

export type TerritorioProposto = { nome: string; resumo: string; raizes: string[] };
export type CandidataEntrada = RegiaoNova & { motivo: string };

export type SaidaCriarAventura = {
  territorios: TerritorioProposto[];
  /** 1–3; a primeira é a sugestão da Classe. */
  candidatas_entrada: CandidataEntrada[];
  aviso_classe?: string;
};

export type TerritorioConhecido = TerritorioProposto & { id: string };

export type EntradaDetalharRegiao = {
  idioma: Idioma;
  regiao: RegiaoConhecida & { arquivos_semente: string[] };
  mapa: RegiaoConhecida[];
  classe: Classe;
  /** Além do contrato: os Territórios com id, para `dividir` apontar o certo. */
  territorios: TerritorioConhecido[];
};

export type SaidaDetalharRegiao = {
  resumo: string;
  arquivos: string[];
  dividir?: RegiaoNova[];
};

export type EntradaPrepararExpedicao = {
  idioma: Idioma;
  regiao: RegiaoConhecida;
  mapa: RegiaoConhecida[];
  classe: Classe;
  /** Enunciados já vistos nesta região (não repetir). */
  desafios_anteriores: string[];
  /** true = as Ligações já vieram numa tentativa anterior; o Mestre não precisa devolvê-las. */
  ligacoes_conhecidas: boolean;
  mudancas?: { diff?: string; arquivos_alterados: string[] };
  /** Normalmente 5; menos ao repor Desafios descartados. */
  quantidade: number;
  /** Além do contrato: os Territórios com id, para uma Ligação com região `nova` apontar o seu. */
  territorios: TerritorioConhecido[];
};
export type SaidaPrepararExpedicao = {
  desafios: Desafio[];
  ligacoes?: Ligacao[];
  arquivos_atualizados?: string[];
};

/** Chega com a Contestação real (#36). */
export type EntradaContestar = {
  idioma: Idioma;
  desafio: Desafio;
  resposta_jogador: string[];
  argumento: string;
};
export type { Evidencia };

// ---------------------------------------------------------------------------------------------
// Schemas

const texto: Esquema = { type: 'string', minLength: 1 };
const textos = (minItems: number, maxItems?: number): Esquema => ({
  type: 'array',
  items: texto,
  minItems,
  ...(maxItems !== undefined && { maxItems }),
});
const objeto = (
  properties: Record<string, Esquema>,
  opcionais: readonly string[] = [],
): Esquema => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((k) => !opcionais.includes(k)),
  additionalProperties: false,
});

const territorioNovo = objeto({ nome: texto, raizes: textos(1) });

const regiaoNova = (territorioId: Esquema, extras: Record<string, Esquema> = {}) =>
  objeto(
    {
      nome: texto,
      resumo: texto,
      territorio_id: territorioId,
      territorio_novo: territorioNovo,
      arquivos_semente: textos(1, 5),
      ...extras,
    },
    ['territorio_novo'],
  );

export const ESQUEMA_CRIAR_AVENTURA: Esquema = objeto(
  {
    territorios: {
      type: 'array',
      minItems: 1,
      items: objeto({ nome: texto, resumo: texto, raizes: textos(1) }),
    },
    candidatas_entrada: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      // Os Territórios ainda não têm id: a candidata aponta o seu por territorio_novo.nome.
      items: {
        ...regiaoNova({ type: 'null' }, { motivo: texto }),
        required: [
          'nome',
          'resumo',
          'territorio_id',
          'territorio_novo',
          'arquivos_semente',
          'motivo',
        ],
      },
    },
    aviso_classe: texto,
  },
  ['aviso_classe'],
);

export function esquemaDetalharRegiao(permitirDividir: boolean): Esquema {
  const propriedades: Record<string, Esquema> = { resumo: texto, arquivos: textos(1) };
  if (permitirDividir) {
    propriedades.dividir = {
      type: 'array',
      minItems: 2,
      items: regiaoNova({ type: ['string', 'null'] }),
    };
  }
  return objeto(propriedades, ['dividir']);
}

// ---------------------------------------------------------------------------------------------
// Prompt

export const NOME_DO_IDIOMA: Readonly<Record<Idioma, string>> = {
  pt: 'Brazilian Portuguese (pt)',
  en: 'English (en)',
  es: 'Spanish (es)',
};

export const PAPEL = `You are the Master (Mestre) of "Quiz your slop", a JRPG-style game in which the Player learns how their own software project works. You read the Project's code with read-only tools (Read, Grep, Glob) and never change anything. The Game keeps all memory: everything you need is in the context below, and every id is created by the Game — only reference ids you received.`;

export const REGRAS_DE_CAMINHO = (varios: boolean) =>
  varios
    ? `Paths: the Project has several repositories (listed in the context). Every path you return is relative to its repository root and prefixed by the repository name and a colon, e.g. "loja-api:src/orders/service.ts". A repository root is "loja-api:.".`
    : `Paths: every path you return is relative to the repository root (no leading "/", no ".."), e.g. "src/orders/service.ts". The root itself is ".".`;

const INSTRUCOES: Readonly<Record<'criar_aventura' | 'detalhar_regiao', string>> = {
  criar_aventura: `Call: criar_aventura. Read the Project's structure and propose:
- "territorios": one per application or service (a repository, or an app inside a monorepo), each with a short player-facing name, a 1–2 sentence summary and its root folders ("raizes").
- "candidatas_entrada": 1 to 3 candidate entry Regions for the Player's Class, the first being your suggestion. A Region is a functional responsibility (e.g. "Orders API", "Login screen"), not a folder, sized to yield about 5 questions. Each has a name, a 1–2 sentence summary without internal jargon, "territorio_id": null, "territorio_novo" with the exact "nome" and "raizes" of one of your "territorios", 1–5 "arquivos_semente" (existing files that anchor the Region) and a "motivo" (why it is a good entry for this Class).
Entry by Class: backend → the main route/service; frontend → the home page or login; fullstack → a Region where the front end calls the back end.
- "aviso_classe": only if the Project lacks the part the Class needs (e.g. no front end for frontend); explain briefly and suggest the closest entry.`,
  detalhar_regiao: `Call: detalhar_regiao. The Region in the context ("regiao") has just been unlocked. Read its seed files ("arquivos_semente") and what they use, and return:
- "resumo": a better 1–2 sentence summary of what the Region does.
- "arquivos": the complete list of existing files that make up this Region, avoiding overlap with the Regions already in "mapa".`,
};

const INSTRUCAO_DIVIDIR = `- "dividir" (optional): only if the Region is too big for about 5 questions, the Regions that replace it (at least 2), each with name, summary, "territorio_id" (an id from "territorios") and 1–5 "arquivos_semente".`;

export function montarPrompt(
  chamada: 'criar_aventura' | 'detalhar_regiao',
  entrada: { idioma: Idioma },
  opcoes: { varios: boolean; permitirDividir?: boolean; problemas?: readonly string[] },
): string {
  const partes = [
    PAPEL,
    INSTRUCOES[chamada] + (opcoes.permitirDividir ? `\n${INSTRUCAO_DIVIDIR}` : ''),
    REGRAS_DE_CAMINHO(opcoes.varios),
    `Language: write every human-readable text (names, summaries, reasons, warnings) in ${NOME_DO_IDIOMA[entrada.idioma]}. Keep paths, symbols and code exactly as in the repository.`,
    'Answer only with JSON that matches the given JSON Schema.',
  ];
  if (opcoes.problemas?.length) {
    partes.push(
      `Your previous answer was rejected:\n${opcoes.problemas.map((p) => `- ${p}`).join('\n')}\nAnswer again, fixing these problems.`,
    );
  }
  partes.push(`Context (JSON):\n${JSON.stringify(entrada, null, 2)}`);
  return partes.join('\n\n');
}

// ---------------------------------------------------------------------------------------------
// Chamada com novas tentativas

export type Conferencia<S> = { ok: true; valor: S } | { ok: false; problemas: string[] };

/** Uma chamada ao Mestre com as novas tentativas da regra 5 (saída inteira inválida). */
export async function chamarComTentativas<S>(
  chamada: NomeDaChamada,
  transporte: Transporte,
  prompt: (problemas: readonly string[]) => string,
  schema: Esquema,
  conferir: (valor: unknown) => Conferencia<S> | Promise<Conferencia<S>>,
  aoAcompanhar?: (evento: EventoDoMestre) => void,
): Promise<S> {
  const total = 1 + NOVAS_TENTATIVAS;
  let problemas: readonly string[] = [];
  for (let numero = 1; numero <= total; numero++) {
    aoAcompanhar?.({ tipo: 'tentativa', chamada, numero, de: total });
    try {
      const resposta = await transporte({ chamada, prompt: prompt(problemas), schema });
      let valor: unknown;
      try {
        valor = JSON.parse(resposta);
      } catch {
        throw new SaidaInvalida(['a resposta não é JSON']);
      }
      const doEsquema = conferirEsquema(schema, valor);
      if (doEsquema.length > 0) throw new SaidaInvalida(doEsquema);
      const conferida = await conferir(valor);
      if (!conferida.ok) throw new SaidaInvalida(conferida.problemas);
      return conferida.valor;
    } catch (e) {
      // Erro do transporte (CLI ausente, tempo esgotado...) não melhora tentando de novo.
      if (!(e instanceof SaidaInvalida)) throw e;
      problemas = e.problemas.slice(0, 20);
      aoAcompanhar?.({ tipo: 'recusada', chamada, numero, problemas });
    }
  }
  throw new ErroDoMestre(chamada, total, problemas);
}

/**
 * Normaliza uma lista de caminhos. Caminho malformado (absoluto, `..`, prefixo errado) é problema;
 * caminho que não existe no Projeto é só descartado, desde que sobre algum.
 */
export function conferirCaminhos(
  lista: readonly string[],
  onde: string,
  opcoes: OpcoesDaChamada,
  problemas: string[],
  pasta = false,
): string[] {
  const certos: string[] = [];
  const existentes = pasta ? opcoes.arquivos?.pastas : opcoes.arquivos?.arquivos;
  for (const c of lista) {
    const r = normalizarCaminho(opcoes.repositorios, c, { pasta });
    if (!r.ok) problemas.push(`${onde}: ${r.motivo}`);
    else if ((!existentes || existentes.has(r.caminho)) && !certos.includes(r.caminho))
      certos.push(r.caminho);
  }
  if (lista.length > 0 && certos.length === 0 && !problemas.some((p) => p.startsWith(onde))) {
    problemas.push(
      `${onde}: ${pasta ? 'nenhuma pasta' : 'nenhum arquivo'} existe no Projeto: ${lista.join(', ')}`,
    );
  }
  return certos;
}

/** `criar_aventura`: Territórios e 1–3 candidatas a região de entrada. */
export function criarAventura(
  transporte: Transporte,
  entrada: EntradaCriarAventura,
  opcoes: OpcoesDaChamada,
): Promise<SaidaCriarAventura> {
  const varios = opcoes.repositorios.length > 1;
  return chamarComTentativas(
    'criar_aventura',
    transporte,
    (problemas) => montarPrompt('criar_aventura', entrada, { varios, problemas }),
    ESQUEMA_CRIAR_AVENTURA,
    (valor) => {
      const saida = valor as SaidaCriarAventura;
      const problemas: string[] = [];
      const nomes = new Set<string>();
      const territorios = saida.territorios.map((t, k) => {
        if (nomes.has(t.nome)) problemas.push(`territorios[${k}]: nome repetido: ${t.nome}`);
        nomes.add(t.nome);
        return {
          ...t,
          raizes: conferirCaminhos(t.raizes, `territorios[${k}].raizes`, opcoes, problemas, true),
        };
      });
      const candidatas = saida.candidatas_entrada.map((c, k) => {
        const onde = `candidatas_entrada[${k}]`;
        // Regra 3: a candidata aponta um Território desta mesma saída.
        if (!c.territorio_novo || !nomes.has(c.territorio_novo.nome)) {
          problemas.push(`${onde}.territorio_novo.nome: não é um dos territorios`);
        }
        const territorio = territorios.find((t) => t.nome === c.territorio_novo?.nome);
        return {
          ...c,
          ...(territorio && {
            territorio_novo: { nome: territorio.nome, raizes: territorio.raizes },
          }),
          arquivos_semente: conferirCaminhos(
            c.arquivos_semente,
            `${onde}.arquivos_semente`,
            opcoes,
            problemas,
          ),
        };
      });
      if (problemas.length > 0) return { ok: false, problemas };
      return {
        ok: true,
        valor: {
          territorios,
          candidatas_entrada: candidatas,
          ...(saida.aviso_classe !== undefined && { aviso_classe: saida.aviso_classe }),
        },
      };
    },
    opcoes.aoAcompanhar,
  );
}

/** `detalhar_regiao`: a lista completa de arquivos da região, ou a divisão dela. */
export function detalharRegiao(
  transporte: Transporte,
  entrada: EntradaDetalharRegiao,
  opcoes: OpcoesDaChamada & { permitirDividir?: boolean },
): Promise<SaidaDetalharRegiao> {
  const varios = opcoes.repositorios.length > 1;
  const permitirDividir = opcoes.permitirDividir ?? true;
  const idsDeTerritorio = new Set([
    ...entrada.territorios.map((t) => t.id),
    ...entrada.mapa.map((r) => r.territorio_id),
    entrada.regiao.territorio_id,
  ]);
  return chamarComTentativas(
    'detalhar_regiao',
    transporte,
    (problemas) => montarPrompt('detalhar_regiao', entrada, { varios, permitirDividir, problemas }),
    esquemaDetalharRegiao(permitirDividir),
    (valor) => {
      const saida = valor as SaidaDetalharRegiao;
      const problemas: string[] = [];
      const arquivos = conferirCaminhos(saida.arquivos, 'arquivos', opcoes, problemas);
      const dividir = saida.dividir?.map((r, k) => {
        const onde = `dividir[${k}]`;
        if (r.territorio_id === null) {
          if (!r.territorio_novo) problemas.push(`${onde}: territorio_id null sem territorio_novo`);
        } else if (!idsDeTerritorio.has(r.territorio_id)) {
          problemas.push(`${onde}.territorio_id: id desconhecido: ${r.territorio_id}`);
        }
        const territorio_novo = r.territorio_novo && {
          nome: r.territorio_novo.nome,
          raizes: conferirCaminhos(
            r.territorio_novo.raizes,
            `${onde}.territorio_novo.raizes`,
            opcoes,
            problemas,
            true,
          ),
        };
        return {
          ...r,
          ...(territorio_novo && { territorio_novo }),
          arquivos_semente: conferirCaminhos(
            r.arquivos_semente,
            `${onde}.arquivos_semente`,
            opcoes,
            problemas,
          ),
        };
      });
      if (problemas.length > 0) return { ok: false, problemas };
      return { ok: true, valor: { resumo: saida.resumo, arquivos, ...(dividir && { dividir }) } };
    },
    opcoes.aoAcompanhar,
  );
}
