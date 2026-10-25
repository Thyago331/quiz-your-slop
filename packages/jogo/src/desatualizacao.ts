// Região desatualizada (spec §6): o Jogo percebe sozinho, sem IA, que o código de uma região
// revelada mudou o bastante. Só conta o que foi commitado: tudo sai de `git diff --numstat` entre
// commits (o da revelação, HEAD e a árvore vazia), nunca da pasta de trabalho.
//
// A regra, por região, somando os repositórios dela:
// - linhas mudadas (adicionadas + removidas, nos arquivos da região) ÷ linhas da região no commit
//   da revelação ≥ limiar. O denominador é o `numstat` da árvore vazia até a revelação (as linhas
//   de cada arquivo naquele commit); arquivo binário (`-\t-`) conta 0 dos dois lados. Região sem
//   nenhuma linha de texto na revelação fica desatualizada com qualquer linha mudada; ou
// - um arquivo da região foi apagado ou renomeado; ou
// - surgiu arquivo novo numa pasta da região: na pasta (não nas subpastas) de algum arquivo dela,
//   que não existia no commit da revelação.
import { caminhoNoProjeto, normalizarCaminho, type Repositorio } from './caminhos.ts';
import type { AventuraNoProjeto, RegiaoDoProjeto } from './criacao.ts';
import type { EstadoNoMapa } from './mapa.ts';
import type { EntradaPrepararExpedicao } from './mestre.ts';
import { CALIBRAGEM_PADRAO } from './progressao.ts';

/** Os `git` que a detecção usa (um pedaço da lista fechada da camada Rust). */
export type ComandoGitDaLeitura =
  | { tipo: 'rev_parse_head' }
  | { tipo: 'diff_numstat'; de: string; ate: string; caminhos: string[] }
  | { tipo: 'diff'; de: string; ate: string; caminhos: string[] };

/** Roda um `git` na pasta do repositório e devolve o stdout. */
export type RodarGit = (repositorio: Repositorio, comando: ComandoGitDaLeitura) => Promise<string>;

/** A árvore vazia, que todo repositório conhece: o diff dela até um commit dá as linhas de cada arquivo. */
export const ARVORE_VAZIA = {
  sha1: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  sha256: '6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321',
} as const;

const arvoreVazia = (commit: string) =>
  commit.length === 64 ? ARVORE_VAZIA.sha256 : ARVORE_VAZIA.sha1;

/** As saídas cruas de `git diff --numstat -z` de uma região num repositório. */
export type LeituraDoRepositorio = {
  /** Da revelação até HEAD, nas pastas da região (com renomeados). */
  mudou: string;
  /** Da árvore vazia até a revelação: as linhas de cada arquivo naquele commit. */
  antes: string;
  /** Da árvore vazia até HEAD, nos arquivos da região que mudaram: quais ainda existem. */
  depois: string;
};

/** Região → repositório → leitura. */
export type LeiturasDasRegioes = Record<string, Record<string, LeituraDoRepositorio>>;

/** Um arquivo da região que mudou; `null` nas linhas é arquivo binário. */
export type ArquivoAlterado = {
  caminho: string;
  adicionadas: number | null;
  removidas: number | null;
};

/** O que mudou numa região desde a revelação, com os caminhos do Projeto. */
export type MudancaDaRegiao = {
  alterados: ArquivoAlterado[];
  apagados: string[];
  renomeados: { de: string; para: string }[];
  novos: string[];
  /** Linhas nos arquivos da região (os apagados e renomeados também). */
  adicionadas: number;
  removidas: number;
  /** O denominador: linhas de texto da região no commit da revelação. */
  linhasNaRevelacao: number;
  /** Se a mudança basta para a região ficar desatualizada. */
  desatualizada: boolean;
};

type Entrada = {
  adicionadas: number | null;
  removidas: number | null;
  caminho: string;
  /** Só em renomeado: o caminho antigo. */
  de?: string;
};

