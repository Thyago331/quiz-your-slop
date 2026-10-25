import { createHash, randomBytes } from 'node:crypto';
import type { Sql } from 'postgres';

// Login no Jogo desktop (spec §10), no desenho de app nativo do RFC 8252: o Jogo abre o navegador
// nesta página com `porta`, `estado` e `desafio` (PKCE S256); o Jogador confirma; o navegador volta a
// http://127.0.0.1:<porta>/retorno com um código de uso único; o Jogo troca o código, mostrando o
// verificador do desafio, por um token. O token não passa pelo navegador (não fica no histórico) e
// um código interceptado não serve a quem não tem o verificador.

/** Quanto vale o token do desktop. Sair no Jogo revoga antes disso. */
export const VALIDADE_DO_TOKEN_EM_DIAS = 90;
/** Quanto o código do redirect espera pela troca. */
export const VALIDADE_DO_CODIGO_EM_SEGUNDOS = 300;

const PREFIXO_DO_TOKEN = 'qys_';
// 32 bytes em base64url, sem preenchimento: o formato do token, do código, do verificador e do desafio.
const SEGREDO = /^[A-Za-z0-9_-]{43}$/;
const ESTADO = /^[A-Za-z0-9_-]{16,128}$/;

const segredo = () => randomBytes(32).toString('base64url');
const hashDe = (valor: string) => createHash('sha256').update(valor).digest('hex');
/** O desafio PKCE (S256) de um verificador. */
export const desafioDe = (verificador: string) =>
  createHash('sha256').update(verificador).digest('base64url');

const ehToken = (token: string) =>
  token.startsWith(PREFIXO_DO_TOKEN) && SEGREDO.test(token.slice(PREFIXO_DO_TOKEN.length));

export type PedidoDeConexao = { porta: number; estado: string; desafio: string };

type Parametro = string | string[] | undefined;
const unico = (p: Parametro) => (typeof p === 'string' ? p : undefined);

/**
 * Os parâmetros que o Jogo põe na URL da página de conexão. A porta é a do servidor de loopback
 * dele (nunca uma privilegiada); o host do retorno é fixo, então não há como mandar o código para
 * outra máquina.
 */
export function lerPedidoDeConexao(params: {
  porta?: Parametro;
  estado?: Parametro;
  desafio?: Parametro;
}): PedidoDeConexao | null {
  const porta = unico(params.porta);
  const estado = unico(params.estado);
  const desafio = unico(params.desafio);
  if (!porta || !/^[1-9][0-9]{3,4}$/.test(porta)) return null;
  const numero = Number(porta);
  if (numero < 1024 || numero > 65_535) return null;
  if (!estado || !ESTADO.test(estado) || !desafio || !SEGREDO.test(desafio)) return null;
  return { porta: numero, estado, desafio };
}

/** Os parâmetros de volta à página de conexão (para o `?de=` do login). */
export function consultaDoPedido({ porta, estado, desafio }: PedidoDeConexao): string {
  return new URLSearchParams({ porta: String(porta), estado, desafio }).toString();
}

/** Para onde o navegador volta: sempre 127.0.0.1, na porta do Jogo, com o `estado` dele de volta. */
export function urlDeRetorno(
  { porta, estado }: PedidoDeConexao,
  resultado: { codigo: string } | { erro: 'recusado' },
): string {
  const url = new URL(`http://127.0.0.1:${porta}/retorno`);
  if ('codigo' in resultado) url.searchParams.set('codigo', resultado.codigo);
  else url.searchParams.set('erro', resultado.erro);
  url.searchParams.set('estado', estado);
  return url.toString();
}

/** Cria o código de uso único do redirect, preso ao desafio do Jogo. */
export async function emitirCodigo(sql: Sql, jogadorId: string, desafio: string): Promise<string> {
  const codigo = segredo();
  // Limpeza de passagem: códigos vencidos não servem para nada.
  await sql`DELETE FROM codigo_desktop WHERE expira_em < now()`;
  await sql`
    INSERT INTO codigo_desktop (hash, jogador_id, desafio, expira_em)
    VALUES (${hashDe(codigo)}, ${jogadorId}, ${desafio},
      now() + make_interval(secs => ${VALIDADE_DO_CODIGO_EM_SEGUNDOS}))
  `;
  return codigo;
}

export type TokenEmitido = { token: string; expiraEm: Date };

/**
 * Troca o código pelo token. O código é apagado na primeira tentativa, certa ou errada: não dá para
 * adivinhar o verificador tentando de novo.
 */
export async function trocarCodigo(
  sql: Sql,
  codigo: string,
  verificador: string,
): Promise<TokenEmitido | null> {
  if (!SEGREDO.test(codigo) || !SEGREDO.test(verificador)) return null;
  const [linha] = await sql<{ jogador_id: string; desafio: string; valido: boolean }[]>`
    DELETE FROM codigo_desktop WHERE hash = ${hashDe(codigo)}
    RETURNING jogador_id, desafio, expira_em > now() AS valido
  `;
  if (!linha?.valido || desafioDe(verificador) !== linha.desafio) return null;
  return emitirToken(sql, linha.jogador_id);
}

