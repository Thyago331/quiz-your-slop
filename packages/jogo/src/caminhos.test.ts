import { describe, expect, it } from 'vitest';
import {
  arquivosDoProjeto,
  caminhoNoProjeto,
  nomearRepositorios,
  normalizarCaminho,
} from './caminhos.ts';

const um = nomearRepositorios(['/home/a/loja']);
const dois = nomearRepositorios(['/home/a/loja-front', 'C:\\trabalho\\loja-api\\']);

describe('nomearRepositorios', () => {
  it('usa o nome da pasta, sem dois-pontos, e desempata repetidos', () => {
    expect(dois.map((r) => r.nome)).toEqual(['loja-front', 'loja-api']);
    expect(nomearRepositorios(['/a/api', '/b/api', '/c/a:b']).map((r) => r.nome)).toEqual([
      'api',
      'api-2',
      'a-b',
    ]);
  });
});

describe('caminhos do Projeto', () => {
  it('só levam prefixo com mais de um repositório', () => {
    expect(caminhoNoProjeto(um, 'loja', 'src/a.ts')).toBe('src/a.ts');
    expect(caminhoNoProjeto(dois, 'loja-api', 'src/a.ts')).toBe('loja-api:src/a.ts');
  });

  it('normaliza o que veio do Mestre', () => {
    const ok = (repos: typeof um, c: string, pasta = false) => {
      const r = normalizarCaminho(repos, c, { pasta });
      return r.ok ? r.caminho : r.motivo;
    };
    expect(ok(um, './src//a.ts')).toBe('src/a.ts');
    expect(ok(um, 'src\\a.ts')).toBe('src/a.ts');
    expect(ok(um, 'loja:src/a.ts')).toBe('src/a.ts');
    expect(ok(um, '.', true)).toBe('.');
    expect(ok(dois, 'loja-api:src/a.ts')).toBe('loja-api:src/a.ts');
    expect(ok(dois, 'loja-api:.', true)).toBe('loja-api:.');
    expect(ok(dois, 'src/a.ts')).toMatch(/sem o prefixo/);
    expect(ok(dois, 'outro:src/a.ts')).toMatch(/desconhecido/);
    expect(ok(um, '/etc/passwd')).toMatch(/absoluto/);
    expect(ok(um, 'C:\\x.ts')).toMatch(/absoluto/);
    expect(ok(um, 'src/../../x')).toMatch(/\.\./);
    expect(ok(um, '.')).toMatch(/vazio/);
  });

  it('junta o ls-files de cada repositório em arquivos e pastas', () => {
    const p = arquivosDoProjeto(dois, {
      'loja-front': 'src/App.tsx\0package.json\0',
      'loja-api': 'src/orders/service.ts\0',
    });
    expect([...p.arquivos]).toEqual([
      'loja-front:src/App.tsx',
      'loja-front:package.json',
      'loja-api:src/orders/service.ts',
    ]);
    expect([...p.pastas]).toEqual([
      'loja-front:.',
      'loja-front:src',
      'loja-api:.',
      'loja-api:src',
      'loja-api:src/orders',
    ]);
  });
});
