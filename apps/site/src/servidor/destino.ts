/** Para onde voltar depois do login: só caminhos deste site, para o `?de=` não virar redirect aberto. */
export function destinoSeguro(de: string | string[] | undefined): string {
  const caminho = Array.isArray(de) ? de[0] : de;
  if (!caminho || !caminho.startsWith('/') || caminho.startsWith('//') || caminho.includes('\\'))
    return '/';
  return caminho;
}