/** `a\td\tcaminho\0`, ou `a\td\t\0antigo\0novo\0` num renomeado; o resto é ignorado. */
function lerNumstat(saida: string): Entrada[] {
  const partes = saida.split('\0');
  const entradas: Entrada[] = [];
  const numero = (x: string) => (x === '-' ? null : Number(x));
  for (let k = 0; k < partes.length; k++) {
    const m = /^(\d+|-)\t(\d+|-)\t(.*)$/s.exec(partes[k] ?? '');
    if (!m) continue;
    const [, a = '', r = '', caminho = ''] = m;
    const base = { adicionadas: numero(a), removidas: numero(r) };
    if (caminho !== '') {
      entradas.push({ ...base, caminho });
    } else {
      const de = partes[k + 1];
      const para = partes[k + 2];
      k += 2;
      if (de && para) entradas.push({ ...base, caminho: para, de });
    }
  }
  return entradas;
}

const pastaDe = (relativo: string) =>
  relativo.includes('/') ? relativo.slice(0, relativo.lastIndexOf('/')) : '.';

/** Os arquivos da região por repositório (caminhos relativos), na ordem em que aparecem. */
function porRepositorio(aventura: AventuraNoProjeto, regiao: RegiaoDoProjeto) {
  const grupos = new Map<string, string[]>();
  for (const caminho of regiao.arquivos) {
    const r = normalizarCaminho(aventura.repositorios, caminho);
    if (!r.ok) continue;
    const lista = grupos.get(r.partes.repositorio) ?? [];
    if (!lista.includes(r.partes.relativo)) lista.push(r.partes.relativo);
    grupos.set(r.partes.repositorio, lista);
  }
  return grupos;
}

const conhecida = (estado: EstadoNoMapa | undefined) =>
  estado === 'revelada' || estado === 'desatualizada';

/** O que mudou num repositório, em caminhos relativos. */
type MudancaNoRepositorio = Omit<MudancaDaRegiao, 'desatualizada'>;

function avaliarRepositorio(arquivos: readonly string[], leitura: LeituraDoRepositorio) {
  const daRegiao = new Set(arquivos);
  const pastas = new Set(arquivos.map(pastaDe));
  const antes = new Map(lerNumstat(leitura.antes).map((e) => [e.caminho, e.adicionadas]));
  const depois = new Set(lerNumstat(leitura.depois).map((e) => e.caminho));
  const m: MudancaNoRepositorio = {
    alterados: [],
    apagados: [],
    renomeados: [],
    novos: [],
    adicionadas: 0,
    removidas: 0,
    linhasNaRevelacao: arquivos.reduce((soma, c) => soma + (antes.get(c) ?? 0), 0),
  };
  const contar = (e: Entrada) => {
    m.adicionadas += e.adicionadas ?? 0;
    m.removidas += e.removidas ?? 0;
  };
  for (const e of lerNumstat(leitura.mudou)) {
    if (e.de !== undefined && daRegiao.has(e.de)) {
      m.renomeados.push({ de: e.de, para: e.caminho });
      contar(e);
    } else if (e.de === undefined && daRegiao.has(e.caminho)) {
      contar(e);
      if (antes.has(e.caminho) && !depois.has(e.caminho)) m.apagados.push(e.caminho);
      else
        m.alterados.push({
          caminho: e.caminho,
          adicionadas: e.adicionadas,
          removidas: e.removidas,
        });
    } else if (
      !daRegiao.has(e.caminho) &&
      pastas.has(pastaDe(e.caminho)) &&
      !antes.has(e.caminho)
    ) {
      m.novos.push(e.caminho);
    }
  }
  return m;
}

/** Junta os repositórios da região, com os caminhos do Projeto (prefixo quando há vários). */
function avaliarRegiao(
  aventura: AventuraNoProjeto,
  regiao: RegiaoDoProjeto,
  leituras: Readonly<Record<string, LeituraDoRepositorio>>,
  limiar: number,
): MudancaDaRegiao | undefined {
  const total: MudancaNoRepositorio = {
    alterados: [],
    apagados: [],
    renomeados: [],
    novos: [],
    adicionadas: 0,
    removidas: 0,
    linhasNaRevelacao: 0,
  };
  for (const [repositorio, arquivos] of porRepositorio(aventura, regiao)) {
    const leitura = leituras[repositorio];
    if (!leitura) continue;
    const m = avaliarRepositorio(arquivos, leitura);
    const p = (c: string) => caminhoNoProjeto(aventura.repositorios, repositorio, c);
    total.alterados.push(...m.alterados.map((a) => ({ ...a, caminho: p(a.caminho) })));
    total.apagados.push(...m.apagados.map(p));
    total.renomeados.push(...m.renomeados.map((r) => ({ de: p(r.de), para: p(r.para) })));
    total.novos.push(...m.novos.map(p));
    total.adicionadas += m.adicionadas;
    total.removidas += m.removidas;
    total.linhasNaRevelacao += m.linhasNaRevelacao;
  }
  const nada =
    total.alterados.length +
      total.apagados.length +
      total.renomeados.length +
      total.novos.length ===
    0;
  if (nada) return undefined;
  const mudadas = total.adicionadas + total.removidas;
  // Divisão, não multiplicação: 3/15 dá exatamente 0.2, e 0.2 * 15 não dá 3.
  const pelasLinhas =
    mudadas > 0 && (total.linhasNaRevelacao === 0 || mudadas / total.linhasNaRevelacao >= limiar);
  const desatualizada =
    pelasLinhas || total.apagados.length + total.renomeados.length + total.novos.length > 0;
  return { ...total, desatualizada };
}

