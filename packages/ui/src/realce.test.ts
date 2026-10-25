import { describe, expect, it } from 'vitest';
import { linguagemDe, realcar, tokenizar, type Linguagem, type TipoToken } from './realce.ts';

/** Só os tokens coloridos, como "tipo:texto", para comparar fácil. */
function cores(codigo: string, linguagem: Linguagem): string[] {
  return tokenizar(codigo, linguagem)
    .filter((t) => t.tipo !== null)
    .map((t) => `${t.tipo}:${t.texto}`);
}

const juntar = (codigo: string, linguagem: Linguagem) =>
  tokenizar(codigo, linguagem)
    .map((t) => t.texto)
    .join('');

describe('linguagemDe', () => {
  it('escolhe pela extensão; o resto é texto', () => {
    expect(linguagemDe('api/src/server.ts')).toBe('ts');
    expect(linguagemDe('web/src/pages/Menu.tsx')).toBe('tsx');
    expect(linguagemDe('db/schema.sql')).toBe('sql');
    expect(linguagemDe('web/package.json')).toBe('json');
    expect(linguagemDe('web/src/styles.css')).toBe('css');
    expect(linguagemDe('web/index.html')).toBe('html');
    expect(linguagemDe('README')).toBe('texto');
  });
});

describe('tokenizar TS', () => {
  it('palavras-chave, textos, números, comentários, funções e tipos', () => {
    const codigo =
      "// cobra o pedido\nexport async function charge(amount: Money): Promise<void> {\n  const x = 'oi' + `t${1}`;\n  return fetch(42);\n}";
    expect(cores(codigo, 'ts')).toEqual([
      'comentario:// cobra o pedido',
      'palavra:export',
      'palavra:async',
      'palavra:function',
      'funcao:charge',
      'tipo:Money',
      'tipo:Promise',
      'palavra:void',
      'palavra:const',
      "texto:'oi'",
      'texto:`t${1}`',
      'palavra:return',
      'funcao:fetch',
      'numero:42',
    ]);
  });

  it('comentário de bloco e regex', () => {
    expect(cores('/* a\n b */ x.replace(/:(\\w+)/g, f)', 'ts')).toEqual([
      'comentario:/* a\n b */',
      'funcao:replace',
      'texto:/:(\\w+)/g',
    ]);
  });

  it('divisão não vira regex', () => {
    expect(cores('const m = a / b / 2;', 'ts')).toEqual(['palavra:const', 'numero:2']);
  });

  it('em TS sem JSX, < é só operador', () => {
    expect(cores('if (a <b) {}', 'ts')).toEqual(['palavra:if']);
  });
});

describe('tokenizar TSX', () => {
  it('tags, atributos e expressões; genéricos continuam genéricos', () => {
    const codigo =
      'const [a] = useState<Item[]>([]);\nreturn <p className="x" onClick={() => go(1)}>Today\'s {n} menu</p>;';
    expect(cores(codigo, 'tsx')).toEqual([
      'palavra:const',
      'tipo:Item',
      'palavra:return',
      'tag:p',
      'atributo:className',
      'texto:"x"',
      'atributo:onClick',
      'funcao:go',
      'numero:1',
      'tag:p',
    ]);
  });

  it('JSX aninhado, fragmento e auto-fechada voltam ao código no fim', () => {
    const codigo =
      'const v = (\n  <>\n    <A b={{ c: 1 }} />\n    <div>oi</div>\n  </>\n);\nconst z = 1;';
    expect(cores(codigo, 'tsx')).toEqual([
      'palavra:const',
      'tag:A',
      'atributo:b',
      'numero:1',
      'tag:div',
      'tag:div',
      'palavra:const',
      'numero:1',
    ]);
  });
});

describe('tokenizar SQL, JSON, CSS, HTML', () => {
  it('SQL: palavras sem caixa, textos, comentários, parâmetros', () => {
    expect(
      cores("-- tabela\nSELECT now() FROM orders WHERE id = $1 AND s = 'paid';", 'sql'),
    ).toEqual([
      'comentario:-- tabela',
      'palavra:SELECT',
      'funcao:now',
      'palavra:FROM',
      'palavra:WHERE',
      'atributo:$1',
      'palavra:AND',
      "texto:'paid'",
    ]);
  });

  it('JSON: chaves são propriedades, valores são textos', () => {
    expect(cores('{ "name": "api", "n": 1, "ok": true }', 'json')).toEqual([
      'propriedade:"name"',
      'texto:"api"',
      'propriedade:"n"',
      'numero:1',
      'propriedade:"ok"',
      'palavra:true',
    ]);
  });

  it('CSS: seletores, propriedades, valores e @regras', () => {
    expect(
      cores('@media (max-width: 4px) {\n  .a { color: #fff; margin: 0 auto; }\n}', 'css'),
    ).toEqual([
      'palavra:@media',
      'tag:max-width',
      'numero:4px',
      'tag:a',
      'propriedade:color',
      'numero:#fff',
      'propriedade:margin',
      'numero:0',
    ]);
  });

  it('HTML: doctype, comentário, tags e atributos', () => {
    expect(cores('<!doctype html>\n<!-- x -->\n<div id="root"></div>', 'html')).toEqual([
      'palavra:<!doctype html>',
      'comentario:<!-- x -->',
      'tag:div',
      'atributo:id',
      'texto:"root"',
      'tag:div',
    ]);
  });
});

describe('nunca perde texto', () => {
  const amostras: [string, Linguagem][] = [
    ['const a = \'sem fim\nb = "x";\n', 'ts'],
    ['<div>{a ? <b>x</b> : null}</div>\n<p>solto', 'tsx'],
    ['/* aberto\nSELECT 1', 'sql'],
    ['{ "a": [1, 2, {"b": null}] }', 'json'],
    ['a{b:c}}}', 'css'],
    ['<a href="x">t</a><', 'html'],
    ['qualquer coisa\n', 'texto'],
  ];
  it.each(amostras)('%j (%s)', (codigo, linguagem) => {
    expect(juntar(codigo, linguagem)).toBe(codigo);
  });
});

describe('realcar', () => {
  it('parte tokens de várias linhas e não abre linha pela quebra final', () => {
    const linhas = realcar('/* a\nb */ x\n', 'ts');
    expect(linhas).toEqual([
      [{ tipo: 'comentario', texto: '/* a' }],
      [
        { tipo: 'comentario', texto: 'b */' },
        { tipo: null, texto: ' x' },
      ],
    ]);
  });

  it('linhas vazias no meio continuam lá', () => {
    expect(realcar('a\n\nb', 'texto').map((l) => l.map((t) => t.texto).join(''))).toEqual([
      'a',
      '',
      'b',
    ]);
  });

  it('junta vizinhos do mesmo tipo', () => {
    const tipos: (TipoToken | null)[] = realcar('a + b', 'ts')[0]!.map((t) => t.tipo);
    expect(tipos).toEqual([null]);
  });
});
