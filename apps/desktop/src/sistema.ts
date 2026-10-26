// A ponte com a camada Rust (src-tauri): o único lugar do Jogo que chama `invoke`. Cada função é um
// dos comandos da lista fechada; os tipos espelham os do Rust (serde) e qualquer outro formato é
// recusado lá.
import { Channel, invoke } from '@tauri-apps/api/core';
import type { EnvioDeProgresso, IaDoMestre } from '@quiz/jogo';
import type { Idioma } from '@quiz/i18n';

/** As IAs que podem ser o Mestre (spec §7). */
export type Ia = IaDoMestre;

export type PedidoMestre = {
  ia: Ia;
  /** A pasta do Projeto (escolhida no seletor de pastas ou de uma Aventura guardada). */
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
  | { codigo: 'atualizacao'; detalhe: string }
  | { codigo: 'raiz_invalida'; detalhe: string }
  | { codigo: 'raiz_nao_permitida'; detalhe: string }
  | { codigo: 'caminho_recusado'; detalhe: string }
  | { codigo: 'argumento_recusado'; detalhe: string }
  | { codigo: 'arquivo_grande'; detalhe: { limite: number } }
  | { codigo: 'nao_eh_texto' }
  | { codigo: 'mestre_ausente'; detalhe: string }
  | { codigo: 'sem_modo_restrito'; detalhe: { faltando: string[] } }
  | { codigo: 'falhou'; detalhe: { codigo: number | null; stderr: string } }
  | { codigo: 'tempo_esgotado'; detalhe: { segundos: number } }
  | { codigo: 'io'; detalhe: string };

const CODIGOS: readonly ErroDoSistema['codigo'][] = [
  'atualizacao',
  'raiz_invalida',
  'raiz_nao_permitida',
  'caminho_recusado',
  'argumento_recusado',
  'arquivo_grande',
  'nao_eh_texto',
  'mestre_ausente',
  'sem_modo_restrito',
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

// Atualização automática (src-tauri/src/atualizacao.rs) -------------------------------------------

/** O `latest.json` da última Release tem versão mais nova que esta? */
export type Verificacao =
  | { disponivel: false; versao: null; notas: null }
  | { disponivel: true; versao: string; notas: string | null };

/** `porcentagem` é null quando o tamanho do download não é conhecido. */
export type ProgressoDaAtualizacao =
  { etapa: 'baixando'; porcentagem: number | null } | { etapa: 'instalando' };

export const verificarAtualizacao = () => invoke<Verificacao>('verificar_atualizacao');

/**
 * Baixa a versão achada pela última verificação, confere a assinatura com a chave do projeto,
 * instala e reinicia o Jogo (a promessa só volta se falhar).
 */
export function instalarAtualizacao(aoProgredir: (p: ProgressoDaAtualizacao) => void) {
  const canal = new Channel<ProgressoDaAtualizacao>();
  canal.onmessage = aoProgredir;
  return invoke<null>('instalar_atualizacao', { aoProgredir: canal });
}

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

// --- Envio de progresso (src-tauri/src/envio.rs) ---
// Sai daqui só o resumo de `montarEnvio`; o token continua na camada Rust.

/** `sem_rede` e `desconectado`: o envio ficou pendente e sai depois. */
export type Sincronia =
  | { estado: 'sincronizado'; progresso: EnvioDeProgresso; enviado: boolean }
  | { estado: 'sem_rede' }
  | { estado: 'desconectado' };

export type EstadoDoEnvio = {
  /** O JSON exato do último envio aceito e quando (ms desde 1970). */
  ultimo: { json: string; em: number } | null;
  /** O envio que espera o site. */
  pendente: string | null;
  /** O progresso que o site devolveu por último. */
  servidor: EnvioDeProgresso | null;
};

/** Envia o resumo (ou o deixa pendente, se não há rede ou conta). */
export const sincronizarProgresso = (envio: string) =>
  invoke<Sincronia>('sincronizar_progresso', { envio });

export const estadoDoEnvio = () => invoke<EstadoDoEnvio>('estado_do_envio');

// --- Relatório de erro (src-tauri/src/relatorio.rs) ---

/** Abre o navegador numa issue nova do repositório do Jogo com o texto que o Jogador revisou. */
export const abrirRelatorio = (titulo: string, corpo: string) =>
  invoke<null>('abrir_relatorio', { titulo, corpo });
