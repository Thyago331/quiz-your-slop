// O Mestre Codex (`codex exec --output-schema <arquivo> --output-last-message <arquivo>`). A última
// mensagem do agente vai para o arquivo e é a saída: o JSON puro, sem envelope (conferido na
// v0.149.1). O `--output-schema` usa o modo estrito da OpenAI: todo campo em `required`,
// `additionalProperties: false` e nenhum campo opcional. Então o campo opcional vira obrigatório
// e anulável no schema enviado, e o `null` dele volta a ser ausente antes da conferência do Jogo.
import type { Esquema, TipoJson } from './esquema.ts';
import { SaidaInvalida } from './mestre.ts';

const tiposDe = (esquema: Esquema): readonly TipoJson[] =>
  typeof esquema.type === 'string' ? [esquema.type] : esquema.type;

const aceitaNulo = (esquema: Esquema) => tiposDe(esquema).includes('null');

function anulavel(esquema: Esquema): Esquema {
  if (aceitaNulo(esquema)) return esquema;
  return {
    ...esquema,
    type: [...tiposDe(esquema), 'null'],
    ...(esquema.enum && { enum: [...esquema.enum, null] }),
  };
}

/** O mesmo schema no modo estrito da OpenAI; a mesma saída, com `null` no lugar de ausente. */
export function esquemaEstrito(esquema: Esquema): Esquema {
  const estrito: Esquema = { ...esquema };
  if (esquema.items) estrito.items = esquemaEstrito(esquema.items);
  if (esquema.properties || tiposDe(esquema).includes('object')) {
    if (esquema.additionalProperties !== undefined && esquema.additionalProperties !== false) {
      // Mapa (chave → valor) não existe no modo estrito; nenhuma saída do Mestre usa.
      throw new Error('esquemaEstrito: mapa não cabe no modo estrito');
    }
    const propriedades = esquema.properties ?? {};
    const obrigatorias = esquema.required ?? [];
    estrito.properties = Object.fromEntries(
      Object.entries(propriedades).map(([chave, sub]) => {
        const s = esquemaEstrito(sub);
        return [chave, obrigatorias.includes(chave) ? s : anulavel(s)];
      }),
    );
    estrito.required = Object.keys(propriedades);
    estrito.additionalProperties = false;
  }
  return estrito;
}

/**
 * Tira o `null` dos campos opcionais do schema original. No modo estrito, ausente e `null` são a
 * mesma coisa; nos opcionais que já aceitavam null (o `regiao_id` de uma Opção), o Jogo também os
 * trata igual.
 */
export function tirarNulosOpcionais(esquema: Esquema, valor: unknown): unknown {
  if (Array.isArray(valor)) {
    const itens = esquema.items;
    return itens ? valor.map((v) => tirarNulosOpcionais(itens, v)) : valor;
  }
  if (typeof valor !== 'object' || valor === null || !esquema.properties) return valor;
  const obrigatorias = esquema.required ?? [];
  const limpo: Record<string, unknown> = {};
  for (const [chave, v] of Object.entries(valor)) {
    const sub = esquema.properties[chave];
    if (!sub) limpo[chave] = v;
    else if (v === null && !obrigatorias.includes(chave)) continue;
    else limpo[chave] = tirarNulosOpcionais(sub, v);
  }
  return limpo;
}

/**
 * A última mensagem do Codex, como o JSON da saída para o schema original. Mensagem vazia ou que
 * não é JSON é `SaidaInvalida` (nova tentativa).
 */
export function desembrulharCodex(ultimaMensagem: string, esquema: Esquema): string {
  const texto = ultimaMensagem.trim();
  if (!texto) throw new SaidaInvalida(['a CLI não devolveu a última mensagem']);
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new SaidaInvalida([`a última mensagem não é JSON: ${texto.slice(0, 200)}`]);
  }
  return JSON.stringify(tirarNulosOpcionais(esquema, valor));
}
