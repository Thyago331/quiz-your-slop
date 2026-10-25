const BASE = 'https://destino.invalid';

/**
 * Para onde voltar depois do login: só caminhos deste site, para o `?de=` não virar redirect aberto.
 * Recusa barra invertida e qualquer espaço ou caractere de controle (o navegador tira tab e quebra
 * de linha, e `/\t/mal.example` viraria `//mal.example`); devolve o caminho já normalizado, que
 * também não pode começar com `//` (`/.//mal.example` normaliza para isso).
 */
export function destinoSeguro(de: string | string[] | undefined): string {
  const caminho = Array.isArray(de) ? de[0] : de;
  if (!caminho || !caminho.startsWith('/') || /[\s\p{Cc}\\]/u.test(caminho)) return '/';
  let url: URL;
  try {
    url = new URL(caminho, BASE);
  } catch {
    return '/';
  }
  const normalizado = `${url.pathname}${url.search}${url.hash}`;
  if (url.origin !== BASE || normalizado.startsWith('//')) return '/';
  return normalizado;
}
