// A ponte com a camada Rust (src-tauri): o único lugar do Jogo que chama `invoke`. Cada função é um
// dos comandos da lista fechada; os tipos espelham os do Rust (serde) e qualquer outro formato é
// recusado lá.
import { invoke } from '@tauri-apps/api/core';
import type { IaDoMestre } from '@quiz/jogo';

/** As IAs que podem ser o Mestre (spec §7). */
export type Ia = IaDoMestre;

export type PedidoMestre = {
  ia: Ia;
  /** A pasta do Projeto (virá do seletor de pastas da Nova Aventura). */
  raiz: string;
  /** Instruções do papel de Mestre + JSON de contexto (docs/contrato-mestre.md). */
  prompt: string;
  /** O JSON Schema da saída da chamada. */
  schema: Record<string, unknown>;
  /** Os outros repositórios de um Projeto com mais de um (entram só para leitura). */
  raizes_extras?: string[];
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

// Nova Aventura (#34) ---------------------------------------------------------------------------

/** O que a camada Rust sabe da CLI de uma IA (src-tauri/src/mestre.rs, `Deteccao`). */
export type DeteccaoDoMestre =
  | { estado: 'ausente' }
  | { estado: 'sem_modo_restrito'; versao: string; faltando: string[] }
  | { estado: 'pronta'; versao: string };

/** O seletor de pastas do sistema; null se o Jogador cancelou. */
export const escolherPasta = () => invoke<string | null>('escolher_pasta');

export const detectarMestre = (ia: Ia) => invoke<DeteccaoDoMestre>('detectar_mestre', { ia });

/** O comando exato que `rodarMestre` roda nestas pastas (o mesmo montador de argumentos). */
export const comandoDoMestre = (ia: Ia, raiz: string, raizesExtras: string[]) =>
  invoke<string>('comando_do_mestre', { ia, raiz, raizesExtras });

/** Grava a Aventura na pasta de dados do app (nunca no Projeto). */
export const salvarAventura = (id: string, json: string) =>
  invoke<null>('salvar_aventura', { id, json });

/** O conteúdo de cada Aventura guardada, para o Jogo conferir. */
export const carregarAventuras = () => invoke<string[]>('carregar_aventuras');
