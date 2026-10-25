import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { IDIOMAS } from '@quiz/i18n';
import { metadadosDaPagina } from '@/seo/metadados';
import { PAGINAS_PUBLICAS } from '@/seo/paginas';
import { PAGINA as BAIXAR } from '@/textos/baixar';
import { SITE } from '@/textos/site';
import { PAGINA as VERIFICAR, VERIFICAR as TEXTOS_DE_VERIFICAR } from '@/textos/verificar';
import { ARTEFATOS, COMANDOS, COMANDOS_DA_SECAO, SOMAS, urlDaUltimaVersao } from './artefatos';

const env = { SITE_URL: 'https://quiz.example' };

describe('links de download', () => {
  it('apontam para a última Release, com nome fixo (sem versão)', () => {
    expect(ARTEFATOS.map((a) => urlDaUltimaVersao(a.arquivo))).toEqual([
      'https://github.com/Thyago331/quiz-your-slop/releases/latest/download/quiz-your-slop-windows-x64-setup.exe',
      'https://github.com/Thyago331/quiz-your-slop/releases/latest/download/quiz-your-slop-linux-x86_64.AppImage',
      'https://github.com/Thyago331/quiz-your-slop/releases/latest/download/quiz-your-slop-linux-amd64.deb',
    ]);
    expect(urlDaUltimaVersao(SOMAS)).toBe(
      'https://github.com/Thyago331/quiz-your-slop/releases/latest/download/SHA256SUMS.txt',
    );
  });

  it('usam os mesmos nomes que o workflow de release dá aos arquivos', () => {
    const script = readFileSync(
      new URL('../../../desktop/scripts/release.mjs', import.meta.url),
      'utf8',
    );
    for (const { arquivo } of ARTEFATOS) expect(script).toContain(`arquivo: '${arquivo}'`);
    expect(script).toContain(`'${SOMAS}'`);
  });

  it('os comandos de verificação conferem o arquivo do Jogo neste repositório', () => {
    expect(COMANDOS.somasLinux).toBe('sha256sum -c --ignore-missing SHA256SUMS.txt');
    expect(COMANDOS.somasWindows).toBe(
      'Get-FileHash .\\quiz-your-slop-windows-x64-setup.exe -Algorithm SHA256',
    );
    expect(COMANDOS.attestation).toBe(
      'gh attestation verify quiz-your-slop-windows-x64-setup.exe --repo Thyago331/quiz-your-slop',
    );
  });

  it('cada rótulo de comando da página de verificação tem o seu comando', () => {
    for (const idioma of IDIOMAS) {
      for (const secao of TEXTOS_DE_VERIFICAR[idioma].secoes) {
        expect(secao.comandos.length, `${idioma} ${secao.id}`).toBe(
          (COMANDOS_DA_SECAO[secao.id] ?? []).length,
        );
      }
    }
  });

  it('a página de verificação explica o SmartScreen com os botões do Windows em cada idioma', () => {
    const passos = (idioma: (typeof IDIOMAS)[number]) =>
      TEXTOS_DE_VERIFICAR[idioma].secoes.find((s) => s.id === 'smartscreen')!.passos.join(' ');
    expect(passos('pt')).toContain('"Mais informações"');
    expect(passos('pt')).toContain('"Executar assim mesmo"');
    expect(passos('en')).toContain('"More info"');
    expect(passos('en')).toContain('"Run anyway"');
    expect(passos('es')).toContain('"Más información"');
    expect(passos('es')).toContain('"Ejecutar de todas formas"');
  });
});

describe('páginas de download e verificação', () => {
  it('entram no sitemap e no llms.txt como páginas públicas', () => {
    const caminhos = PAGINAS_PUBLICAS.map((p) => p.caminho);
    expect(caminhos).toContain('/baixar');
    expect(caminhos).toContain('/verificar');
  });

  it('têm canonical e hreflang próprios em cada idioma', () => {
    const m = metadadosDaPagina(VERIFICAR, 'es', env);
    expect(m.title).toBe('Verificar la descarga');
    expect(m.alternates).toEqual({
      canonical: 'https://quiz.example/es/verificar',
      languages: {
        'pt-BR': 'https://quiz.example/pt/verificar',
        en: 'https://quiz.example/en/verificar',
        es: 'https://quiz.example/es/verificar',
        'x-default': 'https://quiz.example/pt/verificar',
      },
    });
    expect(metadadosDaPagina(BAIXAR, 'en', env).openGraph).toMatchObject({
      url: 'https://quiz.example/en/baixar',
      title: 'Download the Game',
    });
  });

  it('o download está na navegação de todo idioma, e a verificação no rodapé', () => {
    for (const idioma of IDIOMAS) {
      expect(SITE[idioma].navegacao.map((n) => n.href)).toContain('/baixar');
      expect(SITE[idioma].verificar).toBe(VERIFICAR.textos[idioma].titulo);
    }
  });
});
