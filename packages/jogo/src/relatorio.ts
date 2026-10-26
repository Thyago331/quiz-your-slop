// O relatório de erro opcional (spec §8): o Jogador vê, edita e só então o envia (como issue no
// GitHub, aberta no navegador). Antes disso, o texto passa por `sanitizar`, que troca por marcadores
// tudo o que identifica o Projeto ou a pessoa:
//   caminho dentro do Projeto ou relativo → <projeto>/...   raiz ou nome de repositório → <projeto>
//   caminho absoluto fora do Projeto      → <caminho>        Região ou Território       → <nome>
//   usuário (das pastas pessoais)         → <usuário>        trecho de código           → <trecho de código>
//   texto entre aspas (saída do Mestre)   → "<texto>"        URL que não é do Jogo      → <url>
//   e-mail → <email>; token, chave ou Bearer → <segredo>; JWT (eyJ...), chave da AWS (AKIA/ASIA...)
//   e o valor de `api_key=`, `token:`, `password=`, `secret=`... → <segredo>.
// Prompts e saídas do Mestre nunca entram: `detalhesDoErro` só lê campos conhecidos do erro.
// Decisão: o stderr e o stdout da CLI também nunca entram, nem a última linha `ERROR:` (no Codex,
// o stderr traz o prompt e a saída das ferramentas, isto é, código do Projeto; nenhum filtro de
// "linha segura" garante que um pedaço dele não passe). Do erro da camada Rust ficam só o código
// (a categoria fixa, como `falhou`) e os números conhecidos (código de saída, segundos...).
import type { NomeDaChamada } from './mestre.ts';

export type ContextoDoRelatorio = {
  /** Os repositórios do Projeto: o nome e a pasta local. */
  repositorios?: readonly { nome: string; caminho_local: string }[];
  /** Nomes que o Mestre deu (Regiões, Territórios). */
  nomes?: readonly string[];
};

/** Nomes mais curtos que isto não são trocados: trocar "a" ou "ui" destruiria o texto. */
const NOME_MINIMO = 3;
const TEXTO_MAXIMO = 4_000;

// Um marcador já posto vira um caractere de uso privado (que a entrada não pode ter): as regras
// seguintes não o enxergam, e um nome do Projeto igual a "projeto" não estraga "<projeto>".
const ABRE = '\uE000';
const FECHA = '\uE001';
const PRIVADO = '\uE000-\uF8FF';
// O que pode estar num pedaço de caminho.
const PEDACO = `[^\\\\/\\s:'"()<>|*?,;\`${PRIVADO}]+`;
// Pedaço com espaços simples por dentro, desde que outro separador venha depois.
const PEDACO_COM_ESPACO = `${PEDACO}(?: ${PEDACO})*`;

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EXTENSOES =
  'tsx?|jsx?|mjs|cjs|rs|py|go|java|kt|rb|php|cs|cpp|cc|hpp|swift|vue|svelte|json|ya?ml|toml|sql|' +
  'md|css|scss|html|sh|env|lock|exe|dll|so';

const PASTA_PESSOAL = new RegExp(
  `(?:/home/|/Users/|[A-Za-z]:[\\\\/](?:Users|Documents and Settings)[\\\\/])(${PEDACO})`,
  'gi',
);

/** Os usuários das pastas pessoais (`/home/x`, `C:\Users\x`) que aparecem nas raízes ou no texto. */
function usuarios(texto: string, raizes: readonly string[]): string[] {
  const achados = new Set<string>();
  for (const raiz of raizes) {
    const partes = raiz.split(/[\\/]+/);
    const k = partes.findIndex((p) => /^(home|users|documents and settings)$/i.test(p));
    const usuario = k >= 0 ? partes[k + 1] : undefined;
    if (usuario) achados.add(usuario);
  }
  for (const [, usuario] of texto.matchAll(PASTA_PESSOAL)) if (usuario) achados.add(usuario);
  return [...achados];
}

