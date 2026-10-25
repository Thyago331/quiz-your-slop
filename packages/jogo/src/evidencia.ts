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

export type EvidenciaConferida =
  | { ok: true; evidencia: Evidencia; relocalizada: boolean }
  | { ok: false; motivo: MotivoEvidenciaInvalida };

/**
 * Como conferirEvidencia, mas tolera linhas trocadas: se o trecho existe no arquivo, só que em
 * outras linhas, a Evidência é corrigida para as linhas onde ele está (a mais perto da citada).
 * O trecho continua sendo código de verdade; o Mestre só errou a conta das linhas.
 */
export function conferirOuRelocalizar(lerArquivo: LerArquivo, ev: Evidencia): EvidenciaConferida {
  const conferida = conferirEvidencia(lerArquivo, ev);
  if (conferida.ok) return { ok: true, evidencia: ev, relocalizada: false };
  if (conferida.motivo === 'arquivo_inexistente') return conferida;
  const alvo = semDiferencaDeEspaco(ev.trecho);
  if (!alvo) return conferida;
  const linhas = linhasDe(lerArquivo(ev.caminho) ?? '');
  const tamanho = linhasDe(ev.trecho.replace(/^\s*\n|\n\s*$/g, '')).length;
  let melhor: number | undefined;
  for (let k = 0; k + tamanho <= linhas.length; k++) {
    if (semDiferencaDeEspaco(linhas.slice(k, k + tamanho).join('\n')) !== alvo) continue;
    const inicio = k + 1;
    if (
      melhor === undefined ||
      Math.abs(inicio - ev.linha_inicio) < Math.abs(melhor - ev.linha_inicio)
    )
      melhor = inicio;
  }
  if (melhor === undefined) return conferida;
  return {
    ok: true,
    evidencia: { ...ev, linha_inicio: melhor, linha_fim: melhor + tamanho - 1 },
    relocalizada: true,
  };
}