/**
 * Aplica a regra às leituras que o desktop trouxe do `git`: região revelada que mudou o bastante
 * fica desatualizada (a que já está desatualizada continua, até ser revelada de novo). Devolve a
 * mesma Aventura se nada mudou de estado, e o que mudou em cada região com alguma mudança.
 */
export function detectarDesatualizadas(
  aventura: AventuraNoProjeto,
  leituras: LeiturasDasRegioes,
  limiar: number = CALIBRAGEM_PADRAO.limiarDesatualizada,
): { aventura: AventuraNoProjeto; mudancas: Record<string, MudancaDaRegiao> } {
  const mudancas: Record<string, MudancaDaRegiao> = {};
  const marcar: string[] = [];
  for (const regiao of aventura.regioes) {
    const estado = aventura.mapa.estados[regiao.id];
    const lidas = leituras[regiao.id];
    if (!conhecida(estado) || !lidas) continue;
    const m = avaliarRegiao(aventura, regiao, lidas, limiar);
    if (!m) continue;
    mudancas[regiao.id] = m;
    if (m.desatualizada && estado === 'revelada') marcar.push(regiao.id);
  }
  if (marcar.length === 0) return { aventura, mudancas };
  const estados = { ...aventura.mapa.estados };
  for (const id of marcar) estados[id] = 'desatualizada';
  return { aventura: { ...aventura, mapa: { ...aventura.mapa, estados } }, mudancas };
}

/**
 * Lê do `git` o que `detectarDesatualizadas` precisa, região por região (todas as reveladas e
 * desatualizadas, ou só `ids`). Primeiro o que mudou desde a revelação; só se algo mudou, as
 * linhas na revelação e o que ainda existe. Um `git` que falha (commit que sumiu num rebase, por
 * exemplo) deixa a região de fora: ela fica como está.
 */
export async function lerMudancas(
  aventura: AventuraNoProjeto,
  git: RodarGit,
  ids?: readonly string[],
): Promise<LeiturasDasRegioes> {
  const leituras: LeiturasDasRegioes = {};
  for (const regiao of aventura.regioes) {
    if (ids && !ids.includes(regiao.id)) continue;
    if (!conhecida(aventura.mapa.estados[regiao.id]) || !regiao.revelada_em) continue;
    try {
      const daRegiao: Record<string, LeituraDoRepositorio> = {};
      const grupos = [...porRepositorio(aventura, regiao)].flatMap(([nome, arquivos]) => {
        const repositorio = aventura.repositorios.find((r) => r.nome === nome);
        const commit = regiao.revelada_em?.[nome];
        return repositorio && commit ? [{ repositorio, commit, arquivos }] : [];
      });
      for (const { repositorio, commit, arquivos } of grupos) {
        const pastas = [...new Set(arquivos.map(pastaDe))];
        const mudou = await git(repositorio, {
          tipo: 'diff_numstat',
          de: commit,
          ate: 'HEAD',
          caminhos: pastas,
        });
        daRegiao[repositorio.nome] = { mudou, antes: '', depois: '' };
      }
      const algo = Object.values(daRegiao).some((l) => lerNumstat(l.mudou).length > 0);
      for (const { repositorio, commit, arquivos } of algo ? grupos : []) {
        const leitura = daRegiao[repositorio.nome] as LeituraDoRepositorio;
        const pastas = new Set(arquivos.map(pastaDe));
        const entradas = lerNumstat(leitura.mudou);
        // Candidatos a arquivo novo: os que mudaram direto numa pasta da região.
        const candidatos = entradas
          .map((e) => e.caminho)
          .filter((c) => !arquivos.includes(c) && pastas.has(pastaDe(c)));
        const tocados = arquivos.filter((c) =>
          entradas.some((e) => e.de === undefined && e.caminho === c),
        );
        const vazia = arvoreVazia(commit);
        leitura.antes = await git(repositorio, {
          tipo: 'diff_numstat',
          de: vazia,
          ate: commit,
          caminhos: [...new Set([...arquivos, ...candidatos])],
        });
        // Lista vazia de caminhos seria o repositório todo.
        if (tocados.length > 0) {
          leitura.depois = await git(repositorio, {
            tipo: 'diff_numstat',
            de: vazia,
            ate: 'HEAD',
            caminhos: tocados,
          });
        }
      }
      leituras[regiao.id] = daRegiao;
    } catch {
      // Fica de fora.
    }
  }
  return leituras;
}

