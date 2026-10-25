// Um pedaço pequeno de JSON Schema: o bastante para descrever as saídas do Mestre e conferi-las.
// O mesmo objeto vai para a CLI (`--json-schema` / `--output-schema`) e é conferido aqui (regra 1
// da validação do contrato), então o que o Mestre recebe e o que o Jogo aceita não se separam.

export type TipoJson = 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean' | 'null';

export type Esquema = {
  type: TipoJson | readonly TipoJson[];
  description?: string;
  properties?: Readonly<Record<string, Esquema>>;
  required?: readonly string[];
  /** false recusa campos a mais; um esquema descreve os valores de um mapa (chave → valor). */
  additionalProperties?: false | Esquema;
  items?: Esquema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  enum?: readonly (string | number | null)[];
  minimum?: number;
  maximum?: number;
};

const tipoDe = (valor: unknown): TipoJson => {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (typeof valor === 'number') return Number.isInteger(valor) ? 'integer' : 'number';
  return typeof valor as TipoJson;
};

const aceita = (esperado: TipoJson, real: TipoJson) =>
  esperado === real || (esperado === 'number' && real === 'integer');

/** Os problemas de `valor` diante do esquema, como `caminho: o que está errado`; vazio = válido. */
export function conferirEsquema(esquema: Esquema, valor: unknown, caminho = '$'): string[] {
  const tipos: readonly TipoJson[] =
    typeof esquema.type === 'string' ? [esquema.type] : esquema.type;
  const real = tipoDe(valor);
  if (!tipos.some((t) => aceita(t, real))) {
    return [`${caminho}: esperava ${tipos.join(' ou ')}, veio ${real}`];
  }
  const problemas: string[] = [];
  if (esquema.enum && !esquema.enum.includes(valor as string | number | null)) {
    problemas.push(`${caminho}: fora de ${esquema.enum.join(', ')}`);
  }
  if (typeof valor === 'string' && esquema.minLength !== undefined) {
    if (valor.trim().length < esquema.minLength) problemas.push(`${caminho}: texto vazio`);
  }
  if (typeof valor === 'number') {
    if (esquema.minimum !== undefined && valor < esquema.minimum)
      problemas.push(`${caminho}: menor que ${esquema.minimum}`);
    if (esquema.maximum !== undefined && valor > esquema.maximum)
      problemas.push(`${caminho}: maior que ${esquema.maximum}`);
  }
  if (Array.isArray(valor)) {
    if (esquema.minItems !== undefined && valor.length < esquema.minItems)
      problemas.push(`${caminho}: menos de ${esquema.minItems} itens`);
    if (esquema.maxItems !== undefined && valor.length > esquema.maxItems)
      problemas.push(`${caminho}: mais de ${esquema.maxItems} itens`);
    const itens = esquema.items;
    if (itens)
      valor.forEach((v, k) => problemas.push(...conferirEsquema(itens, v, `${caminho}[${k}]`)));
  }
  if (real === 'object') {
    const objeto = valor as Record<string, unknown>;
    const propriedades = esquema.properties ?? {};
    for (const chave of esquema.required ?? []) {
      if (!(chave in objeto)) problemas.push(`${caminho}.${chave}: faltando`);
    }
    for (const [chave, v] of Object.entries(objeto)) {
      const sub = propriedades[chave];
      const extra = esquema.additionalProperties;
      if (sub) problemas.push(...conferirEsquema(sub, v, `${caminho}.${chave}`));
      else if (extra === false) problemas.push(`${caminho}.${chave}: campo desconhecido`);
      else if (extra) problemas.push(...conferirEsquema(extra, v, `${caminho}.${chave}`));
    }
  }
  return problemas;
}
