import { randomBytes } from 'node:crypto';
import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { EnvioDeProgresso } from '@quiz/jogo';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { destinoSeguro } from './destino';
import {
  consultaDoPedido,
  desafioDe,
  emitirCodigo,
  jogadorDoPedido,
  jogadorDoToken,
  lerBearer,
  lerPedidoDeConexao,
  perfilDoToken,
  responderEu,
  responderSair,
  responderTroca,
  revogarToken,
  trocarCodigo,
  urlDeRetorno,
} from './desktop';
import { salvarJogador } from './jogador';
import { migrar } from './migrar';
import { responderProgresso } from './progresso';

// Exemplo do RFC 7636 (apêndice B).
const VERIFICADOR = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const DESAFIO = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
const ESTADO = 'n0nc3-d0-j0g0_123';

const semBanco = (): Sql => {
  throw new Error('não era para abrir o banco');
};

describe('pedido de conexão do desktop', () => {
  const ok = { porta: '49152', estado: ESTADO, desafio: DESAFIO };

  it('aceita porta 1024–65535, estado e desafio no formato', () => {
    expect(lerPedidoDeConexao(ok)).toEqual({ porta: 49152, estado: ESTADO, desafio: DESAFIO });
    expect(lerPedidoDeConexao({ ...ok, porta: '1024' })?.porta).toBe(1024);
    expect(lerPedidoDeConexao({ ...ok, porta: '65535' })?.porta).toBe(65535);
  });

  it('recusa porta fora da faixa ou que não é um inteiro simples', () => {
    for (const porta of [
      '',
      '80',
      '1023',
      '65536',
      '99999',
      '0x50',
      '3000.5',
      '03000',
      ' 3000',
      '-1',
    ])
      expect(lerPedidoDeConexao({ ...ok, porta }), porta).toBeNull();
    expect(lerPedidoDeConexao({ ...ok, porta: ['3000', '4000'] })).toBeNull();
    expect(lerPedidoDeConexao({ estado: ESTADO, desafio: DESAFIO })).toBeNull();
  });

  it('recusa estado ou desafio fora do formato', () => {
    for (const estado of ['curto', 'a'.repeat(129), 'com espaço aqui!!', 'x&codigo=1234567890'])
      expect(lerPedidoDeConexao({ ...ok, estado }), estado).toBeNull();
    for (const desafio of ['', DESAFIO.slice(1), `${DESAFIO}=`, DESAFIO.replace('E', '+')])
      expect(lerPedidoDeConexao({ ...ok, desafio }), desafio).toBeNull();
  });

  it('o retorno vai sempre a 127.0.0.1/retorno, com o estado de volta', () => {
    const pedido = lerPedidoDeConexao(ok)!;
    expect(urlDeRetorno(pedido, { codigo: 'abc' })).toBe(
      `http://127.0.0.1:49152/retorno?codigo=abc&estado=${ESTADO}`,
    );
    expect(urlDeRetorno(pedido, { erro: 'recusado' })).toBe(
      `http://127.0.0.1:49152/retorno?erro=recusado&estado=${ESTADO}`,
    );
  });

  it('sem sessão, o login volta à mesma página de conexão', () => {
    const pedido = lerPedidoDeConexao(ok)!;
    const login = caminhoDoLogin('en', `/entrar/desktop?${consultaDoPedido(pedido)}`);
    const de = new URL(login, 'http://site').searchParams.get('de');
    expect(destinoSeguro(de ?? undefined)).toBe(
      `/en/entrar/desktop?porta=49152&estado=${ESTADO}&desafio=${DESAFIO}`,
    );
  });

  it('o desafio é o S256 do verificador (RFC 7636)', () => {
    expect(desafioDe(VERIFICADOR)).toBe(DESAFIO);
  });
});

