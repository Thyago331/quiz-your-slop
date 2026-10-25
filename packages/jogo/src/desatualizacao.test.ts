import { describe, expect, it } from 'vitest';
import type { AventuraNoProjeto, RegiaoDoProjeto } from './criacao.ts';
import {
  ARVORE_VAZIA,
  detectarDesatualizadas,
  lerCommits,
  lerMudancas,
  mudancasParaOMestre,
  type ComandoGitDaLeitura,
  type LeituraDoRepositorio,
  type RodarGit,
} from './desatualizacao.ts';
import { iniciarMapa } from './mapa.ts';
import { ESTATISTICAS_ZERADAS } from './envio.ts';

const REVELACAO = 'a'.repeat(40);

function regiao(id: string, arquivos: string[], extra: Partial<RegiaoDoProjeto> = {}) {
  return {
    id,
    nome: id,
    resumo: '',
    territorio_id: 't',
    arquivos,
    arquivos_semente: arquivos.slice(0, 1),
    ...extra,
  };
}

/** Uma Aventura de um repositório só, com regiões reveladas no commit REVELACAO. */
function aventura(
  regioes: RegiaoDoProjeto[],
  estados: Record<string, AventuraNoProjeto['mapa']['estados'][string]>,
  repositorios = [{ nome: 'loja', caminho_local: '/p/loja', commit: 'c'.repeat(40) }],
): AventuraNoProjeto {
  const mapa = iniciarMapa({ regioes: regioes.map((r) => r.id), ligacoes: [] }, regioes[0]!.id);
  return {
    versao: 3,
    id: '0b7e6c1a-3f2d-4c5e-9a8b-7c6d5e4f3a2b',
    criada_em: '2026-10-25T12:00:00.000Z',
    atualizada_em: '2026-10-25T12:00:00.000Z',
    mestre: 'claude_code',
    classe: 'backend',
    repositorios,
    territorios: [{ id: 't', nome: 'API', resumo: '', raizes: ['.'] }],
    regioes,
    mapa: { ...mapa, estados: { ...mapa.estados, ...estados } },
    vistos: {},
    xp: 0,
    estatisticas: ESTATISTICAS_ZERADAS,
    ligacoes: [],
    ligacoes_escondidas: {},
  };
}

/** `git diff --numstat -z`: [adicionadas, removidas, caminho] ou, renomeado, [a, r, antigo, novo]. */
const numstat = (...linhas: (readonly (number | '-' | string)[])[]) =>
  linhas
    .map((l) => (l.length === 4 ? `${l[0]}\t${l[1]}\t\0${l[2]}\0${l[3]}\0` : `${l.join('\t')}\0`))
    .join('');

const leitura = (l: Partial<LeituraDoRepositorio>): LeituraDoRepositorio => ({
  mudou: '',
  antes: '',
  depois: '',
  ...l,
});

const revelada = (arquivos: string[]) =>
  aventura([regiao('r', arquivos, { revelada_em: { loja: REVELACAO } })], { r: 'revelada' });

