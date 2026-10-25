import type { Sql } from 'postgres';
import { MIGRACOES, type Migracao } from './migracoes/index.ts';

// Chave fixa do lock: dois servidores subindo juntos não aplicam a mesma migração duas vezes.
const LOCK_MIGRACOES = 70_262_026;

/** Aplica, numa transação só, as migrações que faltam; devolve os nomes das aplicadas agora. */
export async function migrar(
  sql: Sql,
  migracoes: readonly Migracao[] = MIGRACOES,
): Promise<string[]> {
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${LOCK_MIGRACOES})`;
    await tx`
      CREATE TABLE IF NOT EXISTS migracao (
        nome text PRIMARY KEY,
        aplicada_em timestamptz NOT NULL DEFAULT now()
      )
    `;
    const linhas = await tx<{ nome: string }[]>`SELECT nome FROM migracao`;
    const feitas = new Set(linhas.map((m) => m.nome));
    const aplicadas: string[] = [];
    for (const migracao of migracoes) {
      if (feitas.has(migracao.nome)) continue;
      await tx.unsafe(migracao.sql);
      await tx`INSERT INTO migracao (nome) VALUES (${migracao.nome})`;
      aplicadas.push(migracao.nome);
    }
    return aplicadas;
  });
}
