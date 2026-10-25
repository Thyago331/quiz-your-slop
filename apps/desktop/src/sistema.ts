// A ponte com a camada Rust (src-tauri): o único lugar do Jogo que chama `invoke`. Cada função é um
// dos quatro comandos da lista fechada; os tipos espelham os do Rust (serde) e qualquer outro
// formato é recusado lá.
import { invoke } from '@tauri-apps/api/core';
import type { Idioma } from '@quiz/i18n';

/** As IAs que podem ser o Mestre (spec §7). */
export type Ia = 'claude_code' | 'codex';

export type PedidoMestre = {
  ia: Ia;
  /** A pasta do Projeto (virá do seletor de pastas da Nova Aventura). */
  raiz: string;
  /** Instruções do papel de Mestre + JSON de contexto (docs/contrato-mestre.md). */
  prompt: string;
  /** O JSON Schema da saída da chamada. */
  schema: Record<string, unknown>;
};

/** Os únicos `git` permitidos; `de`/`ate` são `HEAD` ou um hash. */
export type ComandoGit =
  | { tipo: 'rev_parse_head' }
  | { tipo: 'diff_numstat'; de: string; ate: string; caminhos: string[] }
  | { tipo: 'diff'; de: string; ate: string; caminhos: string[] }
  | { tipo: 'ls_files'; caminhos: string[] };

/** O que a camada Rust devolve ao recusar ou falhar (src-tauri/src/erro.rs). */
export type ErroDoSistema =
  | { codigo: 'nao_implementado' }
  | { codigo: 'raiz_invalida'; detalhe: string }
  | { codigo: 'caminho_recusado'; detalhe: string }
  | { codigo: 'argumento_recusado'; detalhe: string }
  | { codigo: 'arquivo_grande'; detalhe: { limite: number } }
  | { codigo: 'nao_eh_texto' }
  | { codigo: 'mestre_ausente'; detalhe: string }
  | { codigo: 'falhou'; detalhe: { codigo: number | null; stderr: string } }
  | { codigo: 'tempo_esgotado'; detalhe: { segundos: number } }
  | { codigo: 'io'; detalhe: string };

const CODIGOS: readonly ErroDoSistema['codigo'][] = [
  'nao_implementado',
  'raiz_invalida',
  'caminho_recusado',
  'argumento_recusado',
  'arquivo_grande',
  'nao_eh_texto',
  'mestre_ausente',
  'falhou',
  'tempo_esgotado',
  'io',
];

export function ehErroDoSistema(e: unknown): e is ErroDoSistema {
  return (
    typeof e === 'object' &&
    e !== null &&
    CODIGOS.includes((e as { codigo?: unknown }).codigo as ErroDoSistema['codigo'])
  );
}

/** Resposta crua da CLI: o envelope JSON do Claude Code ou a última mensagem do Codex. */
export const rodarMestre = (pedido: PedidoMestre) => invoke<string>('rodar_mestre', { pedido });

/** O stdout do `git` (o `ls_files` sai separado por NUL). */
export const rodarGit = (raiz: string, comando: ComandoGit) =>
  invoke<string>('rodar_git', { raiz, comando });

/** Um arquivo de texto do Projeto, pelo caminho relativo à raiz. */
export const lerArquivo = (raiz: string, caminho: string) =>
  invoke<string>('ler_arquivo', { raiz, caminho });

/** Por enquanto sempre recusa com `nao_implementado`. */
export const atualizar = () => invoke<null>('atualizar');

// --- Login no desktop (src-tauri/src/login) ---
// O token fica na camada Rust, no chaveiro do sistema: daqui só se vê se há sessão e o perfil mínimo.

export type Perfil = { login: string; nome: string | null; avatar_url: string | null };

/** `sem_rede`: há um token guardado, mas o site não respondeu agora. */
export type Sessao =
  { estado: 'desconectado' } | { estado: 'conectado'; perfil: Perfil } | { estado: 'sem_rede' };

/** O que os comandos de login devolvem ao recusar ou falhar (src-tauri/src/login/mod.rs). */
export type ErroDeLogin =
  | { codigo: 'cancelado' }
  | { codigo: 'recusado' }
  | { codigo: 'tempo_esgotado'; detalhe: { segundos: number } }
  | { codigo: 'site'; detalhe: { status: number } }
  | {
      codigo: 'argumento_recusado' | 'configuracao' | 'navegador' | 'rede' | 'cofre' | 'io';
      detalhe: string;
    };

const CODIGOS_DE_LOGIN: readonly ErroDeLogin['codigo'][] = [
  'cancelado',
  'recusado',
  'tempo_esgotado',
  'site',
  'argumento_recusado',
  'configuracao',
  'navegador',
  'rede',
  'cofre',
  'io',
];

export function ehErroDeLogin(e: unknown): e is ErroDeLogin {
  return (
    typeof e === 'object' &&
    e !== null &&
    CODIGOS_DE_LOGIN.includes((e as { codigo?: unknown }).codigo as ErroDeLogin['codigo'])
  );
}

/** Abre o navegador no login do site e espera o retorno (até 5 minutos). */
export const entrar = (idioma: Idioma) => invoke<Sessao>('entrar', { idioma });

/** Interrompe o `entrar` em andamento. */
export const cancelarEntrada = () => invoke<null>('cancelar_entrada');

/** Confere no site o token guardado; vencido ou revogado vira `desconectado`. */
export const sessaoAtual = () => invoke<Sessao>('sessao_atual');

/** Revoga o token no site e o apaga do chaveiro. */
export const sair = () => invoke<Sessao>('sair');