/** As formas de escrever uma raiz: como veio e com a outra barra, sem a barra do fim. */
function formasDaRaiz(raiz: string): string[] {
  const limpa = raiz.trim().replace(/[\\/]+$/, '');
  if (limpa.length < 2) return [];
  return [...new Set([limpa, limpa.replace(/\\/g, '/'), limpa.replace(/\//g, '\\')])];
}

/** Troca, no texto já limpo, o que identifica o Projeto ou a pessoa por marcadores. */
export function sanitizar(texto: string, contexto: ContextoDoRelatorio = {}): string {
  const marcadores: string[] = [];
  const marcar = (marcador: string) => {
    marcadores.push(marcador);
    return `${ABRE}${String.fromCharCode(0xe100 + marcadores.length - 1)}${FECHA}`;
  };
  const raizes = (contexto.repositorios ?? []).flatMap((r) => formasDaRaiz(r.caminho_local));

  let t = texto
    .slice(0, 5 * TEXTO_MAXIMO)
    .replace(/\r\n?/g, '\n')
    // Controle e uso privado: a entrada não pode imitar um marcador.
    .replace(new RegExp(`[\\u0000-\\u0008\\u000B-\\u001F\\u007F${PRIVADO}]`, 'g'), '');
  const pessoas = usuarios(t, raizes);

  // Trechos de código: blocos cercados e linhas que parecem código (indentadas, de diff ou de
  // compilador). Linha de pilha ("    at f (...)") fica.
  t = t.replace(/```[\s\S]*?(?:```|$)/g, () => marcar('<trecho de código>'));
  const linhas: string[] = [];
  let anteriorEraCodigo = false;
  for (const linha of t.split('\n')) {
    const codigo =
      (/^\s+\S/.test(linha) && !/^\s+at\s/.test(linha)) ||
      /^\s*\d+\s*\|/.test(linha) ||
      /^\+|^-(?! \S)/.test(linha);
    if (!codigo) linhas.push(linha);
    else if (!anteriorEraCodigo) linhas.push(marcar('<trecho de código>'));
    anteriorEraCodigo = codigo;
  }
  t = linhas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Segredos e e-mails, antes que as regras de caminho e de nome os piquem.
  t = t
    .replace(/\bBearer\s+\S+/gi, () => `Bearer ${marcar('<segredo>')}`)
    .replace(/\b(?:qys|gh[pousr]|github_pat)_[A-Za-z0-9_]+/g, () => marcar('<segredo>'))
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, () => marcar('<segredo>'))
    .replace(/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g, () =>
      marcar('<segredo>'),
    )
    .replace(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, () => marcar('<segredo>'))
    .replace(
      /\b([\w-]*(?:api[_-]?key|token|password|passwd|secret)"?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;}"']+)/gi,
      (_, chave: string) => `${chave}${marcar('<segredo>')}`,
    )
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, () => marcar('<email>'));

  // URLs: as do próprio Jogo (o código dele, na pilha) ficam; as outras somem.
  t = t
    .replace(
      new RegExp(
        `\\b(?:https?|tauri)://(?:tauri\\.localhost|ipc\\.localhost|localhost:1420)(?:/[^\\s'"()<>${PRIVADO}]*)?`,
        'g',
      ),
      (url) => marcar(url),
    )
    .replace(new RegExp(`\\b(?!file:)[a-z][a-z0-9+.-]*://[^\\s'"()<>${PRIVADO}]*`, 'gi'), () =>
      marcar('<url>'),
    );

  // As raízes do Projeto, da mais longa para a mais curta.
  for (const raiz of raizes.sort((a, b) => b.length - a.length)) {
    const regra = new RegExp(
      `${escapar(raiz)}([\\\\/](?:${PEDACO_COM_ESPACO}[\\\\/])*(?:${PEDACO})?)?(?=$|[\\\\/\\s:'"()<>,;${PRIVADO}])`,
      'gi',
    );
    t = t.replace(regra, (_, resto?: string) => marcar(resto ? '<projeto>/...' : '<projeto>'));
  }

  // Outros caminhos absolutos: Windows (C:\, \\servidor), Unix e a pasta pessoal (~/).
  const meio = `(?:${PEDACO_COM_ESPACO}[\\\\/])*(?:${PEDACO})?`;
  t = t
    .replace(new RegExp(`\\b[A-Za-z]:[\\\\/]${meio}`, 'g'), () => marcar('<caminho>'))
    .replace(new RegExp(`\\\\\\\\${PEDACO}(?:\\\\${meio})?`, 'g'), () => marcar('<caminho>'))
    .replace(new RegExp(`(?<![\\w.~\\-:/\\\\${PRIVADO}])~?/${PEDACO}(?:/${meio})?/?`, 'g'), () =>
      marcar('<caminho>'),
    );

  // Caminhos relativos e nomes de arquivo de código.
  t = t
    .replace(
      new RegExp(`(?<![\\w${PRIVADO}])(?:\\.{1,2}[\\\\/])?[\\w.@-]+(?:[\\\\/][\\w.@-]+)+`, 'g'),
      () => marcar('<projeto>/...'),
    )
    .replace(new RegExp(`(?<![\\w${PRIVADO}])[\\w.-]+\\.(?:${EXTENSOES})\\b`, 'g'), () =>
      marcar('<projeto>/...'),
    );

  // Entre aspas costuma vir a saída do Mestre ou o código; apóstrofo dentro de palavra fica.
  t = t
    .replace(new RegExp(`"[^"\\n${PRIVADO}]*"`, 'g'), () => `"${marcar('<texto>')}"`)
    .replace(
      new RegExp(`(?<![\\p{L}\\p{N}])'[^'\\n${PRIVADO}]*'(?![\\p{L}\\p{N}])`, 'gu'),
      () => `'${marcar('<texto>')}'`,
    )
    .replace(new RegExp(`\`[^\`\\n${PRIVADO}]*\``, 'g'), () => `\`${marcar('<trecho>')}\``);

  // Os nomes que sobraram soltos no texto, do mais longo para o mais curto.
  const nomes: [string, string][] = [
    ...(contexto.repositorios ?? []).map((r): [string, string] => [r.nome, '<projeto>']),
    ...(contexto.nomes ?? []).map((n): [string, string] => [n, '<nome>']),
    ...pessoas.map((p): [string, string] => [p, '<usuário>']),
  ];
  for (const [nome, marcador] of nomes
    .map(([n, m]): [string, string] => [n.trim(), m])
    .filter(([n]) => n.length >= NOME_MINIMO)
    .sort((a, b) => b[0].length - a[0].length)) {
    const regra = new RegExp(`(?<![\\p{L}\\p{N}_])${escapar(nome)}(?![\\p{L}\\p{N}_])`, 'giu');
    t = t.replace(regra, () => marcar(marcador));
  }

  t = t.replace(
    new RegExp(`${ABRE}([\\uE100-\\uF8FF])${FECHA}`, 'g'),
    (_, k: string) => marcadores[k.charCodeAt(0) - 0xe100] ?? '',
  );
  return t.length > TEXTO_MAXIMO ? `${t.slice(0, TEXTO_MAXIMO)}…` : t;
}

export type DetalhesDoErro = {
  /** O nome do erro (ErroDoMestre, PoucosDesafios...) ou o código da camada Rust. */
  tipo: string;
  mensagem: string;
  /** Os problemas da última tentativa do Mestre (no máximo 10). */
  problemas: string[];
  /** Até 15 linhas da pilha. */
  pilha?: string;
};

const PROBLEMAS_MAXIMOS = 10;
const LINHAS_DA_PILHA = 15;
/** Os detalhes numéricos que a camada Rust manda (código de saída, segundos, limite, status). */
const NUMEROS_CONHECIDOS = ['codigo', 'segundos', 'limite', 'status'] as const;

const ehObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * O que o relatório conta de um erro, já limpo. Só campos conhecidos: nome, mensagem, pilha e
 * problemas de um Error; código e números de um erro da camada Rust. Prompt, saída do Mestre,
 * stderr/stdout da CLI ou qualquer outro campo pendurado no erro não entra.
 */
export function detalhesDoErro(erro: unknown, contexto: ContextoDoRelatorio = {}): DetalhesDoErro {
  const limpo = (texto: string) => sanitizar(texto, contexto);
  if (erro instanceof Error) {
    const chamada = (erro as { chamada?: NomeDaChamada }).chamada;
    const problemas = (erro as { problemas?: unknown }).problemas;
    const lista =
      Array.isArray(problemas) && typeof chamada === 'string'
        ? problemas
            .filter((p): p is string => typeof p === 'string')
            .slice(-PROBLEMAS_MAXIMOS)
            .map(limpo)
        : [];
    const cabecalho = `${erro.name}: ${erro.message}`;
    const linhas = (erro.stack ?? '').split('\n');
    if (linhas[0]?.startsWith(cabecalho.split('\n')[0]!)) linhas.shift();
    const pilha = limpo(linhas.slice(0, LINHAS_DA_PILHA).join('\n'));
    return {
      tipo: limpo(erro.name),
      mensagem: limpo(erro.message),
      problemas: lista,
      ...(pilha && { pilha }),
    };
  }
  if (ehObjeto(erro) && typeof erro.codigo === 'string') {
    const { detalhe } = erro;
    let mensagem = '';
    if (typeof detalhe === 'string') mensagem = limpo(detalhe);
    else if (ehObjeto(detalhe)) {
      mensagem = NUMEROS_CONHECIDOS.filter((k) => typeof detalhe[k] === 'number')
        .map((k) => `${k}: ${detalhe[k] as number}`)
        .join(', ');
    }
    return { tipo: limpo(erro.codigo), mensagem, problemas: [] };
  }
  return { tipo: 'erro', mensagem: typeof erro === 'string' ? limpo(erro) : '', problemas: [] };
}