/** O HEAD de cada repositório: o commit da revelação, se a Expedição for vencida. */
export async function lerCommits(
  repositorios: readonly Repositorio[],
  git: RodarGit,
): Promise<Record<string, string>> {
  const commits: Record<string, string> = {};
  for (const r of repositorios) {
    const head = (await git(r, { tipo: 'rev_parse_head' })).trim();
    // Só um hash inteiro (SHA-1 ou SHA-256) serve de commit da revelação.
    if (/^([0-9a-f]{40}|[0-9a-f]{64})$/.test(head)) commits[r.nome] = head;
  }
  return commits;
}

/** Os caminhos que mudaram na região, para o Mestre (`arquivos_alterados`). */
export function arquivosAlterados(m: MudancaDaRegiao): string[] {
  return [
    ...new Set([
      ...m.alterados.map((a) => a.caminho),
      ...m.apagados,
      ...m.renomeados.flatMap((r) => [r.de, r.para]),
      ...m.novos,
    ]),
  ];
}

const bytes = (texto: string) => new TextEncoder().encode(texto).length;

/**
 * `mudancas` de `preparar_expedicao` numa região desatualizada: o `git diff` da revelação até HEAD
 * nos arquivos da região (e nos novos), e a lista do que mudou. Diff com mais de `limite` bytes
 * fica de fora (só a lista vai). Com vários repositórios, cada diff vem depois de `# <nome>`.
 */
export async function mudancasParaOMestre(
  aventura: AventuraNoProjeto,
  regiaoId: string,
  git: RodarGit,
  limite: number = CALIBRAGEM_PADRAO.limiteDoDiff,
): Promise<NonNullable<EntradaPrepararExpedicao['mudancas']>> {
  const regiao = aventura.regioes.find((r) => r.id === regiaoId);
  if (!regiao) throw new Error(`Região fora da Aventura: ${regiaoId}`);
  const leituras = await lerMudancas(aventura, git, [regiaoId]);
  const mudanca = avaliarRegiao(aventura, regiao, leituras[regiaoId] ?? {}, 1);
  const alterados = mudanca ? arquivosAlterados(mudanca) : [];
  const varios = aventura.repositorios.length > 1;
  const diffs: string[] = [];
  for (const [nome, arquivos] of porRepositorio(aventura, {
    ...regiao,
    arquivos: [...regiao.arquivos, ...alterados],
  })) {
    const repositorio = aventura.repositorios.find((r) => r.nome === nome);
    const commit = regiao.revelada_em?.[nome];
    if (!repositorio || !commit) continue;
    const doRepositorio = alterados.some((c) => {
      const r = normalizarCaminho(aventura.repositorios, c);
      return r.ok && r.partes.repositorio === nome;
    });
    if (!doRepositorio) continue;
    const diff = await git(repositorio, {
      tipo: 'diff',
      de: commit,
      ate: 'HEAD',
      caminhos: arquivos,
    });
    diffs.push(varios ? `# ${nome}\n${diff}` : diff);
  }
  const diff = diffs.join('\n');
  return {
    ...(diff !== '' && bytes(diff) <= limite && { diff }),
    arquivos_alterados: alterados,
  };
}