describe('detectarDesatualizadas (spec §6)', () => {
  it('sem mudança, nada acontece', () => {
    const a = revelada(['src/a.ts']);
    const r = detectarDesatualizadas(a, { r: { loja: leitura({}) } });
    expect(r.aventura).toBe(a);
    expect(r.mudancas).toEqual({});
  });

  it('a partir de exatamente 20% das linhas da região no commit da revelação', () => {
    const a = revelada(['src/a.ts', 'src/b.ts']);
    const antes = numstat([10, 0, 'src/a.ts'], [5, 0, 'src/b.ts']);
    const com = (mudou: string) =>
      detectarDesatualizadas(a, {
        r: { loja: leitura({ mudou, antes, depois: numstat([1, 0, 'src/a.ts']) }) },
      });
    // 3 de 15 linhas = 20% (a conta não pode errar por arredondamento).
    const vinte = com(numstat([2, 1, 'src/a.ts']));
    expect(vinte.aventura.mapa.estados.r).toBe('desatualizada');
    expect(vinte.mudancas.r).toEqual({
      alterados: [{ caminho: 'src/a.ts', adicionadas: 2, removidas: 1 }],
      apagados: [],
      renomeados: [],
      novos: [],
      adicionadas: 2,
      removidas: 1,
      linhasNaRevelacao: 15,
      desatualizada: true,
    });
    // 2 de 15 ≈ 13%: fica revelada, mas a mudança é conhecida.
    const pouco = com(numstat([1, 1, 'src/a.ts']));
    expect(pouco.aventura.mapa.estados.r).toBe('revelada');
    expect(pouco.aventura).toBe(a);
    expect(pouco.mudancas.r?.desatualizada).toBe(false);
  });

  it('o limiar é configurável', () => {
    const a = revelada(['src/a.ts']);
    const leituras = {
      r: {
        loja: leitura({
          mudou: numstat([3, 0, 'src/a.ts']),
          antes: numstat([10, 0, 'src/a.ts']),
          depois: numstat([13, 0, 'src/a.ts']),
        }),
      },
    };
    expect(detectarDesatualizadas(a, leituras).mudancas.r?.desatualizada).toBe(true);
    expect(detectarDesatualizadas(a, leituras, 0.5).mudancas.r?.desatualizada).toBe(false);
  });

  it('arquivo apagado ou renomeado deixa desatualizada, por menor que seja', () => {
    const a = revelada(['src/a.ts', 'src/b.ts', 'src/c.ts']);
    const r = detectarDesatualizadas(a, {
      r: {
        loja: leitura({
          // b.ts apagado; c.ts esvaziado (continua existindo); a.ts renomeado sem mudança.
          mudou: numstat([0, 1, 'src/b.ts'], [0, 1, 'src/c.ts'], [0, 0, 'src/a.ts', 'src/x.ts']),
          antes: numstat([100, 0, 'src/a.ts'], [1, 0, 'src/b.ts'], [1, 0, 'src/c.ts']),
          depois: numstat([0, 0, 'src/c.ts']),
        }),
      },
    });
    expect(r.aventura.mapa.estados.r).toBe('desatualizada');
    expect(r.mudancas.r).toMatchObject({
      alterados: [{ caminho: 'src/c.ts', adicionadas: 0, removidas: 1 }],
      apagados: ['src/b.ts'],
      renomeados: [{ de: 'src/a.ts', para: 'src/x.ts' }],
      novos: [],
      removidas: 2,
      linhasNaRevelacao: 102,
    });
  });

  it('arquivo novo direto numa pasta da região; não em subpasta, nem o que já existia', () => {
    const a = revelada(['src/a.ts']);
    const ler = (mudou: string, antes = numstat([50, 0, 'src/a.ts'])) =>
      detectarDesatualizadas(a, { r: { loja: leitura({ mudou, antes }) } });
    // src/outra.ts já existia (de outra região) e só mudou; src/sub/y.ts está numa subpasta.
    const r = ler(
      numstat([1, 0, 'src/novo.ts'], [3, 0, 'src/outra.ts'], [9, 0, 'src/sub/y.ts']),
      numstat([50, 0, 'src/a.ts'], [10, 0, 'src/outra.ts']),
    );
    expect(r.mudancas.r).toMatchObject({ novos: ['src/novo.ts'], desatualizada: true });
    expect(ler(numstat([9, 0, 'src/sub/y.ts'])).aventura.mapa.estados.r).toBe('revelada');
    // Renomeado de fora da região para dentro da pasta dela conta como novo.
    const vindo = ler(numstat([0, 0, 'lib/z.ts', 'src/z.ts']));
    expect(vindo.mudancas.r).toMatchObject({ novos: ['src/z.ts'], renomeados: [] });
  });

  it('arquivo binário: aparece como alterado, sem linhas no numerador nem no denominador', () => {
    const a = revelada(['src/a.ts', 'src/logo.png']);
    const r = detectarDesatualizadas(a, {
      r: {
        loja: leitura({
          mudou: numstat(['-', '-', 'src/logo.png']),
          antes: numstat([10, 0, 'src/a.ts'], ['-', '-', 'src/logo.png']),
          depois: numstat(['-', '-', 'src/logo.png']),
        }),
      },
    });
    expect(r.mudancas.r).toMatchObject({
      alterados: [{ caminho: 'src/logo.png', adicionadas: null, removidas: null }],
      linhasNaRevelacao: 10,
      adicionadas: 0,
      desatualizada: false,
    });
  });

  it('região sem linhas de texto na revelação: qualquer linha mudada basta', () => {
    const a = revelada(['src/vazio.ts']);
    const r = detectarDesatualizadas(a, {
      r: {
        loja: leitura({
          mudou: numstat([1, 0, 'src/vazio.ts']),
          antes: numstat([0, 0, 'src/vazio.ts']),
          depois: numstat([1, 0, 'src/vazio.ts']),
        }),
      },
    });
    expect(r.mudancas.r?.desatualizada).toBe(true);
  });

  it('Projeto de vários repositórios: cada um com o seu commit, os caminhos com prefixo', () => {
    const repositorios = [
      { nome: 'front', caminho_local: '/p/front', commit: 'c'.repeat(40) },
      { nome: 'api', caminho_local: '/p/api', commit: 'c'.repeat(40) },
    ];
    const a = aventura(
      [
        regiao('r', ['front:src/a.ts', 'api:b.ts'], {
          revelada_em: { front: REVELACAO, api: 'b'.repeat(40) },
        }),
      ],
      { r: 'revelada' },
      repositorios,
    );
    const r = detectarDesatualizadas(a, {
      r: {
        front: leitura({ antes: numstat([100, 0, 'src/a.ts']) }),
        api: leitura({
          mudou: numstat([0, 0, 'b.ts', 'c.ts'], [5, 0, 'novo.ts']),
          antes: numstat([100, 0, 'b.ts']),
        }),
      },
    });
    expect(r.mudancas.r).toMatchObject({
      renomeados: [{ de: 'api:b.ts', para: 'api:c.ts' }],
      novos: ['api:novo.ts'],
      linhasNaRevelacao: 200,
    });
  });

  it('só olha regiões reveladas ou desatualizadas; a desatualizada não volta sozinha', () => {
    const a = aventura(
      [regiao('d', ['src/d.ts']), regiao('x', ['src/x.ts'], { revelada_em: { loja: REVELACAO } })],
      { d: 'desbloqueada', x: 'desatualizada' },
    );
    const mudou = leitura({
      mudou: numstat([9, 9, 'src/d.ts']),
      antes: numstat([1, 0, 'src/d.ts']),
    });
    const r = detectarDesatualizadas(a, { d: { loja: mudou }, x: { loja: leitura({}) } });
    expect(r.aventura.mapa.estados).toEqual({ d: 'desbloqueada', x: 'desatualizada' });
    expect(r.mudancas).toEqual({});
  });

  it('ignora linhas que não são numstat', () => {
    const a = revelada(['src/a.ts']);
    const r = detectarDesatualizadas(a, {
      r: { loja: leitura({ mudou: 'src/a.ts\0src/b.ts\0', antes: 'lixo' }) },
    });
    expect(r.mudancas).toEqual({});
  });
});