describe('autenticação por Bearer', () => {
  it('lê o cabeçalho Authorization', () => {
    expect(lerBearer(null)).toBeUndefined();
    expect(lerBearer('Bearer qys_abc')).toBe('qys_abc');
    expect(lerBearer('bearer qys_abc')).toBe('qys_abc');
    for (const ruim of ['', 'Basic dXNlcg==', 'Bearer', 'Bearer a b', 'qys_abc'])
      expect(lerBearer(ruim), ruim).toBeNull();
  });

  it('sem Authorization vale a sessão; com Authorization ruim é ninguém, sem cair na sessão', async () => {
    const sessao = vi.fn(async () => 'da-sessao');
    expect(await jogadorDoPedido(semBanco, null, sessao)).toBe('da-sessao');
    expect(await jogadorDoPedido(semBanco, 'Basic x', sessao)).toBeNull();
    // Token fora do formato nem abre o banco.
    expect(await jogadorDoPedido(() => ({}) as Sql, 'Bearer nao-e-token', sessao)).toBeNull();
    expect(sessao).toHaveBeenCalledTimes(1);
  });

  it('a API do desktop recusa sem Bearer e pedidos de troca malformados, sem abrir o banco', async () => {
    expect((await responderEu(semBanco, null)).status).toBe(401);
    expect((await responderSair(semBanco, 'Basic x')).status).toBe(401);
    expect((await responderTroca(semBanco, '{')).status).toBe(400);
    expect((await responderTroca(semBanco, '{"codigo":1}')).status).toBe(400);
    expect((await responderTroca(semBanco, 'x'.repeat(2000))).status).toBe(413);
  });
});

// Contra um Postgres de verdade (compose.dev.yaml), num schema descartável; sem DATABASE_URL fica
// de fora.
const url = process.env.DATABASE_URL;
const schema = `teste_desktop_${process.pid}_${Date.now()}`;

