// Destaque de sintaxe do explorador de código: um tokenizador pequeno, sem dependências, para as
// linguagens do Tutorial (TS/TSX, SQL, JSON, CSS, HTML). Não é um parser: erra em casos raros,
// mas nunca perde texto — juntar os tokens de volta dá o arquivo original.

export type TipoToken =
  | 'palavra'
  | 'texto'
  | 'numero'
  | 'comentario'
  | 'tipo'
  | 'funcao'
  | 'tag'
  | 'atributo'
  | 'propriedade';

/** tipo null = texto comum, sem cor própria. */
export type Token = { tipo: TipoToken | null; texto: string };

export type Linguagem = 'ts' | 'tsx' | 'sql' | 'json' | 'css' | 'html' | 'texto';

const EXTENSOES: Readonly<Record<string, Linguagem>> = {
  ts: 'ts',
  mts: 'ts',
  cts: 'ts',
  js: 'ts',
  mjs: 'ts',
  cjs: 'ts',
  tsx: 'tsx',
  jsx: 'tsx',
  sql: 'sql',
  json: 'json',
  css: 'css',
  html: 'html',
  htm: 'html',
};

export function linguagemDe(caminho: string): Linguagem {
  const extensao = caminho.slice(caminho.lastIndexOf('.') + 1).toLowerCase();
  return EXTENSOES[extensao] ?? 'texto';
}

const PALAVRAS_TS = new Set(
  (
    'abstract as async await break case catch class const continue debugger declare default ' +
    'delete do else enum export extends false finally for from function if implements import in ' +
    'instanceof interface keyof let namespace new null of private protected public readonly ' +
    'return satisfies static super switch this throw true try type typeof undefined var void ' +
    'while yield'
  ).split(' '),
);

const PALAVRAS_SQL = new Set(
  (
    'add all alter and as asc begin between by cascade case check commit constraint create ' +
    'default delete desc distinct drop else end exists false foreign from group having if in ' +
    'index insert into is join key left limit not null on or order primary references returning ' +
    'right rollback select set table then to true union unique update using values when where ' +
    'with serial text numeric integer int bigint boolean uuid timestamptz timestamp varchar'
  ).split(' '),
);

/** Um leitor com regex "sticky": cada tentativa casa exatamente na posição atual. */
class Leitor {
  pos = 0;
  readonly tokens: Token[] = [];
  constructor(readonly codigo: string) {}

  get fim(): boolean {
    return this.pos >= this.codigo.length;
  }
  olhar(n = 0): string {
    return this.codigo.charAt(this.pos + n);
  }
  /** O próximo caractere que não é espaço (sem consumir). */
  depoisDosEspacos(): string {
    const resto = /\s*/y;
    resto.lastIndex = this.pos;
    resto.exec(this.codigo);
    return this.codigo.charAt(resto.lastIndex);
  }
  casar(regex: RegExp): string | null {
    regex.lastIndex = this.pos;
    const achado = regex.exec(this.codigo);
    if (!achado || achado[0] === '') return null;
    this.pos += achado[0].length;
    return achado[0];
  }
  emitir(tipo: TipoToken | null, texto: string): void {
    this.tokens.push({ tipo, texto });
  }
  /** Tenta casar e, se casou, já emite com o tipo dado. */
  ler(regex: RegExp, tipo: TipoToken | null): boolean {
    const texto = this.casar(regex);
    if (texto === null) return false;
    this.emitir(tipo, texto);
    return true;
  }
  /** Um caractere sem cor: garante que o laço sempre anda. */
  avancar(): string {
    const c = this.olhar();
    this.pos += 1;
    this.emitir(null, c);
    return c;
  }
}

