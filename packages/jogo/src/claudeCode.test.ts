import { describe, expect, it } from 'vitest';
import { desembrulharClaudeCode } from './claudeCode.ts';
import { SaidaInvalida } from './mestre.ts';

// Recorte do envelope real do `claude -p --output-format json --json-schema` (v2.1.310).
const envelope = (campos: Record<string, unknown>) =>
  JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    num_turns: 3,
    result: '{"nome":"soma"}',
    structured_output: { nome: 'soma' },
    session_id: 'x',
    total_cost_usd: 0.05,
    ...campos,
  });

describe('desembrulharClaudeCode', () => {
  it('tira a saída estruturada do envelope', () => {
    expect(JSON.parse(desembrulharClaudeCode(envelope({})))).toEqual({ nome: 'soma' });
  });

  it('sem structured_output, aceita result só se for JSON', () => {
    expect(desembrulharClaudeCode(envelope({ structured_output: undefined }))).toBe(
      '{"nome":"soma"}',
    );
    expect(() =>
      desembrulharClaudeCode(envelope({ structured_output: undefined, result: 'Não posso.' })),
    ).toThrow(SaidaInvalida);
  });

  it('envelope de erro ou que não é JSON vira SaidaInvalida (vale nova tentativa)', () => {
    for (const ruim of [
      envelope({ is_error: true, subtype: 'error_max_turns', structured_output: undefined }),
      envelope({ subtype: 'error_max_structured_output_retries' }),
      'Usage: claude ...',
      '[1]',
    ]) {
      expect(() => desembrulharClaudeCode(ruim)).toThrow(SaidaInvalida);
    }
  });
});
