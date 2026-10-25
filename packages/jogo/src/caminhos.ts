// Caminhos do Projeto (docs/contrato-mestre.md, Princípios): relativos à raiz do repositório e,
// quando o Projeto tem mais de um, prefixados pelo nome dele (`loja-api:src/orders/service.ts`).

/** Um repositório do Projeto: o nome que o Jogo deu e a pasta na máquina do Jogador. */
export type Repositorio = { nome: string; caminho_local: string };

const ultimaParte = (pasta: string) =>
  pasta
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .pop() || 'projeto';

/**
 * Nomes únicos para as pastas escolhidas: o nome da pasta, sem `:` (o separador do prefixo) nem
 * espaços nas pontas; repetidos ganham `-2`, `-3`...
 */
export function nomearRepositorios(pastas: readonly string[]): Repositorio[] {
  const usados = new Set<string>();
  return pastas.map((caminho_local) => {
    const base = ultimaParte(caminho_local).replace(/:/g, '-').trim() || 'projeto';
    let nome = base;
    for (let n = 2; usados.has(nome); n++) nome = `${base}-${n}`;
    usados.add(nome);
    return { nome, caminho_local };
  });
}

/** O caminho como o Jogo guarda: com prefixo só quando há mais de um repositório. */
export function caminhoNoProjeto(
  repositorios: readonly Repositorio[],
  repositorio: string,
  relativo: string,
): string {
  return repositorios.length > 1 ? `${repositorio}:${relativo}` : relativo;
}

export type CaminhoSeparado = { repositorio: string; relativo: string };

/**
 * Confere um caminho que veio do Mestre e o devolve normalizado (sem `./`, com `/`), ou o motivo
 * da recusa. Pastas valem com `pasta: true` (`.` ou vazio = a raiz do repositório). Num Projeto de
 * um repositório só, um prefixo com o nome dele é tolerado e tirado.
 */
export function normalizarCaminho(
  repositorios: readonly Repositorio[],
  caminho: string,
  opcoes: { pasta?: boolean } = {},
): { ok: true; caminho: string; partes: CaminhoSeparado } | { ok: false; motivo: string } {
  const varios = repositorios.length > 1;
  let repositorio = repositorios[0]?.nome ?? '';
  let resto = caminho.trim();
  const doisPontos = resto.indexOf(':');
  // `C:\...` é caminho absoluto do Windows, não prefixo.
  const ehUnidade = /^[a-zA-Z]:[\\/]/.test(resto);
  if (doisPontos >= 0 && !ehUnidade) {
    const prefixo = resto.slice(0, doisPontos);
    if (!repositorios.some((r) => r.nome === prefixo)) {
      return { ok: false, motivo: `repositório desconhecido em ${caminho}` };
    }
    repositorio = prefixo;
    resto = resto.slice(doisPontos + 1);
  } else if (varios) {
    return { ok: false, motivo: `sem o prefixo do repositório: ${caminho}` };
  }
  resto = resto.replace(/\\/g, '/');
  if (resto.startsWith('/') || ehUnidade)
    return { ok: false, motivo: `caminho absoluto: ${caminho}` };
  const partes = resto.split('/').filter((p) => p !== '' && p !== '.');
  if (partes.includes('..')) return { ok: false, motivo: `caminho com ..: ${caminho}` };
  if (partes.length === 0 && !opcoes.pasta)
    return { ok: false, motivo: `caminho vazio: ${caminho}` };
  const relativo = partes.length === 0 ? '.' : partes.join('/');
  return {
    ok: true,
    caminho: caminhoNoProjeto(repositorios, repositorio, relativo),
    partes: { repositorio, relativo },
  };
}

/** O Projeto como conjunto de arquivos commitados (`git ls-files` de cada repositório). */
export type ArquivosDoProjeto = {
  arquivos: ReadonlySet<string>;
  /** Pastas que têm algum arquivo (inclui `.` e `repo:.`, as raízes). */
  pastas: ReadonlySet<string>;
};

/** Junta a saída do `git ls-files -z` de cada repositório nos caminhos do Projeto. */
export function arquivosDoProjeto(
  repositorios: readonly Repositorio[],
  saidas: Readonly<Record<string, string>>,
): ArquivosDoProjeto {
  const arquivos = new Set<string>();
  const pastas = new Set<string>();
  for (const r of repositorios) {
    pastas.add(caminhoNoProjeto(repositorios, r.nome, '.'));
    for (const relativo of (saidas[r.nome] ?? '').split('\0')) {
      if (!relativo) continue;
      arquivos.add(caminhoNoProjeto(repositorios, r.nome, relativo));
      const partes = relativo.split('/');
      for (let k = 1; k < partes.length; k++) {
        pastas.add(caminhoNoProjeto(repositorios, r.nome, partes.slice(0, k).join('/')));
      }
    }
  }
  return { arquivos, pastas };
}
