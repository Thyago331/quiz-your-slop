// O envelope do `claude -p --output-format json --json-schema` (conferido na v2.1.310):
// `{ "type": "result", "subtype": "success", "is_error": false, "result": "<texto>",
//    "structured_output": { ... }, ... }`. A saída validada vem em `structured_output`; ela pode
// faltar (recusa, limite de tentativas da própria CLI), e aí `result` só serve se for o JSON.
import { SaidaInvalida } from './mestre.ts';

/** O JSON da saída do Mestre, como texto; envelope sem saída é `SaidaInvalida` (nova tentativa). */
export function desembrulharClaudeCode(stdout: string): string {
  let envelope: unknown;
  try {
    envelope = JSON.parse(stdout);
  } catch {
    throw new SaidaInvalida(['a CLI não devolveu o envelope JSON']);
  }
  if (typeof envelope !== 'object' || envelope === null || Array.isArray(envelope)) {
    throw new SaidaInvalida(['envelope da CLI fora do formato']);
  }
  const e = envelope as Record<string, unknown>;
  if (e.is_error === true || (typeof e.subtype === 'string' && e.subtype !== 'success')) {
    const motivo = typeof e.result === 'string' && e.result ? e.result : String(e.subtype);
    throw new SaidaInvalida([`a CLI encerrou com erro: ${motivo.slice(0, 300)}`]);
  }
  if (typeof e.structured_output === 'object' && e.structured_output !== null) {
    return JSON.stringify(e.structured_output);
  }
  if (typeof e.result === 'string') {
    try {
      JSON.parse(e.result);
      return e.result;
    } catch {
      // cai no erro abaixo
    }
  }
  throw new SaidaInvalida(['a CLI não devolveu a saída estruturada']);
}
