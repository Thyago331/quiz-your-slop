// O explorador de código: a árvore de arquivos do Projeto como o Jogador a vê (spec §9).
// Arquivo de Região na Névoa aparece só como forma — sem caminho nem nome — para não vazar nada.
import type { EstadoNoMapa } from './mapa.ts';

export type ArquivoNoExplorador =
  | {
      tipo: 'arquivo';
      naNevoa: false;
      nome: string;
      caminho: string;
      /** null = arquivo fora de toda Região. */
      regiaoId: string | null;
    }
  | { tipo: 'arquivo'; naNevoa: true; nome: string };

/** Pasta: na Névoa quando tudo dentro dela está na Névoa (aí o nome também é mascarado). */
export type PastaNoExplorador = {
  tipo: 'pasta';
  naNevoa: boolean;
  nome: string;
  filhos: NoExplorador[];
};

export type NoExplorador = PastaNoExplorador | ArquivoNoExplorador;

/** Um Território com a sua árvore; territorioId null = "Outros arquivos". */
export type GrupoDoExplorador = {
  territorioId: string | null;
  nome: string;
  filhos: NoExplorador[];
};

export type EntradaDoExplorador = {
  territorios: readonly { id: string; nome: string }[];
  regioes: readonly { id: string; territorio_id: string; arquivos: readonly string[] }[];
  estados: Readonly<Record<string, EstadoNoMapa>>;
  /** Todos os arquivos do Projeto, se conhecidos: os fora de toda Região também entram. */
  todos?: readonly string[];
};

/** O nome do grupo dos arquivos fora de toda Região; a tela mostra o seu, traduzido. */
const NOME_OUTROS_ARQUIVOS = 'Outros arquivos';

/** O nome borrado: mesmo tamanho, só pontos e barras de verdade. */
export function mascarar(nome: string): string {
  return nome.replace(/[^./]/g, 'x');
}

type Folha = { caminho: string; regiaoId: string | null; naNevoa: boolean };

type PastaCrua = { pastas: Map<string, PastaCrua>; arquivos: Map<string, Folha> };

function montar(folhas: readonly Folha[]): PastaCrua {
  const raiz: PastaCrua = { pastas: new Map(), arquivos: new Map() };
  for (const folha of folhas) {
    const partes = folha.caminho.split('/');
    const nome = partes.pop()!;
    let pasta = raiz;
    for (const parte of partes) {
      let filha = pasta.pastas.get(parte);
      if (!filha) pasta.pastas.set(parte, (filha = { pastas: new Map(), arquivos: new Map() }));
      pasta = filha;
    }
    pasta.arquivos.set(nome, folha);
  }
  return raiz;
}

const emOrdem = <T>(mapa: Map<string, T>) =>
  [...mapa].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

function converter(pasta: PastaCrua): NoExplorador[] {
  const pastas = emOrdem(pasta.pastas).map(([nome, crua]): PastaNoExplorador => {
    let rotulo = nome;
    let atual = crua;
    // Cadeia de pastas de um filho só vira uma linha: web/src/ em vez de web/ → src/.
    for (;;) {
      const [unica, ...outras] = [...atual.pastas];
      if (atual.arquivos.size > 0 || !unica || outras.length > 0) break;
      rotulo = `${rotulo}/${unica[0]}`;
      atual = unica[1];
    }
    const filhos = converter(atual);
    const naNevoa = filhos.every((f) => f.naNevoa);
    return { tipo: 'pasta', naNevoa, nome: naNevoa ? mascarar(rotulo) : rotulo, filhos };
  });
  const arquivos = emOrdem(pasta.arquivos).map(([nome, folha]): ArquivoNoExplorador =>
    folha.naNevoa
      ? { tipo: 'arquivo', naNevoa: true, nome: mascarar(nome) }
      : { tipo: 'arquivo', naNevoa: false, nome, caminho: folha.caminho, regiaoId: folha.regiaoId },
  );
  return [...pastas, ...arquivos];
}

/**
 * A árvore do explorador: um grupo por Território, na ordem dada, e dentro dele as pastas.
 * Arquivos fora de toda Região (ou de Região num Território desconhecido) vão para "Outros
 * arquivos" no fim; a Névoa cobre Regiões, então um arquivo sem Região fica visível.
 * Região sem estado conta como Névoa.
 */
export function arvoreDoExplorador({
  territorios,
  regioes,
  estados,
  todos = [],
}: EntradaDoExplorador): GrupoDoExplorador[] {
  const porTerritorio = new Map<string | null, Folha[]>();
  const vistos = new Set<string>();
  const conhecidos = new Set(territorios.map((t) => t.id));
  const juntar = (territorioId: string | null, folha: Folha) => {
    vistos.add(folha.caminho);
    const lista = porTerritorio.get(territorioId) ?? [];
    lista.push(folha);
    porTerritorio.set(territorioId, lista);
  };

  for (const regiao of regioes) {
    const naNevoa = (estados[regiao.id] ?? 'nevoa') === 'nevoa';
    const territorioId = conhecidos.has(regiao.territorio_id) ? regiao.territorio_id : null;
    for (const caminho of regiao.arquivos) {
      if (!vistos.has(caminho)) juntar(territorioId, { caminho, regiaoId: regiao.id, naNevoa });
    }
  }
  for (const caminho of todos) {
    if (!vistos.has(caminho)) juntar(null, { caminho, regiaoId: null, naNevoa: false });
  }

  const grupos: GrupoDoExplorador[] = territorios.map((t) => ({
    territorioId: t.id,
    nome: t.nome,
    filhos: converter(montar(porTerritorio.get(t.id) ?? [])),
  }));
  const soltos = porTerritorio.get(null);
  if (soltos) {
    grupos.push({
      territorioId: null,
      nome: NOME_OUTROS_ARQUIVOS,
      filhos: converter(montar(soltos)),
    });
  }
  return grupos;
}

/** Os caminhos que o Jogador pode abrir: os arquivos visíveis da árvore. */
export function caminhosVisiveis(grupos: readonly GrupoDoExplorador[]): Set<string> {
  const caminhos = new Set<string>();
  const visitar = (nos: readonly NoExplorador[]) => {
    for (const no of nos) {
      if (no.tipo === 'pasta') visitar(no.filhos);
      else if (!no.naNevoa) caminhos.add(no.caminho);
    }
  };
  for (const grupo of grupos) visitar(grupo.filhos);
  return caminhos;
}
