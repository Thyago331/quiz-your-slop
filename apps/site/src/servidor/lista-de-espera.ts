import type { Sql } from 'postgres';

/** As IAs da lista de espera (spec §2: adaptadores fora do MVP), na ordem da tela. */
export const IAS_DA_LISTA = ['gemini', 'cursor', 'copilot', 'outra'] as const;
export type IaDaLista = (typeof IAS_DA_LISTA)[number];

export const TAMANHO_MAXIMO_OUTRA = 80;

export type Inscricao = { ia: IaDaLista; outra: string | null };

export type Validacao = { ok: true; inscricao: Inscricao } | { ok: false; erro: string };

/** O que veio do formulário vira uma Inscrição ou um erro para mostrar ao Jogador. */
export function validarInscricao(dados: { ia: unknown; outra: unknown }): Validacao {
  const ia = IAS_DA_LISTA.find((i) => i === dados.ia);
  if (!ia) return { ok: false, erro: 'Escolha uma das IAs da lista.' };
  if (ia !== 'outra') return { ok: true, inscricao: { ia, outra: null } };
  const outra = typeof dados.outra === 'string' ? dados.outra.trim().replace(/\s+/g, ' ') : '';
  if (!outra) return { ok: false, erro: 'Diga qual é a outra IA.' };
  if (outra.length > TAMANHO_MAXIMO_OUTRA)
    return { ok: false, erro: `Use até ${TAMANHO_MAXIMO_OUTRA} caracteres.` };
  return { ok: true, inscricao: { ia, outra } };
}

/** Uma linha por Jogador: reenviar troca a escolha. */
export async function salvarInscricao(
  sql: Sql,
  jogadorId: string,
  inscricao: Inscricao,
): Promise<void> {
  await sql`
    INSERT INTO lista_de_espera (jogador_id, ia, outra)
    VALUES (${jogadorId}, ${inscricao.ia}, ${inscricao.outra})
    ON CONFLICT (jogador_id) DO UPDATE SET
      ia = EXCLUDED.ia,
      outra = EXCLUDED.outra,
      atualizado_em = now()
  `;
}

export async function inscricaoDoJogador(sql: Sql, jogadorId: string): Promise<Inscricao | null> {
  const [linha] = await sql<Inscricao[]>`
    SELECT ia, outra FROM lista_de_espera WHERE jogador_id = ${jogadorId}
  `;
  return linha ?? null;
}

export type Contagem = {
  /** Todas as IAs da lista, inclusive as com zero. */
  porIa: Record<IaDaLista, number>;
  /** O que escreveram em "outra", agrupado sem diferenciar maiúsculas. */
  outras: { nome: string; total: number }[];
  total: number;
};

/** A contagem por IA que o dono do projeto vê. */
export async function contarInscricoes(sql: Sql): Promise<Contagem> {
  const linhas = await sql<{ ia: IaDaLista; total: number }[]>`
    SELECT ia, count(*)::int AS total FROM lista_de_espera GROUP BY ia
  `;
  const outras = await sql<{ nome: string; total: number }[]>`
    SELECT min(outra) AS nome, count(*)::int AS total
    FROM lista_de_espera
    WHERE ia = 'outra'
    GROUP BY lower(outra)
    ORDER BY total DESC, nome
  `;
  const porIa = Object.fromEntries(IAS_DA_LISTA.map((ia) => [ia, 0])) as Record<IaDaLista, number>;
  for (const l of linhas) porIa[l.ia] = l.total;
  return {
    porIa,
    outras: outras.map((o) => ({ nome: o.nome, total: o.total })),
    total: linhas.reduce((s, l) => s + l.total, 0),
  };
}

/** O dono do projeto é o login do GitHub em DONO_GITHUB_LOGIN; sem ela, ninguém. */
export function ehDono(
  login: string | undefined,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const dono = env.DONO_GITHUB_LOGIN?.trim().toLowerCase();
  return !!dono && !!login && login.toLowerCase() === dono;
}
