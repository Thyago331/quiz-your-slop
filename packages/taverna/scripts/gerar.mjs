// Empacota codigo/** em src/arquivos.gerado.ts, para o código da Taverna ser lido como conteúdo.
// Uso: node scripts/gerar.mjs           → reescreve o arquivo gerado
//      node scripts/gerar.mjs --stdout  → só imprime (usado pelo teste de atualização)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pastaCodigo = join(raiz, 'codigo');
const destino = join(raiz, 'src', 'arquivos.gerado.ts');

function listar(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    return entrada.isDirectory() ? listar(caminho) : [caminho];
  });
}

export function gerar() {
  const caminhos = listar(pastaCodigo)
    .map((caminho) => relative(pastaCodigo, caminho).split(sep).join('/'))
    .sort();
  const linhas = caminhos.map((caminho) => {
    const conteudo = readFileSync(join(pastaCodigo, caminho), 'utf8');
    return `  ${JSON.stringify(caminho)}: ${JSON.stringify(conteudo)},`;
  });
  return [
    '// GERADO por scripts/gerar.mjs a partir de codigo/. Não edite à mão: rode `pnpm gerar`.',
    '',
    'export const ARQUIVOS: Readonly<Record<string, string>> = Object.freeze({',
    ...linhas,
    '});',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--stdout')) {
    process.stdout.write(gerar());
  } else {
    writeFileSync(destino, gerar());
    console.log(`Gerado ${relative(raiz, destino)}`);
  }
}
