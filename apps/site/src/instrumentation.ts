// Roda uma vez quando o servidor sobe (instrumentation do Next): aplica as migrações do Postgres
// antes de atender. Só no runtime Node e só com DATABASE_URL; o build não passa por aqui.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
  const [{ banco }, { migrar }] = await Promise.all([
    import('@/servidor/banco'),
    import('@/servidor/migrar'),
  ]);
  const aplicadas = await migrar(banco());
  if (aplicadas.length) console.log(`migrações aplicadas: ${aplicadas.join(', ')}`);
}
