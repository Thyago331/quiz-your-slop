import { describe, expect, it } from 'vitest';
import { ErroDoMestre } from './mestre.ts';
import { PoucosDesafios } from './preparacao.ts';
import { detalhesDoErro, sanitizar, type ContextoDoRelatorio } from './relatorio.ts';

const CONTEXTO: ContextoDoRelatorio = {
  repositorios: [
    { nome: 'loja-api', caminho_local: '/home/maria/projetos/loja-api' },
    { nome: 'Faturamento', caminho_local: 'C:\\Users\\Maria Souza\\code\\Faturamento' },
  ],
  nomes: ['API de pedidos', 'Cobrança Recorrente', 'Servidor'],
};

const limpo = (texto: string, contexto: ContextoDoRelatorio = CONTEXTO) =>
  sanitizar(texto, contexto);

describe('sanitizar', () => {
  it('troca caminhos dentro do Projeto por <projeto>/... e a raiz sozinha por <projeto>', () => {
    expect(limpo('falhou em /home/maria/projetos/loja-api/src/pedidos.ts:12')).toBe(
      'falhou em <projeto>/...:12',
    );
    expect(limpo('rodando em /home/maria/projetos/loja-api')).toBe('rodando em <projeto>');
    expect(limpo('raiz /home/maria/projetos/loja-api/ ok')).toBe('raiz <projeto>/... ok');
  });

  it('caminhos do Windows, com espaços e barras dos dois tipos, inclusive em minúsculas', () => {
    expect(limpo('erro em C:\\Users\\Maria Souza\\code\\Faturamento\\src\\cobranca.rs')).toBe(
      'erro em <projeto>/...',
    );
    expect(limpo('erro em c:/users/maria souza/code/faturamento/src/x.rs')).toBe(
      'erro em <projeto>/...',
    );
    // Fora do Projeto: o caminho todo some, e o nome do usuário também.
    const fora = limpo('não achei C:\\Users\\Maria Souza\\AppData\\Local\\claude.exe');
    expect(fora).not.toMatch(/Maria|Souza|AppData|claude\.exe/);
    expect(limpo('\\\\servidor\\compartilhado\\loja\\a.ts quebrou')).toBe('<caminho> quebrou');
  });

  it('caminhos absolutos fora do Projeto e a pasta pessoal viram <caminho>', () => {
    expect(limpo('sem permissão: /etc/ssl/certs/ca.pem')).toBe('sem permissão: <caminho>');
    expect(limpo('config em ~/.config/codex/config.toml')).toBe('config em <caminho>');
    expect(limpo('cache /home/maria/.cache/x')).toBe('cache <caminho>');
    // "e/ou" e frações não são caminhos absolutos, mas relativos parecidos com caminho somem.
    expect(limpo('leia src/servidor/rotas.ts')).toBe('leia <projeto>/...');
  });

  it('caminhos em pilhas de erro (Node, navegador, Rust), mantendo linha e coluna', () => {
    const pilha = [
      'TypeError: Cannot read properties of undefined',
      '    at lerPedido (/home/maria/projetos/loja-api/src/pedidos.ts:10:5)',
      '    at Object.<anonymous> (/opt/node/lib/node_modules/x/index.js:2:1)',
      '    at http://tauri.localhost/assets/index-a1b2.js:120:33',
      '    at C:\\Users\\Maria Souza\\code\\Faturamento\\bin\\run.js:1:1',
    ].join('\n');
    expect(limpo(pilha)).toBe(
      [
        'TypeError: Cannot read properties of undefined',
        '    at lerPedido (<projeto>/...:10:5)',
        '    at Object.<anonymous> (<caminho>:2:1)',
        // O código do próprio Jogo fica: é o que ajuda a achar o bug.
        '    at http://tauri.localhost/assets/index-a1b2.js:120:33',
        '    at <projeto>/...:1:1',
      ].join('\n'),
    );
  });

  it('nomes de repositórios, Regiões e Territórios dentro das mensagens', () => {
    expect(limpo('o repositório loja-api não respondeu')).toBe(
      'o repositório <projeto> não respondeu',
    );
    expect(limpo('região API de pedidos sem arquivos; LOJA-API também')).toBe(
      'região <nome> sem arquivos; <projeto> também',
    );
    expect(limpo('cobrança recorrente: 0 Desafios')).toBe('<nome>: 0 Desafios');
    // Só a palavra inteira: "Servidores" não é o Território "Servidor".
    expect(limpo('Servidores e Servidor')).toBe('Servidores e <nome>');
    // O nome do usuário tirado das pastas do Projeto, em qualquer lugar do texto.
    expect(limpo('olá maria, Maria Souza')).toBe('olá <usuário>, <usuário>');
  });

  it('um nome do Projeto igual a um marcador não estraga os marcadores', () => {
    const ctx = { repositorios: [{ nome: 'projeto', caminho_local: '/srv/projeto' }] };
    expect(sanitizar('/srv/projeto/a.ts e projeto', ctx)).toBe('<projeto>/... e <projeto>');
  });

  it('trechos de código: blocos cercados, linhas com indentação, diffs e trechos de compilador', () => {
    const texto = [
      'erro de sintaxe:',
      '```ts',
      'const segredo = process.env.CHAVE;',
      '```',
      'veja:',
      '  12 | export function cobrar(valor) {',
      '     |        ^^^^^^',
      '+  return valor * taxa;',
      '-  return valor;',
      '\tif (x) { y(); }',
      'fim',
    ].join('\n');
    expect(limpo(texto)).toBe(
      ['erro de sintaxe:', '<trecho de código>', 'veja:', '<trecho de código>', 'fim'].join('\n'),
    );
  });

  it('textos entre aspas (onde a saída do Mestre costuma aparecer) somem', () => {
    expect(limpo('Unexpected token \'c\', "const x = 1" is not valid JSON')).toBe(
      'Unexpected token \'<texto>\', "<texto>" is not valid JSON',
    );
    expect(limpo('campo `enunciado` vazio')).toBe('campo `<trecho>` vazio');
    // Apóstrofo de palavra não é aspas.
    expect(limpo("don't panic, it's fine")).toBe("don't panic, it's fine");
  });

  it('segredos, e-mails e URLs de fora do Jogo', () => {
    expect(limpo('Authorization: Bearer qys_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG')).toBe(
      'Authorization: Bearer <segredo>',
    );
    expect(limpo('token ghp_0123456789abcdefABCDEF0123456789abcd e sk-ant-api03-xyzxyzxyz')).toBe(
      'token <segredo> e <segredo>',
    );
    expect(limpo('fale com maria.souza@empresa.com.br')).toBe('fale com <email>');
    expect(limpo('falhou https://git.empresa.com/loja-api/pull/3?x=1 ok')).toBe('falhou <url> ok');
  });

  it('nomes com caracteres especiais e pastas com espaço fora do Projeto', () => {
    const ctx = { nomes: ['API (v2) + [beta]'] };
    expect(sanitizar('a região API (v2) + [beta] caiu', ctx)).toBe('a região <nome> caiu');
    expect(sanitizar('em /home/ana/Meus Projetos/loja/x.ts caiu')).toBe('em <caminho> caiu');
  });

  it('sem contexto, ainda limpa caminhos e o usuário das pastas pessoais', () => {
    const texto = sanitizar('spawn /home/joaquim/.local/bin/claude ENOENT; joaquim');
    expect(texto).toBe('spawn <caminho> ENOENT; <usuário>');
  });

  it('caracteres de controle somem e textos enormes são cortados', () => {
    expect(sanitizar('a\u0007b\u001b[31mc')).toBe('ab[31mc');
    expect(sanitizar('x'.repeat(50_000)).length).toBeLessThanOrEqual(4_001);
  });
});

