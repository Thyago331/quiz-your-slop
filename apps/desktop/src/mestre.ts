// O Mestre Claude Code atrás da interface única (@quiz/jogo): o transporte roda a CLI pela camada
// Rust (somente leitura, argumentos fixos lá) e tira a saída do envelope JSON.
import {
  arquivosDoProjeto,
  desembrulharClaudeCode,
  type ArquivosDoProjeto,
  type Repositorio,
  type Transporte,
} from '@quiz/jogo';
import { rodarGit, rodarMestre } from './sistema.ts';

/** A CLI roda na pasta do primeiro repositório; os outros entram só para leitura. */
export function transporteClaudeCode(repositorios: readonly Repositorio[]): Transporte {
  const [raiz = '', ...extras] = repositorios.map((r) => r.caminho_local);
  return async ({ prompt, schema }) =>
    desembrulharClaudeCode(
      await rodarMestre({ ia: 'claude_code', raiz, prompt, schema, raizes_extras: extras }),
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
