// O Mestre da Aventura (Claude Code ou Codex) atrás da interface única (@quiz/jogo): o transporte
// roda a CLI pela camada Rust (somente leitura, argumentos fixos lá) e o adaptador da IA ajusta o
// schema e tira a saída do que a CLI devolveu.
import {
  adaptadorDoMestre,
  arquivosDoProjeto,
  normalizarCaminho,
  type ArquivosDoProjeto,
  type IaDoMestre,
  type LerArquivoDoProjeto,
  type Repositorio,
  type Transporte,
} from '@quiz/jogo';
import { lerArquivo, rodarGit, rodarMestre } from './sistema.ts';

/** A CLI roda na pasta do primeiro repositório; os outros entram só para leitura. */
export function transporteDoMestre(
  ia: IaDoMestre,
  repositorios: readonly Repositorio[],
): Transporte {
  const [raiz = '', ...extras] = repositorios.map((r) => r.caminho_local);
  return adaptadorDoMestre(ia, ({ prompt, schema }) =>
    rodarMestre({ ia, raiz, prompt, schema, raizes_extras: extras }),
  );
}

/** Os arquivos commitados de cada repositório (`git ls-files`), para conferir os caminhos do Mestre. */
export async function lerArquivosDoProjeto(
  repositorios: readonly Repositorio[],
): Promise<ArquivosDoProjeto> {
  const saidas: Record<string, string> = {};
  for (const r of repositorios) {
    saidas[r.nome] = await rodarGit(r.caminho_local, { tipo: 'ls_files', caminhos: [] });
  }
  return arquivosDoProjeto(repositorios, saidas);
}

/**
 * Lê arquivos do Projeto pelo caminho do Jogo (`repo:caminho` com vários repositórios) pela camada
 * Rust, que confere a raiz. O que já foi lido fica no cache: a conferência das Evidências e o
 * explorador de código leem os mesmos arquivos. Arquivo recusado (grande, binário) conta como ausente.
 */
export function leitorDoProjeto(repositorios: readonly Repositorio[]): {
  ler: LerArquivoDoProjeto;
  cache: Map<string, string | undefined>;
} {
  const cache = new Map<string, string | undefined>();
  const ler: LerArquivoDoProjeto = async (caminho) => {
    if (cache.has(caminho)) return cache.get(caminho);
    const r = normalizarCaminho(repositorios, caminho);
    const repositorio = r.ok && repositorios.find((x) => x.nome === r.partes.repositorio);
    const conteudo =
      r.ok && repositorio
        ? await lerArquivo(repositorio.caminho_local, r.partes.relativo).catch(() => undefined)
        : undefined;
    cache.set(caminho, conteudo);
    return conteudo;
  };
  return { ler, cache };
}