describe.skipIf(!url)('token do desktop no Postgres', () => {
  let admin: Sql;
  let sql: Sql;
  let jogadorId: string;
  const banco = () => sql;
  const verificador = () => randomBytes(32).toString('base64url');

  /** O caminho inteiro: código preso ao desafio e troca com o verificador. */
  async function conectar() {
    const v = verificador();
    const codigo = await emitirCodigo(sql, jogadorId, desafioDe(v));
    const emitido = await trocarCodigo(sql, codigo, v);
    if (!emitido) throw new Error('a troca falhou');
    return emitido;
  }

  beforeAll(async () => {
    admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin.unsafe(`CREATE SCHEMA ${schema}`);
    sql = postgres(url!, { max: 2, onnotice: () => {}, connection: { search_path: schema } });
    await migrar(sql);
    const jogador = await salvarJogador(sql, {
      githubId: 3333,
      login: 'viajante',
      nome: 'Viajante',
      email: 'v@example.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/3333',
    });
    jogadorId = jogador.id;
  });

  afterAll(async () => {
    await sql?.end();
    await admin?.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin?.end();
  });

  it('troca o código pelo token, que identifica o Jogador por 90 dias', async () => {
    const { token, expiraEm } = await conectar();
    expect(token).toMatch(/^qys_[A-Za-z0-9_-]{43}$/);
    const dias = (expiraEm.getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(89.9);
    expect(dias).toBeLessThan(90.1);
    expect(await jogadorDoToken(sql, token)).toBe(jogadorId);
    expect(await perfilDoToken(sql, token)).toEqual({
      login: 'viajante',
      nome: 'Viajante',
      avatar_url: 'https://avatars.githubusercontent.com/u/3333',
    });
  });

  it('o banco guarda só o hash do token e do código', async () => {
    const v = verificador();
    const codigo = await emitirCodigo(sql, jogadorId, desafioDe(v));
    const codigos = await sql<{ hash: string }[]>`SELECT hash FROM codigo_desktop`;
    expect(codigos.some((c) => c.hash === codigo)).toBe(false);
    const emitido = await trocarCodigo(sql, codigo, v);
    const tokens = await sql<{ hash: string }[]>`SELECT hash FROM token_desktop`;
    expect(tokens.every((t) => /^[0-9a-f]{64}$/.test(t.hash))).toBe(true);
    expect(tokens.some((t) => t.hash.includes(emitido!.token.slice(4)))).toBe(false);
  });

  it('o código vale uma vez só, e só com o verificador do desafio', async () => {
    const v = verificador();
    const codigo = await emitirCodigo(sql, jogadorId, desafioDe(v));
    // Verificador errado consome o código: tentar de novo com o certo não adianta.
    expect(await trocarCodigo(sql, codigo, verificador())).toBeNull();
    expect(await trocarCodigo(sql, codigo, v)).toBeNull();

    const outro = await emitirCodigo(sql, jogadorId, desafioDe(v));
    expect(await trocarCodigo(sql, outro, v)).not.toBeNull();
    expect(await trocarCodigo(sql, outro, v)).toBeNull();
  });

  it('código vencido não troca', async () => {
    const v = verificador();
    const codigo = await emitirCodigo(sql, jogadorId, desafioDe(v));
    await sql`UPDATE codigo_desktop SET expira_em = now() - interval '1 second'`;
    expect(await trocarCodigo(sql, codigo, v)).toBeNull();
  });

  it('pela API: troca, perfil, sair e 401 depois de sair', async () => {
    const v = verificador();
    const codigo = await emitirCodigo(sql, jogadorId, desafioDe(v));
    const troca = await responderTroca(banco, JSON.stringify({ codigo, verificador: v }));
    expect(troca.status).toBe(200);
    const { token, expira_em } = troca.corpo as { token: string; expira_em: string };
    expect(new Date(expira_em).getTime()).toBeGreaterThan(Date.now());
    const bearer = `Bearer ${token}`;
    expect(await responderEu(banco, bearer)).toMatchObject({
      status: 200,
      corpo: { login: 'viajante' },
    });
    expect((await responderSair(banco, bearer)).status).toBe(204);
    expect((await responderEu(banco, bearer)).status).toBe(401);
    // Sair de novo continua sendo sair.
    expect((await responderSair(banco, bearer)).status).toBe(204);
    expect(await jogadorDoToken(sql, token)).toBeNull();
  });

  it('revogar um token não mexe nos outros aparelhos', async () => {
    const a = await conectar();
    const b = await conectar();
    await revogarToken(sql, a.token);
    expect(await jogadorDoToken(sql, a.token)).toBeNull();
    expect(await jogadorDoToken(sql, b.token)).toBe(jogadorId);
  });

  it('token vencido não vale', async () => {
    const { token } = await conectar();
    await sql`UPDATE token_desktop SET expira_em = now() - interval '1 second'`;
    expect(await jogadorDoToken(sql, token)).toBeNull();
    expect((await responderEu(banco, `Bearer ${token}`)).status).toBe(401);
  });

  it('a API de progresso aceita o Bearer do desktop no GET e no PUT', async () => {
    const { token } = await conectar();
    const semSessao = async () => null;
    const quem = (autorizacao: string | null) => jogadorDoPedido(banco, autorizacao, semSessao);
    const envio: EnvioDeProgresso = {
      xp: 40,
      titulo: 'Comitador Cego',
      estatisticas: { expedicoes: 1, acertos: 2, contestacoes_vencidas: 0 },
      aventuras: [{ id: 'tutorial', progresso: 10, classe: 'backend' }],
    };
    const jogadorDoBearer = await quem(`Bearer ${token}`);
    expect(jogadorDoBearer).toBe(jogadorId);
    const put = await responderProgresso(banco, {
      metodo: 'PUT',
      jogadorId: jogadorDoBearer,
      corpo: JSON.stringify(envio),
    });
    expect(put).toEqual({ status: 200, corpo: envio });
    expect(await responderProgresso(banco, { metodo: 'GET', jogadorId: jogadorDoBearer })).toEqual({
      status: 200,
      corpo: envio,
    });

    await revogarToken(sql, token);
    const depois = await quem(`Bearer ${token}`);
    expect((await responderProgresso(banco, { metodo: 'GET', jogadorId: depois })).status).toBe(
      401,
    );
    expect(
      (await responderProgresso(banco, { metodo: 'GET', jogadorId: await quem(null) })).status,
    ).toBe(401);
  });

  it('apagar o Jogador apaga os tokens dele', async () => {
    const outro = await salvarJogador(sql, {
      githubId: 4444,
      login: 'passageiro',
      nome: null,
      email: null,
      avatarUrl: null,
    });
    const v = verificador();
    const codigo = await emitirCodigo(sql, outro.id, desafioDe(v));
    const { token } = (await trocarCodigo(sql, codigo, v))!;
    await sql`DELETE FROM jogador WHERE id = ${outro.id}`;
    expect(await jogadorDoToken(sql, token)).toBeNull();
  });
});
