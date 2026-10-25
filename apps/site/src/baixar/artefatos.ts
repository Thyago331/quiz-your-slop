// Os arquivos do Jogo desktop no GitHub Releases (spec §10). Os nomes são fixos, sem versão (o
// workflow de release os renomeia: apps/desktop/scripts/release.mjs), então
// `releases/latest/download/<arquivo>` aponta sempre para a última versão publicada.
import { REPOSITORIO } from '@/seo/site';

export type IdDoArtefato = 'windows' | 'appimage' | 'deb';

export type Artefato = { id: IdDoArtefato; arquivo: string };

/** Na ordem em que aparecem no site. */
export const ARTEFATOS: readonly Artefato[] = [
  { id: 'windows', arquivo: 'quiz-your-slop-windows-x64-setup.exe' },
  { id: 'appimage', arquivo: 'quiz-your-slop-linux-x86_64.AppImage' },
  { id: 'deb', arquivo: 'quiz-your-slop-linux-amd64.deb' },
];

export const SOMAS = 'SHA256SUMS.txt';

/** O `owner/nome` do repositório, para o `gh attestation verify --repo`. */
export const NOME_DO_REPOSITORIO = REPOSITORIO.replace('https://github.com/', '');

export const PAGINA_DAS_RELEASES = `${REPOSITORIO}/releases`;

/** O arquivo da última Release publicada (pre-releases ficam de fora). */
export const urlDaUltimaVersao = (arquivo: string) =>
  `${REPOSITORIO}/releases/latest/download/${encodeURIComponent(arquivo)}`;

const arquivoDe = (id: IdDoArtefato) => ARTEFATOS.find((a) => a.id === id)!.arquivo;

/** Os comandos da página de verificação; iguais em todo idioma. */
export const COMANDOS = {
  instalarDeb: `sudo apt install ./${arquivoDe('deb')}`,
  executarAppImage: `chmod +x ${arquivoDe('appimage')} && ./${arquivoDe('appimage')}`,
  somasLinux: `sha256sum -c --ignore-missing ${SOMAS}`,
  somasWindows: `Get-FileHash .\\${arquivoDe('windows')} -Algorithm SHA256`,
  attestation: `gh attestation verify ${arquivoDe('windows')} --repo ${NOME_DO_REPOSITORIO}`,
} as const;

/** Os comandos de cada seção da página de verificação, na ordem dos rótulos dela. */
export const COMANDOS_DA_SECAO: Readonly<Record<string, readonly string[]>> = {
  checksum: [COMANDOS.somasLinux, COMANDOS.somasWindows],
  attestation: [COMANDOS.attestation],
};
