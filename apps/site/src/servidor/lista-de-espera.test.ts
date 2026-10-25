import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { salvarJogador } from './jogador';
import {
  contarInscricoes,
  ehDono,
  inscricaoDoJogador,
  salvarInscricao,
  validarInscricao,
} from './lista-de-espera';
import { migrar } from './migrar';

describe('validarInscricao', () => {
  it('aceita uma IA da lista e descarta o texto de "outra"', () => {
    expect(validarInscricao({ ia: 'gemini', outra: 'ignorado' })).toEqual({
      ok: true,
      inscricao: { ia: 'gemini', outra: null },
    });
  });

  it('pede o nome quando a IA é "outra" e o limpa', () => {
    expect(validarInscricao({ ia: 'outra', outra: '   ' }).ok).toBe(false);
    expect(validarInscricao({ ia: 'outra', outra: null }).ok).toBe(false);
    expect(validarInscricao({ ia: 'outra', outra: '  Aider   CLI ' })).toEqual({
      ok: true,
      inscricao: { ia: 'outra', outra: 'Aider CLI' },
    });
    expect(validarInscricao({ ia: 'outra', outra: 'x'.repeat(81) }).ok).toBe(false);
  });

  it('recusa o que não está na lista', () => {
    expect(validarInscricao({ ia: 'claude', outra: null }).ok).toBe(false);
    expect(validarInscricao({ ia: null, outra: null }).ok).toBe(false);
  });
});

describe('ehDono', () => {
  it('compara o login com DONO_GITHUB_LOGIN sem diferenciar maiúsculas', () => {
    expect(ehDono('Thyago331', { DONO_GITHUB_LOGIN: 'thyago331' })).toBe(true);
    expect(ehDono('outra-pessoa', { DONO_GITHUB_LOGIN: 'thyago331' })).toBe(false);
  });

  it('sem a variável, ninguém é dono', () => {
    expect(ehDono('thyago331', {})).toBe(false);
    expect(ehDono(undefined, { DONO_GITHUB_LOGIN: '' })).toBe(false);
  });
});

// Contra um Postgres de verdade, como o teste do Jogador; sem DATABASE_URL fica de fora.
const url = process.env.DATABASE_URL;
const schema = `teste_lista_${process.pid}_${Date.now()}`;

describe.skipIf(!url)('Lista de espera no Postgres', () => {
  let admin: Sql;
  let sql: Sql;

  beforeAll(async () => {
    admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin.unsafe(`CREATE SCHEMA ${schema}`);
    sql = postgres(url!, { max: 1, onnotice: () => {}, connection: { search_path: schema } });
    await migrar(sql);
  });

  afterAll(async () => {
    await sql?.end();
    await admin?.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin?.end();
  });

  const jogador = (n: number) =>
    salvarJogador(sql, { githubId: n, login: `j${n}`, nome: null, email: null, avatarUrl: null });

  it('guarda uma linha por Jogador e troca a escolha ao reenviar', async () => {
    const { id } = await jogador(1);
    expect(await inscricaoDoJogador(sql, id)).toBeNull();
    await salvarInscricao(sql, id, { ia: 'cursor', outra: null });
    await salvarInscricao(sql, id, { ia: 'outra', outra: 'Aider' });
    expect(await inscricaoDoJogador(sql, id)).toEqual({ ia: 'outra', outra: 'Aider' });
    const [linha] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM lista_de_espera`;
    expect(linha?.n).toBe(1);
  });

  it('conta por IA, com zero para as sem inscrição, e agrupa as "outras"', async () => {
    const [a, b, c] = await Promise.all([jogador(2), jogador(3), jogador(4)]);
    await salvarInscricao(sql, a.id, { ia: 'gemini', outra: null });
    await salvarInscricao(sql, b.id, { ia: 'gemini', outra: null });
    await salvarInscricao(sql, c.id, { ia: 'outra', outra: 'aider' });

    expect(await contarInscricoes(sql)).toEqual({
      porIa: { gemini: 2, cursor: 0, copilot: 0, outra: 2 },
      outras: [{ nome: 'Aider', total: 2 }],
      total: 4,
    });
  });

  it('o banco recusa IA fora da lista', async () => {
    const { id } = await jogador(5);
    await expect(
      sql`INSERT INTO lista_de_espera (jogador_id, ia) VALUES (${id}, 'claude')`,
    ).rejects.toThrow();
  });
});
