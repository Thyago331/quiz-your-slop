// A Região desatualizada no desktop (spec §6): o `git` de cada repositório pela camada Rust, para a
// detecção (@quiz/jogo) ao abrir a Aventura e para a Expedição sobre o que mudou.
import {
  detectarDesatualizadas,
  lerMudancas,
  type AventuraNoProjeto,
  type MudancaDaRegiao,
  type RodarGit,
} from '@quiz/jogo';
import { rodarGit } from './sistema.ts';

/** Cada comando roda na pasta do repositório; a camada Rust confere a lista fechada. */
export const gitDoProjeto: RodarGit = (repositorio, comando) =>
  rodarGit(repositorio.caminho_local, comando);

/**
 * Lê o que mudou desde cada revelação e aplica a regra. `atual` dá a Aventura como estiver quando
 * o `git` terminar (o Jogador pode ter mexido nela no meio): a regra roda sobre essa.
 */
export async function detectarNoProjeto(
  aventura: AventuraNoProjeto,
  atual: () => AventuraNoProjeto = () => aventura,
): Promise<{ aventura: AventuraNoProjeto; mudancas: Record<string, MudancaDaRegiao> }> {
  const leituras = await lerMudancas(aventura, gitDoProjeto);
  return detectarDesatualizadas(atual(), leituras);
}
