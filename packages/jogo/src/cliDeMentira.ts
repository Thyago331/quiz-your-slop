// As CLIs de mentira dos dois Mestres para os testes (não é exportado pelo pacote): o que cada uma
// imprime para uma saída, e para uma falha, no formato real de cada IA.
import type { RodarCli } from './adaptador.ts';
import type { IaDoMestre } from './criacao.ts';
import { conferirEsquema, type Esquema } from './esquema.ts';

/** O modo estrito obriga todo campo: o Codex escreve `null` onde o Mestre não tem o que dizer. */
export function comNulos(esquema: Esquema, valor: unknown): unknown {
  if (Array.isArray(valor)) {
    const itens = esquema.items;
    return itens ? valor.map((v) => comNulos(itens, v)) : valor;
  }
  if (typeof valor !== 'object' || valor === null || !esquema.properties) return valor;
  const objeto = valor as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(esquema.properties).map(([chave, sub]) => [
      chave,
      chave in objeto ? comNulos(sub, objeto[chave]) : null,
    ]),
  );
}

/** O stdout do `claude -p --output-format json`, ou a última mensagem do `codex exec`. */
export function saidaDaCli(ia: IaDoMestre, saida: unknown, schemaEnviado: Esquema): string {
  if (ia === 'claude_code') {
    return JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: '',
      structured_output: saida,
    });
  }
  const estrita = comNulos(schemaEnviado, saida);
  // A OpenAI não deixa sair nada fora do schema estrito: o fake também não.
  const problemas = conferirEsquema(schemaEnviado, estrita);
  if (problemas.length > 0) throw new Error(`fora do schema estrito: ${problemas.join('; ')}`);
  return JSON.stringify(estrita);
}

/** A CLI terminou sem saída estruturada (recusa, limite de tentativas da própria CLI). */
export function falhaDaCli(ia: IaDoMestre): string {
  return ia === 'claude_code'
    ? JSON.stringify({
        type: 'result',
        subtype: 'error_max_structured_output_retries',
        is_error: true,
      })
    : '';
}

/**
 * Uma CLI de mentira: cada resposta é uma saída do Mestre (vira o formato da IA), `'falha'` ou um
 * texto cru qualquer. Guarda os pedidos como a CLI os recebeu.
 */
export function cliDeMentira(ia: IaDoMestre, respostas: Record<string, unknown[]>) {
  const recebidos: Parameters<RodarCli>[0][] = [];
  const rodar: RodarCli = async (pedido) => {
    recebidos.push(pedido);
    const chamada = /Call: (\w+)/.exec(pedido.prompt)?.[1] ?? '';
    const fila = respostas[chamada];
    if (!fila?.length) throw new Error(`sem resposta para ${chamada}`);
    const r = fila.length > 1 ? fila.shift() : fila[0];
    if (r === 'falha') return falhaDaCli(ia);
    if (typeof r === 'string') return r;
    return saidaDaCli(ia, r, pedido.schema);
  };
  return { rodar, recebidos };
}