describe('detalhesDoErro', () => {
  it('ErroDoMestre: chamada, tentativas e problemas, limpos', () => {
    const erro = new ErroDoMestre('criar_aventura', 3, [
      'regioes[0].arquivos: src/pedidos.ts não existe em loja-api',
      'candidatas_entrada[1].nome: "Cobrança Recorrente" repetido',
    ]);
    const d = detalhesDoErro(erro, CONTEXTO);
    expect(d.tipo).toBe('ErroDoMestre');
    expect(d.mensagem).toBe('criar_aventura: saída inválida depois de 3 tentativas');
    expect(d.problemas).toEqual([
      'regioes[0].arquivos: <projeto>/... não existe em <projeto>',
      'candidatas_entrada[1].nome: "<texto>" repetido',
    ]);
    expect(d.pilha).toBeDefined();
    expect(d.pilha).not.toMatch(/\/home\/|[A-Z]:\\/);
  });

  it('PoucosDesafios conta como erro do Mestre', () => {
    const d = detalhesDoErro(new PoucosDesafios(2, 5, ['trecho não confere']), CONTEXTO);
    expect(d.tipo).toBe('PoucosDesafios');
    expect(d.mensagem).toBe('preparar_expedicao: só 2 Desafios válidos depois de 5 pedidos');
  });

  it('erro da camada Rust: código e só os detalhes conhecidos, com o stderr limpo', () => {
    const d = detalhesDoErro(
      {
        codigo: 'falhou',
        detalhe: {
          codigo: 1,
          stderr: 'Error: cannot open /home/maria/projetos/loja-api/.env\n  SECRET=1',
          prompt: 'Você é o Mestre... conteúdo do Projeto',
        },
      },
      CONTEXTO,
    );
    expect(d).toEqual({
      tipo: 'falhou',
      mensagem: 'codigo: 1',
      sistema: 'Error: cannot open <projeto>/...\n<trecho de código>',
      problemas: [],
    });
  });

  it('prompts, saídas e qualquer campo desconhecido ficam de fora', () => {
    const erro = Object.assign(new Error('a CLI falhou'), {
      prompt: 'PROMPT-SECRETO',
      saida: 'SAIDA-DO-MESTRE',
      stdout: 'STDOUT',
      problemas: 'não é lista',
    });
    const texto = JSON.stringify(detalhesDoErro(erro, CONTEXTO));
    expect(texto).not.toMatch(/PROMPT-SECRETO|SAIDA-DO-MESTRE|STDOUT/);
    const cru = JSON.stringify(
      detalhesDoErro(
        { codigo: 'io', detalhe: 'leitura de /home/maria/projetos/loja-api/x', saida: 'SAIDA' },
        CONTEXTO,
      ),
    );
    expect(cru).toBe('{"tipo":"io","mensagem":"leitura de <projeto>/...","problemas":[]}');
    expect(detalhesDoErro('texto solto em C:\\x\\y', CONTEXTO)).toEqual({
      tipo: 'erro',
      mensagem: 'texto solto em <caminho>',
      problemas: [],
    });
  });

  it('no máximo 10 problemas, a pilha com até 15 linhas', () => {
    const erro = new ErroDoMestre(
      'detalhar_regiao',
      3,
      Array.from({ length: 30 }, (_, k) => `p${k}`),
    );
    erro.stack = Array.from({ length: 40 }, (_, k) => `    at f${k} (/a/b/c${k}.js:1:1)`).join(
      '\n',
    );
    const d = detalhesDoErro(erro, CONTEXTO);
    expect(d.problemas).toHaveLength(10);
    expect(d.pilha?.split('\n')).toHaveLength(15);
    expect(d.pilha).not.toContain('/a/b');
  });
});