/** Um `git` de mentira: responde por comando e guarda os pedidos. */
function gitFalso(responder: (c: ComandoGitDaLeitura, repositorio: string) => string) {
  const pedidos: { repositorio: string; comando: ComandoGitDaLeitura }[] = [];
  const git: RodarGit = async (r, comando) => {
    pedidos.push({ repositorio: r.nome, comando });
    return responder(comando, r.nome);
  };
  return { git, pedidos };
}

describe('lerMudancas', () => {
  it('pede o numstat desde a revelação nas pastas da região e as linhas antes e depois', async () => {
    const a = aventura(
      [
        regiao('r', ['src/a.ts', 'src/b.ts', 'README.md'], { revelada_em: { loja: REVELACAO } }),
        regiao('d', ['src/d.ts']),
      ],
      { r: 'revelada', d: 'desbloqueada' },
    );
    const mudou = numstat([3, 1, 'src/a.ts'], [2, 0, 'src/novo.ts'], [1, 0, 'src/sub/x.ts']);
    const { git, pedidos } = gitFalso((c) =>
      c.tipo === 'diff_numstat' && c.de === REVELACAO ? mudou : 'x',
    );
    const leituras = await lerMudancas(a, git);
    expect(Object.keys(leituras)).toEqual(['r']);
    expect(pedidos.map((p) => p.comando)).toEqual([
      { tipo: 'diff_numstat', de: REVELACAO, ate: 'HEAD', caminhos: ['src', '.'] },
      {
        tipo: 'diff_numstat',
        de: ARVORE_VAZIA.sha1,
        ate: REVELACAO,
        caminhos: ['src/a.ts', 'src/b.ts', 'README.md', 'src/novo.ts'],
      },
      { tipo: 'diff_numstat', de: ARVORE_VAZIA.sha1, ate: 'HEAD', caminhos: ['src/a.ts'] },
    ]);
    expect(leituras.r?.loja).toEqual({ mudou, antes: 'x', depois: 'x' });
  });

  it('sem mudança, um pedido só; git que falha deixa a região de fora', async () => {
    const a = aventura(
      [
        regiao('r', ['src/a.ts'], { revelada_em: { loja: REVELACAO } }),
        regiao('q', ['q.ts'], { revelada_em: { loja: 'f'.repeat(64) } }),
      ],
      { r: 'revelada', q: 'revelada' },
    );
    const { git, pedidos } = gitFalso((c) => {
      if (c.tipo === 'diff_numstat' && c.de.startsWith('f')) throw new Error('commit sumiu');
      return '';
    });
    const leituras = await lerMudancas(a, git);
    expect(leituras).toEqual({ r: { loja: leitura({}) } });
    expect(pedidos).toHaveLength(2);
  });

  it('a árvore vazia segue o hash do repositório (SHA-256)', () => {
    expect(ARVORE_VAZIA.sha256).toHaveLength(64);
  });
});

