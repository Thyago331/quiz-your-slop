import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { salvarJogador, type PerfilGithub } from './jogador';
import { migrar } from './migrar';

// Contra um Postgres de verdade (compose.dev.yaml); sem DATABASE_URL, como na CI, fica de fora.
// Cada execução usa um schema descartável, então não suja o banco de desenvolvimento.
const url = process.env.DATABASE_URL;
const schema = `teste_${process.pid}_${Date.now()}`;

describe.skipIf(!url)('Jogador no Postgres', () => {
  let admin: Sql;
  let sql: Sql;

  beforeAll(async () => {
    admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin.unsafe(`CREATE SCHEMA ${schema}`);
    sql = postgres(url!, { max: 1, onnotice: () => {}, connection: { search_path: schema } });
  });

  afterAll(async () => {
    await sql?.end();
    await admin?.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin?.end();
  });

  it('migra uma vez só', async () => {
    expect(await migrar(sql)).toEqual(['0001-jogador', '0002-lista-de-espera', '0003-progresso']);
    expect(await migrar(sql)).toEqual([]);
  });

  it('cria o Jogador no primeiro login e atualiza nos seguintes', async () => {
    const perfil: PerfilGithub = {
      githubId: 4242,
      login: 'taverneira',
      nome: 'Taverneira',
      email: null,
      avatarUrl: 'https://avatars.githubusercontent.com/u/4242',
    };
    const primeiro = await salvarJogador(sql, perfil);
    const depois = await salvarJogador(sql, {
      ...perfil,
      login: 'taverneira-chefe',
      email: 'chefe@taverna.example',
    });

    expect(depois.id).toBe(primeiro.id);
    const linhas = await sql`SELECT github_id, login, email FROM jogador`;
    expect(linhas).toEqual([
      { github_id: '4242', login: 'taverneira-chefe', email: 'chefe@taverna.example' },
    ]);
  });
});
