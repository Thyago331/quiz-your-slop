import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  atualizar,
  carregarAventuras,
  comandoDoMestre,
  detectarMestre,
  ehErroDoSistema,
  escolherPasta,
  lerArquivo,
  rodarGit,
  rodarMestre,
  salvarAventura,
} from './sistema.ts';
import { cancelarEntrada, ehErroDeLogin, entrar, sair, sessaoAtual } from './sistema.ts';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(async () => '') }));
const chamada = () => vi.mocked(invoke).mock.calls.at(-1);

describe('sistema', () => {
  beforeEach(() => vi.mocked(invoke).mockClear());

  it('cada função chama o seu comando, com os nomes de argumento do Rust', async () => {
    const schema = { type: 'object' };
    await rodarMestre({ ia: 'codex', raiz: '/p', prompt: 'oi', schema });
    expect(chamada()).toEqual([
      'rodar_mestre',
      { pedido: { ia: 'codex', raiz: '/p', prompt: 'oi', schema } },
    ]);
    await rodarGit('/p', { tipo: 'rev_parse_head' });
    expect(chamada()).toEqual(['rodar_git', { raiz: '/p', comando: { tipo: 'rev_parse_head' } }]);
    await lerArquivo('/p', 'src/a.ts');
    expect(chamada()).toEqual(['ler_arquivo', { raiz: '/p', caminho: 'src/a.ts' }]);
    await atualizar();
    expect(chamada()).toEqual(['atualizar']);
    await escolherPasta();
    expect(chamada()).toEqual(['escolher_pasta']);
    await detectarMestre('claude_code');
    expect(chamada()).toEqual(['detectar_mestre', { ia: 'claude_code' }]);
    await comandoDoMestre('claude_code', '/a', ['/b']);
    expect(chamada()).toEqual([
      'comando_do_mestre',
      { ia: 'claude_code', raiz: '/a', raizesExtras: ['/b'] },
    ]);
    await salvarAventura('id', '{}');
    expect(chamada()).toEqual(['salvar_aventura', { id: 'id', json: '{}' }]);
    await carregarAventuras();
    expect(chamada()).toEqual(['carregar_aventuras']);
  });

  it('reconhece os erros da camada Rust', () => {
    expect(ehErroDoSistema({ codigo: 'nao_implementado' })).toBe(true);
    expect(ehErroDoSistema({ codigo: 'caminho_recusado', detalhe: '../x' })).toBe(true);
    expect(ehErroDoSistema({ codigo: 'outro' })).toBe(false);
    expect(ehErroDoSistema('falhou')).toBe(false);
  });
});

describe('sistema: login', () => {
  beforeEach(() => vi.mocked(invoke).mockClear());

  it('cada função chama o seu comando de login', async () => {
    await entrar('es');
    expect(chamada()).toEqual(['entrar', { idioma: 'es' }]);
    await cancelarEntrada();
    expect(chamada()).toEqual(['cancelar_entrada']);
    await sessaoAtual();
    expect(chamada()).toEqual(['sessao_atual']);
    await sair();
    expect(chamada()).toEqual(['sair']);
  });

  it('reconhece os erros do login', () => {
    expect(ehErroDeLogin({ codigo: 'cancelado' })).toBe(true);
    expect(ehErroDeLogin({ codigo: 'site', detalhe: { status: 401 } })).toBe(true);
    expect(ehErroDeLogin({ codigo: 'nao_implementado' })).toBe(false);
  });
});