describe('lerCommits', () => {
  it('o HEAD de cada repositório', async () => {
    const repositorios = [
      { nome: 'loja', caminho_local: '/p/loja' },
      { nome: 'lixo', caminho_local: '/p/lixo' },
    ];
    const { git } = gitFalso((_c, r) => (r === 'loja' ? `${REVELACAO}\n` : 'src/a.ts\0'));
    expect(await lerCommits(repositorios, git)).toEqual({ loja: REVELACAO });
  });
});

describe('mudancasParaOMestre', () => {
  const a = revelada(['src/a.ts', 'src/b.ts']);
  const responder = (diff: string) => (c: ComandoGitDaLeitura) => {
    if (c.tipo === 'diff') return diff;
    if (c.tipo !== 'diff_numstat') return '';
    if (c.de === REVELACAO)
      return numstat([3, 1, 'src/a.ts'], [0, 4, 'src/b.ts'], [2, 0, 'src/c.ts']);
    return c.ate === REVELACAO
      ? numstat([10, 0, 'src/a.ts'], [4, 0, 'src/b.ts'])
      : numstat([12, 0, 'src/a.ts']);
  };

  it('o diff da região desde a revelação e a lista dos arquivos alterados', async () => {
    const { git, pedidos } = gitFalso(responder('diff --git a/src/a.ts b/src/a.ts\n+x\n'));
    const m = await mudancasParaOMestre(a, 'r', git, 40_000);
    expect(m).toEqual({
      diff: 'diff --git a/src/a.ts b/src/a.ts\n+x\n',
      arquivos_alterados: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
    });
    expect(pedidos.at(-1)?.comando).toEqual({
      tipo: 'diff',
      de: REVELACAO,
      ate: 'HEAD',
      caminhos: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
    });
  });

  it('diff grande demais (em bytes) fica de fora; só a lista vai', async () => {
    const { git } = gitFalso(responder('é'.repeat(30)));
    expect(await mudancasParaOMestre(a, 'r', git, 59)).toEqual({
      arquivos_alterados: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
    });
    expect((await mudancasParaOMestre(a, 'r', git, 60)).diff).toHaveLength(30);
  });

  it('com vários repositórios, cada diff vem com o nome do seu', async () => {
    const repositorios = [
      { nome: 'front', caminho_local: '/p/front', commit: 'c'.repeat(40) },
      { nome: 'api', caminho_local: '/p/api', commit: 'c'.repeat(40) },
    ];
    const v = aventura(
      [
        regiao('r', ['front:a.ts', 'api:b.ts'], {
          revelada_em: { front: REVELACAO, api: REVELACAO },
        }),
      ],
      { r: 'desatualizada' },
      repositorios,
    );
    const { git } = gitFalso((c, r) =>
      c.tipo === 'diff'
        ? `+${r}\n`
        : c.tipo === 'diff_numstat' && c.de === REVELACAO
          ? numstat([1, 0, r === 'front' ? 'a.ts' : 'b.ts'])
          : '',
    );
    expect(await mudancasParaOMestre(v, 'r', git, 40_000)).toEqual({
      diff: '# front\n+front\n\n# api\n+api\n',
      arquivos_alterados: ['front:a.ts', 'api:b.ts'],
    });
  });
});
