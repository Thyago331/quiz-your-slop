import { describe, expect, it } from 'vitest';
import { conferirEvidencia } from './evidencia.ts';

const arquivos: Record<string, string> = {
  'api/service.ts': 'function a() {\n  return 1;\n}\n\nexport { a };\n',
};
const ler = (caminho: string) => arquivos[caminho];

describe('conferirEvidencia', () => {
  it('aceita trecho idêntico às linhas', () => {
    const ev = {
      caminho: 'api/service.ts',
      linha_inicio: 1,
      linha_fim: 3,
      trecho: 'function a() {\n  return 1;\n}',
    };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: true });
  });

  it('ignora diferenças de espaço e indentação', () => {
    const ev = {
      caminho: 'api/service.ts',
      linha_inicio: 2,
      linha_fim: 3,
      trecho: 'return   1;\r\n}\n',
    };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: true });
  });

  it('recusa arquivo inexistente', () => {
    const ev = { caminho: 'nada.ts', linha_inicio: 1, linha_fim: 1, trecho: '' };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: false, motivo: 'arquivo_inexistente' });
  });

  it('recusa intervalo invertido ou abaixo de 1', () => {
    const invertido = { caminho: 'api/service.ts', linha_inicio: 3, linha_fim: 2, trecho: '' };
    const zero = { caminho: 'api/service.ts', linha_inicio: 0, linha_fim: 1, trecho: '' };
    expect(conferirEvidencia(ler, invertido)).toEqual({ ok: false, motivo: 'intervalo_invalido' });
    expect(conferirEvidencia(ler, zero)).toEqual({ ok: false, motivo: 'intervalo_invalido' });
  });

  it('recusa linha além do fim do arquivo (a quebra final não conta como linha)', () => {
    const ev = { caminho: 'api/service.ts', linha_inicio: 5, linha_fim: 6, trecho: '' };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: false, motivo: 'fora_do_arquivo' });
  });

  it('recusa trecho que não bate com as linhas', () => {
    const ev = { caminho: 'api/service.ts', linha_inicio: 2, linha_fim: 2, trecho: 'return 2;' };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: false, motivo: 'trecho_diferente' });
  });

  it('não confunde espaço removido com espaço diferente', () => {
    const ev = {
      caminho: 'api/service.ts',
      linha_inicio: 1,
      linha_fim: 1,
      trecho: 'functiona() {',
    };
    expect(conferirEvidencia(ler, ev)).toEqual({ ok: false, motivo: 'trecho_diferente' });
  });
});
