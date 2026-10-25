// Os dois Mestres atrás da mesma interface (`Transporte`): cada adaptador ajusta o schema ao que a
// CLI aceita e tira a saída do que ela devolve. Quem roda a CLI (camada Rust no desktop, um fake
// nos testes) só recebe a IA, o prompt e o schema já ajustado.
import { desembrulharClaudeCode } from './claudeCode.ts';
import { desembrulharCodex, esquemaEstrito } from './codex.ts';
import type { IaDoMestre } from './criacao.ts';
import type { Esquema } from './esquema.ts';
import type { Transporte } from './mestre.ts';

/** Roda a CLI da IA com o prompt no stdin e devolve a resposta crua (envelope ou última mensagem). */
export type RodarCli = (pedido: {
  ia: IaDoMestre;
  prompt: string;
  schema: Esquema;
}) => Promise<string>;

export function adaptadorDoMestre(ia: IaDoMestre, rodar: RodarCli): Transporte {
  if (ia === 'codex') {
    return async ({ prompt, schema }) =>
      desembrulharCodex(await rodar({ ia, prompt, schema: esquemaEstrito(schema) }), schema);
  }
  return async ({ prompt, schema }) => desembrulharClaudeCode(await rodar({ ia, prompt, schema }));
}
