/**
 * O formato de um texto como lista de caminhos (`ui.batalha.vida`, `passos.0.titulo`): duas traduções
 * do mesmo texto têm de dar a mesma lista. Folhas que não são texto entram com o tipo.
 */
export function chavesDe(valor: unknown, prefixo = ''): string[] {
  if (Array.isArray(valor)) {
    return [
      `${prefixo}[${valor.length}]`,
      ...valor.flatMap((v, k) => chavesDe(v, `${prefixo}.${k}`)),
    ];
  }
  if (typeof valor === 'object' && valor !== null) {
    return Object.keys(valor)
      .sort()
      .flatMap((chave) =>
        chavesDe(
          (valor as Record<string, unknown>)[chave],
          prefixo ? `${prefixo}.${chave}` : chave,
        ),
      );
  }
  return [`${prefixo}:${typeof valor}`];
}

/** Os textos vazios de uma tradução (esquecidos ao copiar). */
export function textosVazios(valor: unknown, prefixo = ''): string[] {
  if (typeof valor === 'string') return valor.trim() ? [] : [prefixo];
  if (typeof valor === 'object' && valor !== null) {
    return Object.entries(valor).flatMap(([chave, v]) =>
      textosVazios(v, prefixo ? `${prefixo}.${chave}` : chave),
    );
  }
  return [];
}
