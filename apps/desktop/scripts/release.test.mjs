// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ARTEFATOS,
  coletar,
  ehPreRelease,
  manifesto,
  publicar,
  somas,
  versaoDaTag,
} from './release.mjs';

const pastaTemporaria = () => mkdtempSync(path.join(tmpdir(), 'release-'));

/** Um `target/release/bundle` de mentira, com os nomes que o `tauri build` dá. */
function bundleFalso(versao = '1.2.3') {
  const bundle = pastaTemporaria();
  const arquivos = {
    appimage: `Quiz your slop_${versao}_amd64.AppImage`,
    deb: `Quiz your slop_${versao}_amd64.deb`,
    nsis: `Quiz your slop_${versao}_x64-setup.exe`,
  };
  for (const [pasta, nome] of Object.entries(arquivos)) {
    mkdirSync(path.join(bundle, pasta));
    writeFileSync(path.join(bundle, pasta, nome), `binario ${pasta}`);
    writeFileSync(path.join(bundle, pasta, `${nome}.sig`), `assinatura ${pasta}\n`);
  }
  return bundle;
}

describe('versaoDaTag', () => {
  it('tira o v da tag e recusa o resto', () => {
    expect(versaoDaTag('v1.2.3')).toBe('1.2.3');
    expect(versaoDaTag('v0.2.0-beta.1')).toBe('0.2.0-beta.1');
    expect(ehPreRelease('0.2.0-beta.1')).toBe(true);
    expect(ehPreRelease('1.2.3')).toBe(false);
    for (const ruim of ['1.2.3', 'v1.2', 'v1.2.3;rm', 'refs/tags/v1.2.3', ''])
      expect(() => versaoDaTag(ruim)).toThrow();
  });
});

describe('nomes fixos', () => {
  it('nenhum nome de artefato carrega a versão', () => {
    expect(ARTEFATOS.map((a) => a.arquivo)).toEqual([
      'quiz-your-slop-linux-x86_64.AppImage',
      'quiz-your-slop-linux-amd64.deb',
      'quiz-your-slop-windows-x64-setup.exe',
    ]);
    for (const a of ARTEFATOS) expect(a.arquivo).not.toMatch(/\d+\.\d+/);
  });

  it('coleta cada plataforma com os nomes fixos e os .sig', () => {
    const bundle = bundleFalso();
    const saida = pastaTemporaria();
    expect(coletar(bundle, saida, 'linux')).toEqual([
      'quiz-your-slop-linux-x86_64.AppImage',
      'quiz-your-slop-linux-x86_64.AppImage.sig',
      'quiz-your-slop-linux-amd64.deb',
      'quiz-your-slop-linux-amd64.deb.sig',
    ]);
    expect(coletar(bundle, saida, 'windows')).toEqual([
      'quiz-your-slop-windows-x64-setup.exe',
      'quiz-your-slop-windows-x64-setup.exe.sig',
    ]);
    expect(readFileSync(path.join(saida, 'quiz-your-slop-linux-amd64.deb'), 'utf8')).toBe(
      'binario deb',
    );
  });

  it('recusa sobras de outro build e plataformas desconhecidas', () => {
    const bundle = bundleFalso();
    writeFileSync(path.join(bundle, 'deb', 'Quiz your slop_0.0.1_amd64.deb'), 'velho');
    expect(() => coletar(bundle, pastaTemporaria(), 'linux')).toThrow(/esperava um \.deb/);
    expect(() => coletar(bundle, pastaTemporaria(), 'macos')).toThrow(/desconhecida/);
  });
});

describe('latest.json', () => {
  it('aponta cada alvo do updater para o arquivo da tag, com a assinatura dele', () => {
    const dados = manifesto({
      versao: '1.2.3',
      tag: 'v1.2.3',
      repositorio: 'Thyago331/quiz-your-slop',
      assinaturas: {
        'quiz-your-slop-linux-x86_64.AppImage': 'sig-a',
        'quiz-your-slop-linux-amd64.deb': 'sig-d',
        'quiz-your-slop-windows-x64-setup.exe': 'sig-w',
      },
      data: '2026-10-25T12:00:00Z',
      notas: 'n',
    });
    const base = 'https://github.com/Thyago331/quiz-your-slop/releases/download/v1.2.3/';
    expect(dados).toEqual({
      version: '1.2.3',
      notes: 'n',
      pub_date: '2026-10-25T12:00:00Z',
      platforms: {
        'linux-x86_64-appimage': {
          signature: 'sig-a',
          url: `${base}quiz-your-slop-linux-x86_64.AppImage`,
        },
        'linux-x86_64': { signature: 'sig-a', url: `${base}quiz-your-slop-linux-x86_64.AppImage` },
        'linux-x86_64-deb': { signature: 'sig-d', url: `${base}quiz-your-slop-linux-amd64.deb` },
        'windows-x86_64-nsis': {
          signature: 'sig-w',
          url: `${base}quiz-your-slop-windows-x64-setup.exe`,
        },
        'windows-x86_64': {
          signature: 'sig-w',
          url: `${base}quiz-your-slop-windows-x64-setup.exe`,
        },
      },
    });
  });

  it('sem a assinatura de um artefato, não publica', () => {
    expect(() =>
      manifesto({ versao: '1', tag: 'v1', repositorio: 'r', assinaturas: {}, data: '', notas: '' }),
    ).toThrow(/sem a assinatura/);
  });
});

describe('publicar', () => {
  it('escreve o latest.json e o SHA256SUMS.txt de tudo, no formato do sha256sum', () => {
    const bundle = bundleFalso();
    const pasta = pastaTemporaria();
    coletar(bundle, pasta, 'linux');
    coletar(bundle, pasta, 'windows');
    const nomes = publicar(
      pasta,
      'v1.2.3',
      'Thyago331/quiz-your-slop',
      new Date(Date.UTC(2026, 9, 25)),
    );
    expect(nomes).toContain('latest.json');
    expect(nomes).toContain('SHA256SUMS.txt');
    const latest = JSON.parse(readFileSync(path.join(pasta, 'latest.json'), 'utf8'));
    expect(latest.version).toBe('1.2.3');
    expect(latest.pub_date).toBe('2026-10-25T00:00:00Z');
    expect(latest.platforms['linux-x86_64-deb'].signature).toBe('assinatura deb');

    const linhas = readFileSync(path.join(pasta, 'SHA256SUMS.txt'), 'utf8').trim().split('\n');
    expect(linhas.map((l) => l.split('  ')[1])).toEqual(
      nomes.filter((n) => n !== 'SHA256SUMS.txt'),
    );
    expect(linhas.every((l) => /^[0-9a-f]{64} {2}\S+$/.test(l))).toBe(true);
  });

  it.runIf(process.platform === 'linux')('o sha256sum -c confere o arquivo gerado', () => {
    const pasta = pastaTemporaria();
    writeFileSync(path.join(pasta, 'a.bin'), 'a');
    writeFileSync(path.join(pasta, 'SHA256SUMS.txt'), somas(pasta, ['a.bin']));
    const env = { ...process.env, LC_ALL: 'C' };
    const saida = execFileSync('sha256sum', ['-c', 'SHA256SUMS.txt'], { cwd: pasta, env });
    expect(saida.toString()).toBe('a.bin: OK\n');
  });
});