async function emitirToken(sql: Sql, jogadorId: string): Promise<TokenEmitido> {
  const token = PREFIXO_DO_TOKEN + segredo();
  const [linha] = await sql<{ expira_em: Date }[]>`
    INSERT INTO token_desktop (jogador_id, hash, expira_em)
    VALUES (${jogadorId}, ${hashDe(token)}, now() + make_interval(days => ${VALIDADE_DO_TOKEN_EM_DIAS}))
    RETURNING expira_em
  `;
  if (!linha) throw new Error('emitirToken: o banco não devolveu o token');
  return { token, expiraEm: linha.expira_em };
}

/** O Jogador dono de um token válido (nem vencido, nem revogado); senão, null. */
export async function jogadorDoToken(sql: Sql, token: string): Promise<string | null> {
  if (!ehToken(token)) return null;
  const [linha] = await sql<{ jogador_id: string }[]>`
    SELECT jogador_id FROM token_desktop
    WHERE hash = ${hashDe(token)} AND revogado_em IS NULL AND expira_em > now()
  `;
  return linha?.jogador_id ?? null;
}

export type PerfilDoDesktop = { login: string; nome: string | null; avatar_url: string | null };

/** O mínimo que o Jogo mostra de quem está conectado. */
export async function perfilDoToken(sql: Sql, token: string): Promise<PerfilDoDesktop | null> {
  if (!ehToken(token)) return null;
  const [linha] = await sql<PerfilDoDesktop[]>`
    SELECT j.login, j.nome, j.avatar_url FROM token_desktop t JOIN jogador j ON j.id = t.jogador_id
    WHERE t.hash = ${hashDe(token)} AND t.revogado_em IS NULL AND t.expira_em > now()
  `;
  return linha ? { login: linha.login, nome: linha.nome, avatar_url: linha.avatar_url } : null;
}

/** Revoga o token (o "Sair" do Jogo). Revogar de novo não faz nada. */
export async function revogarToken(sql: Sql, token: string): Promise<void> {
  if (!ehToken(token)) return;
  await sql`
    UPDATE token_desktop SET revogado_em = now()
    WHERE hash = ${hashDe(token)} AND revogado_em IS NULL
  `;
}

/**
 * O token de um cabeçalho `Authorization: Bearer <token>`: `undefined` sem o cabeçalho (vale a
 * sessão do site), `null` se ele veio mas não é Bearer.
 */
export function lerBearer(cabecalho: string | null): string | null | undefined {
  if (cabecalho === null) return undefined;
  const achado = /^Bearer ([^\s]+)$/i.exec(cabecalho.trim());
  return achado?.[1] ?? null;
}

/**
 * Quem faz o pedido: pelo token do desktop, se veio `Authorization`, senão pela sessão do site. Um
 * `Authorization` inválido é 401, sem cair na sessão.
 */
export async function jogadorDoPedido(
  banco: () => Sql,
  autorizacao: string | null,
  sessao: () => Promise<string | null>,
): Promise<string | null> {
  const token = lerBearer(autorizacao);
  if (token === undefined) return sessao();
  return token ? jogadorDoToken(banco(), token) : null;
}

export type RespostaDoDesktop = { status: number; corpo: unknown };

const NAO_AUTORIZADO: RespostaDoDesktop = { status: 401, corpo: { erro: 'token inválido' } };

/** POST /api/desktop/token: `{ codigo, verificador }` → `{ token, expira_em }`. */
export async function responderTroca(banco: () => Sql, corpo: string): Promise<RespostaDoDesktop> {
  if (corpo.length > 1024) return { status: 413, corpo: { erro: 'corpo grande demais' } };
  let dado: unknown;
  try {
    dado = JSON.parse(corpo);
  } catch {
    return { status: 400, corpo: { erro: 'corpo não é JSON' } };
  }
  const { codigo, verificador } = (dado ?? {}) as Record<string, unknown>;
  if (typeof codigo !== 'string' || typeof verificador !== 'string')
    return { status: 400, corpo: { erro: 'faltam codigo e verificador' } };
  const emitido = await trocarCodigo(banco(), codigo, verificador);
  if (!emitido) return { status: 400, corpo: { erro: 'código inválido' } };
  return {
    status: 200,
    corpo: { token: emitido.token, expira_em: emitido.expiraEm.toISOString() },
  };
}

/** GET /api/desktop/eu: o perfil mínimo do dono do token. */
export async function responderEu(
  banco: () => Sql,
  autorizacao: string | null,
): Promise<RespostaDoDesktop> {
  const token = lerBearer(autorizacao);
  if (!token) return NAO_AUTORIZADO;
  const perfil = await perfilDoToken(banco(), token);
  return perfil ? { status: 200, corpo: perfil } : NAO_AUTORIZADO;
}

/** POST /api/desktop/sair: revoga o token; sempre 204 para um Bearer (sair duas vezes é sair). */
export async function responderSair(
  banco: () => Sql,
  autorizacao: string | null,
): Promise<RespostaDoDesktop> {
  const token = lerBearer(autorizacao);
  if (!token) return NAO_AUTORIZADO;
  await revogarToken(banco(), token);
  return { status: 204, corpo: null };
}
