import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { tituloDoXp, type EnvioDeProgresso } from '@quiz/jogo';
import { salvarJogador } from './jogador';
import { migrar } from './migrar';
import { PROGRESSO_ZERADO, progressoDoJogador, responderProgresso } from './progresso';

const UUID = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b';

const envio: EnvioDeProgresso = {
  xp: 140,
  titulo: 'Leitor de Diff',
  estatisticas: { expedicoes: 3, acertos: 7, contestacoes_vencidas: 1 },
  aventuras: [{ id: 'tutorial', progresso: 25, classe: 'fullstack' }],
};

// Os caminhos que respondem antes de tocar no banco não precisam de Postgres.
const semBanco = (): Sql => {
  throw new Error('não era para abrir o banco');
};

describe('API de progresso sem banco', () => {
  it('sem sessão, 401 no GET e no PUT', async () => {
    expect((await responderProgresso(semBanco, { metodo: 'GET', jogadorId: null })).status).toBe(
      401,
    );
    const corpo = JSON.stringify(envio);
    expect(
      (await responderProgresso(semBanco, { metodo: 'PUT', jogadorId: null, corpo })).status,
    ).toBe(401);
  });

  it('corpo que não é JSON, fora da lista ou grande demais é recusado', async () => {
    const put = (corpo: string) =>
      responderProgresso(semBanco, { metodo: 'PUT', jogadorId: UUID, corpo });
    expect((await put('{')).status).toBe(400);
    const comMapa = await put(JSON.stringify({ ...envio, regioes: ['cofre-anao'] }));
    expect(comMapa).toEqual({
      status: 400,
      corpo: { erro: 'campo não permitido: envio.regioes' },
    });
    expect((await put(' '.repeat(20_000))).status).toBe(413);
  });

  it('XP acima do integer do Postgres é 400, não 500', async () => {
    const put = (corpo: string) =>
      responderProgresso(semBanco, { metodo: 'PUT', jogadorId: UUID, corpo });
    const xp = 2_147_483_648;
    const corpo = JSON.stringify({ ...envio, xp, titulo: tituloDoXp(xp).atual.nome });
    expect((await put(corpo)).status).toBe(400);
  });

  it('erro de dado do Postgres (classe 22) vira 400; os outros seguem como erro', async () => {
    const falhando = (code: string) => (): Sql =>
      ({
        begin: () => Promise.reject(Object.assign(new Error('falhou'), { code })),
      }) as unknown as Sql;
    const corpo = JSON.stringify(envio);
    const put = (code: string) =>
      responderProgresso(falhando(code), { metodo: 'PUT', jogadorId: UUID, corpo });
    expect((await put('22003')).status).toBe(400);
    expect((await put('22P02')).status).toBe(400);
    await expect(put('57P01')).rejects.toThrow('falhou');
  });
});

// Contra um Postgres de verdade (compose.dev.yaml), num schema descartável; sem DATABASE_URL fica
// de fora.
const url = process.env.DATABASE_URL;
const schema = `teste_progresso_${process.pid}_${Date.now()}`;

describe.skipIf(!url)('API de progresso no Postgres', () => {
  let admin: Sql;
  let sql: Sql;
  let jogadorId: string;
  const put = (corpo: unknown, id = jogadorId) =>
    responderProgresso(() => sql, { metodo: 'PUT', jogadorId: id, corpo: JSON.stringify(corpo) });
  const get = () => responderProgresso(() => sql, { metodo: 'GET', jogadorId });

  beforeAll(async () => {
    admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin.unsafe(`CREATE SCHEMA ${schema}`);
    sql = postgres(url!, { max: 2, onnotice: () => {}, connection: { search_path: schema } });
    await migrar(sql);
    const jogador = await salvarJogador(sql, {
      githubId: 777,
      login: 'cacadora',
      nome: null,
      email: null,
      avatarUrl: null,
    });
    jogadorId = jogador.id;
  });

  afterAll(async () => {
    await sql?.end();
    await admin?.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin?.end();
  });

  it('antes do primeiro envio, o GET devolve o progresso zerado', async () => {
    expect(await get()).toEqual({ status: 200, corpo: PROGRESSO_ZERADO });
  });

  it('aceita o envio, guarda e devolve; o último envio fica para "O que é enviado"', async () => {
    expect(await put(envio)).toEqual({ status: 200, corpo: envio });
    expect(await get()).toEqual({ status: 200, corpo: envio });
    const guardado = await progressoDoJogador(sql, jogadorId);
    // Exato: mesma ordem de chaves que chegou.
    expect(JSON.stringify(guardado?.ultimoEnvio)).toBe(JSON.stringify(envio));
    expect(guardado?.ultimoEnvioEm).toBeInstanceOf(Date);
  });

  it('recusa campo fora da lista sem mexer no que estava guardado', async () => {
    const vazado = { ...envio, xp: 900, titulo: 'Unslopper', caminho: 'api/src/server.ts' };
    expect((await put(vazado)).status).toBe(400);
    const aninhado = {
      ...envio,
      aventuras: [{ id: 'tutorial', progresso: 99, classe: 'backend', nome: 'Taverna' }],
    };
    expect((await put(aninhado)).status).toBe(400);
    const idComNome = {
      ...envio,
      aventuras: [{ id: 'cofre-anao', progresso: 1, classe: 'backend' }],
    };
    expect((await put(idComNome)).status).toBe(400);
    expect((await get()).corpo).toEqual(envio);
  });

  it('junta: XP e estatísticas só sobem; por Aventura vale o último; as outras ficam', async () => {
    const outroAparelho: EnvioDeProgresso = {
      xp: 60,
      titulo: 'Comitador Cego',
      estatisticas: { expedicoes: 5, acertos: 3, contestacoes_vencidas: 0 },
      aventuras: [{ id: UUID, progresso: 43, classe: 'backend' }],
    };
    expect((await put(outroAparelho)).corpo).toEqual({
      xp: 140,
      titulo: 'Leitor de Diff',
      estatisticas: { expedicoes: 5, acertos: 7, contestacoes_vencidas: 1 },
      aventuras: [
        { id: 'tutorial', progresso: 25, classe: 'fullstack' },
        { id: UUID, progresso: 43, classe: 'backend' },
      ],
    });
    // Recomeçou o Tutorial com outra Classe: o Progresso cai, e tudo bem.
    const recomecou = {
      ...envio,
      aventuras: [{ id: 'tutorial', progresso: 0, classe: 'frontend' }],
    };
    const depois = await put(recomecou);
    expect(depois.corpo).toMatchObject({
      xp: 140,
      aventuras: [
        { id: 'tutorial', progresso: 0, classe: 'frontend' },
        { id: UUID, progresso: 43, classe: 'backend' },
      ],
    });
    // O último envio é o que chegou, não a junção.
    expect((await progressoDoJogador(sql, jogadorId))?.ultimoEnvio).toEqual(recomecou);
  });

  it('envios ao mesmo tempo não se perdem', async () => {
    const respostas = await Promise.all(
      [300, 320].map((xp) => put({ ...envio, xp, titulo: 'Arqueólogo de Código' })),
    );
    expect(respostas.map((r) => r.status)).toEqual([200, 200]);
    expect((await get()).corpo).toMatchObject({ xp: 320, titulo: 'Arqueólogo de Código' });
  });

  it('sessão de um Jogador que não está no banco recebe 401', async () => {
    expect((await put(envio, '00000000-0000-4000-8000-000000000000')).status).toBe(401);
  });
});
