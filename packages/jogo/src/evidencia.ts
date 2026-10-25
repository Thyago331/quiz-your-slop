import type { Evidencia, OpcaoApontar } from './contrato.ts';

export type MotivoEvidenciaInvalida =
  'arquivo_inexistente' | 'intervalo_invalido' | 'fora_do_arquivo' | 'trecho_diferente';

export type ResultadoEvidencia = { ok: true } | { ok: false; motivo: MotivoEvidenciaInvalida };

/** Lê o conteúdo de um arquivo do Projeto; undefined se não existe. */
export type LerArquivo = (caminho: string) => string | undefined;

function linhasDe(conteudo: string): string[] {
  const linhas = conteudo.split(/\r?\n/);
  // A quebra de linha final não abre uma linha nova.
  if (linhas.length > 0 && linhas[linhas.length - 1] === '') linhas.pop();
  return linhas;
}

function semDiferencaDeEspaco(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** Regra 2 da validação do contrato: a Evidência aponta para linhas reais e o trecho bate com elas. */
export function conferirEvidencia(lerArquivo: LerArquivo, ev: Evidencia): ResultadoEvidencia {
  const conteudo = lerArquivo(ev.caminho);
  if (conteudo === undefined) return { ok: false, motivo: 'arquivo_inexistente' };

  const { linha_inicio: inicio, linha_fim: fim } = ev;
  if (!Number.isInteger(inicio) || !Number.isInteger(fim) || inicio < 1 || inicio > fim) {
    return { ok: false, motivo: 'intervalo_invalido' };
  }

  const linhas = linhasDe(conteudo);
  if (fim > linhas.length) return { ok: false, motivo: 'fora_do_arquivo' };

  const real = linhas.slice(inicio - 1, fim).join('\n');
  if (semDiferencaDeEspaco(real) !== semDiferencaDeEspaco(ev.trecho)) {
    return { ok: false, motivo: 'trecho_diferente' };
  }
  return { ok: true };
}

export type ResultadoOpcaoApontar =
  { ok: true } | { ok: false; motivo: 'arquivo_inexistente' | 'simbolo_inexistente' };

/**
 * Regra 2, para Apontar no código: a opção aponta para um arquivo que existe e, se traz símbolo,
 * ele aparece no arquivo como nome inteiro (não como pedaço de outro identificador).
 */
export function conferirOpcaoApontar(
  lerArquivo: LerArquivo,
  opcao: OpcaoApontar,
): ResultadoOpcaoApontar {
  const conteudo = lerArquivo(opcao.caminho);
  if (conteudo === undefined) return { ok: false, motivo: 'arquivo_inexistente' };
  if (opcao.simbolo === undefined) return { ok: true };
  const escapado = opcao.simbolo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nomeInteiro = new RegExp(`(?<![\\w$])${escapado}(?![\\w$])`);
  return nomeInteiro.test(conteudo) ? { ok: true } : { ok: false, motivo: 'simbolo_inexistente' };
}
