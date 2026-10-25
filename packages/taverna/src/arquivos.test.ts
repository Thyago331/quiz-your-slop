import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/gerar.mjs', import.meta.url));
const gerado = fileURLToPath(new URL('./arquivos.gerado.ts', import.meta.url));

describe('arquivos.gerado.ts', () => {
  // O código da Taverna nunca muda depois de publicado: as Evidências dos Desafios apontam para
  // linhas exatas dele. Se este teste falhou, codigo/ mudou — rode `pnpm gerar` e revise as Evidências.
  it('está em dia com codigo/', () => {
    const esperado = execFileSync(process.execPath, [script, '--stdout'], { encoding: 'utf8' });
    expect(readFileSync(gerado, 'utf8')).toBe(esperado);
  });
});
