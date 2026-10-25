// Os passos do workflow de release (.github/workflows/release.yml) que não cabem numa linha de
// shell: a versão a partir da tag, os nomes fixos dos artefatos, o latest.json do updater e o
// SHA256SUMS.txt. Sem dependências: roda com o Node do runner, em Linux e Windows.
//
//   node scripts/release.mjs versao <tag>                  → imprime a versão (v1.2.3 → 1.2.3)
//   node scripts/release.mjs coletar <bundle> <saida> <linux|windows>
//   node scripts/release.mjs publicar <pasta> <tag> <repositorio>
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Os artefatos de cada plataforma, com nome fixo (sem versão): o site linka
 * `releases/latest/download/<arquivo>` e o link não muda de uma versão para outra. `pasta` e
 * `extensao` dizem onde o `tauri build` deixa cada um em `target/release/bundle`. Os três são
 * também os pacotes do updater, cada um com o seu `.sig` (`createUpdaterArtifacts`).
 */
export const ARTEFATOS = [
  {
    plataforma: 'linux',
    alvos: ['linux-x86_64-appimage', 'linux-x86_64'],
    pasta: 'appimage',
    extensao: '.AppImage',
    arquivo: 'quiz-your-slop-linux-x86_64.AppImage',
  },
  {
    plataforma: 'linux',
    alvos: ['linux-x86_64-deb'],
    pasta: 'deb',
    extensao: '.deb',
    arquivo: 'quiz-your-slop-linux-amd64.deb',
  },
  {
    plataforma: 'windows',
    alvos: ['windows-x86_64-nsis', 'windows-x86_64'],
    pasta: 'nsis',
    extensao: '-setup.exe',
    arquivo: 'quiz-your-slop-windows-x64-setup.exe',
  },
];

export const SOMAS = 'SHA256SUMS.txt';
export const MANIFESTO = 'latest.json';

/** `v1.2.3` (ou `v1.2.3-beta.1`) → `1.2.3`; qualquer outra coisa é recusada. */
export function versaoDaTag(tag) {
  const m = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag);
  if (!m) throw new Error(`tag fora do formato v<semver>: ${tag}`);
  return m[1];
}

/** Uma versão com sufixo (`-beta.1`) sai como pre-release e não vira a "latest". */
export const ehPreRelease = (versao) => versao.includes('-');

/**
 * Copia os artefatos de uma plataforma (e os `.sig`) de `target/release/bundle` para `saida`,
 * com os nomes fixos. Exatamente um arquivo por artefato: sobras de outro build são erro.
 */
export function coletar(bundle, saida, plataforma) {
  mkdirSync(saida, { recursive: true });
  const copiados = [];
  for (const a of ARTEFATOS.filter((x) => x.plataforma === plataforma)) {
    const pasta = path.join(bundle, a.pasta);
    const achados = readdirSync(pasta).filter((n) => n.endsWith(a.extensao));
    if (achados.length !== 1) {
      throw new Error(`esperava um ${a.extensao} em ${pasta}, achei: ${achados.join(', ') || '-'}`);
    }
    for (const sufixo of ['', '.sig']) {
      copyFileSync(path.join(pasta, achados[0] + sufixo), path.join(saida, a.arquivo + sufixo));
      copiados.push(a.arquivo + sufixo);
    }
  }
  if (copiados.length === 0) throw new Error(`plataforma desconhecida: ${plataforma}`);
  return copiados;
}

/**
 * O latest.json que o updater lê em `releases/latest/download/latest.json`. As URLs apontam para a
 * tag (não para "latest"), então cada assinatura fica presa ao arquivo da própria versão; a chave
 * `{os}-{arch}-{instalador}` vem antes, e o plugin cai em `{os}-{arch}` se não achar.
 */
export function manifesto({ versao, tag, repositorio, assinaturas, data, notas }) {
  const plataformas = {};
  for (const a of ARTEFATOS) {
    const assinatura = assinaturas[a.arquivo];
    if (!assinatura) throw new Error(`sem a assinatura de ${a.arquivo}`);
    const url = `https://github.com/${repositorio}/releases/download/${tag}/${a.arquivo}`;
    for (const alvo of a.alvos) plataformas[alvo] = { signature: assinatura, url };
  }
  return { version: versao, notes: notas, pub_date: data, platforms: plataformas };
}

/** As linhas do `sha256sum` (hash, dois espaços, nome), para `sha256sum -c SHA256SUMS.txt`. */
export function somas(pasta, nomes) {
  return [...nomes]
    .sort()
    .map((nome) => {
      const hash = createHash('sha256').update(readFileSync(path.join(pasta, nome)));
      return `${hash.digest('hex')}  ${nome}\n`;
    })
    .join('');
}

/**
 * Na pasta com os artefatos das duas plataformas: escreve o latest.json e, por último, o
 * SHA256SUMS.txt de tudo o que vai para a Release (artefatos, `.sig` e o latest.json).
 */
export function publicar(pasta, tag, repositorio, agora = new Date()) {
  const versao = versaoDaTag(tag);
  const assinaturas = Object.fromEntries(
    ARTEFATOS.map((a) => [
      a.arquivo,
      readFileSync(path.join(pasta, `${a.arquivo}.sig`), 'utf8').trim(),
    ]),
  );
  const dados = manifesto({
    versao,
    tag,
    repositorio,
    assinaturas,
    data: agora.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    notas: `https://github.com/${repositorio}/releases/tag/${tag}`,
  });
  writeFileSync(path.join(pasta, MANIFESTO), JSON.stringify(dados, null, 2) + '\n');
  const nomes = readdirSync(pasta).filter((n) => n !== SOMAS);
  writeFileSync(path.join(pasta, SOMAS), somas(pasta, nomes));
  return [...nomes, SOMAS].sort();
}

function principal([comando, ...args]) {
  if (comando === 'versao') return console.log(versaoDaTag(args[0] ?? ''));
  if (comando === 'coletar') return console.log(coletar(args[0], args[1], args[2]).join('\n'));
  if (comando === 'publicar') return console.log(publicar(args[0], args[1], args[2]).join('\n'));
  throw new Error(`comando desconhecido: ${comando}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal(process.argv.slice(2));