const ESPACO = /\s+/y;
const COMENTARIO_LINHA = /\/\/[^\n]*/y;
const COMENTARIO_BLOCO = /\/\*[\s\S]*?(?:\*\/|$)/y;
// Aspas simples e duplas não atravessam linha: uma aspa solta estraga no máximo a própria linha.
const ASPAS = /'(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?/y;
const CRASES = /`(?:[^`\\]|\\[\s\S])*`?/y;
const NUMERO = /(?:0[xX][\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)(?![\w$])/y;
const NOME = /[A-Za-z_$][\w$]*/y;
const REGEX = /\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[a-z]*/y;
const NOME_DE_TAG = /[A-Za-z_$][\w$.:-]*/y;

type Quadro =
  /** Código; dentro de JSX ({...}), conta as chaves para saber quando fecha. */
  | { modo: 'codigo'; chaves: number }
  | { modo: 'tag'; fechando: boolean; temNome: boolean }
  | { modo: 'filhos' };

/** TS e TSX. No TSX, `<` abre uma tag quando não vem depois de um valor (senão é genérico ou <). */
function lerTs(codigo: string, jsx: boolean): Token[] {
  const l = new Leitor(codigo);
  const pilha: Quadro[] = [{ modo: 'codigo', chaves: 0 }];
  let depoisDeValor = false;

  const abrirTag = () => {
    const fechando = l.olhar(1) === '/';
    l.pos += fechando ? 2 : 1;
    l.emitir(null, fechando ? '</' : '<');
    pilha.push({ modo: 'tag', fechando, temNome: false });
  };

  while (!l.fim) {
    const quadro = pilha[pilha.length - 1]!;

    if (quadro.modo === 'filhos') {
      if (l.ler(/[^<{]+/y, null)) continue;
      if (l.olhar() === '{') {
        l.avancar();
        pilha.push({ modo: 'codigo', chaves: 0 });
        depoisDeValor = false;
      } else abrirTag();
      continue;
    }

    if (quadro.modo === 'tag') {
      if (l.ler(ESPACO, null) || l.ler(ASPAS, 'texto')) continue;
      const nome = l.casar(NOME_DE_TAG);
      if (nome !== null) {
        l.emitir(quadro.temNome ? 'atributo' : 'tag', nome);
        quadro.temNome = true;
        continue;
      }
      if (l.olhar() === '{') {
        l.avancar();
        pilha.push({ modo: 'codigo', chaves: 0 });
        depoisDeValor = false;
      } else if (l.olhar() === '/' && l.olhar(1) === '>') {
        l.pos += 2;
        l.emitir(null, '/>');
        pilha.pop();
        depoisDeValor = true;
      } else if (l.olhar() === '>') {
        l.avancar();
        pilha.pop();
        if (quadro.fechando) {
          if (pilha[pilha.length - 1]?.modo === 'filhos') pilha.pop();
        } else pilha.push({ modo: 'filhos' });
        depoisDeValor = true;
      } else l.avancar();
      continue;
    }

    // modo código
    if (l.ler(ESPACO, null)) continue;
    if (l.ler(COMENTARIO_LINHA, 'comentario') || l.ler(COMENTARIO_BLOCO, 'comentario')) continue;
    if (l.ler(ASPAS, 'texto') || l.ler(CRASES, 'texto') || l.ler(NUMERO, 'numero')) {
      depoisDeValor = true;
      continue;
    }
    if (!depoisDeValor && l.olhar() === '/' && l.ler(REGEX, 'texto')) {
      depoisDeValor = true;
      continue;
    }
    const nome = l.casar(NOME);
    if (nome !== null) {
      if (PALAVRAS_TS.has(nome)) {
        l.emitir('palavra', nome);
        // `this`, `true`… são valores; `return`, `const`… abrem espaço para uma expressão.
        depoisDeValor = ['this', 'true', 'false', 'null', 'undefined', 'super'].includes(nome);
      } else {
        const tipo = l.depoisDosEspacos() === '(' ? 'funcao' : /^[A-Z]/.test(nome) ? 'tipo' : null;
        l.emitir(tipo, nome);
        depoisDeValor = true;
      }
      continue;
    }
    const c = l.olhar();
    if (jsx && c === '<' && !depoisDeValor && /[A-Za-z>/]/.test(l.olhar(1))) {
      abrirTag();
      continue;
    }
    if (pilha.length > 1 && c === '{') quadro.chaves += 1;
    if (pilha.length > 1 && c === '}') {
      if (quadro.chaves === 0) {
        l.avancar();
        pilha.pop();
        depoisDeValor = true;
        continue;
      }
      quadro.chaves -= 1;
    }
    l.avancar();
    depoisDeValor = c === ')' || c === ']';
  }
  return l.tokens;
}

function lerSql(codigo: string): Token[] {
  const l = new Leitor(codigo);
  while (!l.fim) {
    if (l.ler(ESPACO, null) || l.ler(/--[^\n]*/y, 'comentario')) continue;
    if (l.ler(COMENTARIO_BLOCO, 'comentario') || l.ler(/'(?:[^']|'')*'?/y, 'texto')) continue;
    if (l.ler(/\d+(?:\.\d+)?(?![\w$])/y, 'numero')) continue;
    const nome = l.casar(/[A-Za-z_][\w]*/y);
    if (nome !== null) {
      const tipo = PALAVRAS_SQL.has(nome.toLowerCase())
        ? 'palavra'
        : l.depoisDosEspacos() === '('
          ? 'funcao'
          : null;
      l.emitir(tipo, nome);
      continue;
    }
    if (l.ler(/\$\d+/y, 'atributo')) continue;
    l.avancar();
  }
  return l.tokens;
}

function lerJson(codigo: string): Token[] {
  const l = new Leitor(codigo);
  while (!l.fim) {
    if (l.ler(ESPACO, null)) continue;
    const texto = l.casar(/"(?:[^"\\\n]|\\.)*"?/y);
    if (texto !== null) {
      l.emitir(l.depoisDosEspacos() === ':' ? 'propriedade' : 'texto', texto);
      continue;
    }
    if (l.ler(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, 'numero')) continue;
    if (l.ler(/true|false|null/y, 'palavra')) continue;
    l.avancar();
  }
  return l.tokens;
}

function lerCss(codigo: string): Token[] {
  const l = new Leitor(codigo);
  // Seletor é o que vem antes de uma "{" sem ";" ou "}" no caminho (vale dentro de @media também).
  const antesDeChave = /[^;{}]*\{/y;
  while (!l.fim) {
    if (l.ler(ESPACO, null) || l.ler(COMENTARIO_BLOCO, 'comentario') || l.ler(ASPAS, 'texto')) {
      continue;
    }
    if (l.ler(/@[\w-]+/y, 'palavra')) continue;
    if (l.ler(/#[\da-fA-F]{3,8}(?![\w-])/y, 'numero')) continue;
    if (l.ler(/-?\d*\.?\d+(?:%|[a-zA-Z]+)?/y, 'numero')) continue;
    const nome = l.casar(/-*[A-Za-z_][\w-]*/y);
    if (nome !== null) {
      antesDeChave.lastIndex = l.pos;
      const depois = l.depoisDosEspacos();
      const tipo = antesDeChave.test(codigo)
        ? 'tag'
        : depois === ':'
          ? 'propriedade'
          : depois === '('
            ? 'funcao'
            : null;
      l.emitir(tipo, nome);
      continue;
    }
    l.avancar();
  }
  return l.tokens;
}

function lerHtml(codigo: string): Token[] {
  const l = new Leitor(codigo);
  let naTag = false;
  let temNome = false;
  while (!l.fim) {
    if (!naTag) {
      if (l.ler(/<!--[\s\S]*?(?:-->|$)/y, 'comentario')) continue;
      if (l.ler(/<![^>]*>?/y, 'palavra')) continue;
      if (l.ler(/[^<]+/y, null)) continue;
      l.emitir(null, l.casar(/<\/?/y)!);
      naTag = true;
      temNome = false;
      continue;
    }
    if (l.ler(ESPACO, null) || l.ler(ASPAS, 'texto')) continue;
    const nome = l.casar(NOME_DE_TAG);
    if (nome !== null) {
      l.emitir(temNome ? 'atributo' : 'tag', nome);
      temNome = true;
      continue;
    }
    if (l.avancar() === '>') naTag = false;
  }
  return l.tokens;
}

/** Os tokens do arquivo inteiro, numa linha só (as quebras ficam dentro dos tokens). */
export function tokenizar(codigo: string, linguagem: Linguagem): Token[] {
  switch (linguagem) {
    case 'ts':
      return lerTs(codigo, false);
    case 'tsx':
      return lerTs(codigo, true);
    case 'sql':
      return lerSql(codigo);
    case 'json':
      return lerJson(codigo);
    case 'css':
      return lerCss(codigo);
    case 'html':
      return lerHtml(codigo);
    case 'texto':
      return codigo === '' ? [] : [{ tipo: null, texto: codigo }];
  }
}

/**
 * O arquivo em linhas de tokens, pronto para a tela: tokens que atravessam linhas (comentário de
 * bloco, template) são partidos na quebra, e vizinhos do mesmo tipo se juntam. A quebra de linha
 * final não abre uma linha nova, como no editor.
 */
export function realcar(codigo: string, linguagem: Linguagem): Token[][] {
  const linhas: Token[][] = [[]];
  for (const token of tokenizar(codigo, linguagem)) {
    token.texto.split(/\r?\n/).forEach((pedaco, k) => {
      if (k > 0) linhas.push([]);
      if (pedaco === '') return;
      const linha = linhas[linhas.length - 1]!;
      const anterior = linha[linha.length - 1];
      if (anterior && anterior.tipo === token.tipo) anterior.texto += pedaco;
      else linha.push({ tipo: token.tipo, texto: pedaco });
    });
  }
  if (linhas.length > 1 && linhas[linhas.length - 1]!.length === 0) linhas.pop();
  return linhas;
}
