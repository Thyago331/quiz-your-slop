// @vitest-environment node
// Nenhuma telemetria no Jogo (spec §8): a interface não tem rede nenhuma (a CSP só deixa o IPC do
// Tauri) e, no Rust, os únicos destinos são o site (login e /api/progresso) e o updater. Quem
// mexer nisso precisa mexer aqui também, de propósito.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));
const desktop = join(raiz, 'apps/desktop');
const tauri = join(desktop, 'src-tauri');

function arquivos(pasta: string, extensoes: readonly string[]): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho, extensoes);
    return extensoes.some((e) => nome.endsWith(e)) ? [caminho] : [];
  });
}

const ler = (caminho: string) => readFileSync(caminho, 'utf8');
const nome = (caminho: string) => relative(raiz, caminho).replace(/\\/g, '/');
const ehTeste = (caminho: string) => /\.test\.tsx?$|teste\.setup\.ts$/.test(caminho);

// O código que vai para o webview do Jogo: o desktop e os pacotes que ele empacota.
const DA_INTERFACE = [
  'apps/desktop/src',
  'packages/jogo/src',
  'packages/ui/src',
  'packages/i18n/src',
]
  .flatMap((p) => arquivos(join(raiz, p), ['.ts', '.tsx']))
  .filter((c) => !ehTeste(c))
  // Fixture dos testes (o código de um Projeto de mentira, como texto).
  .filter((c) => !c.endsWith('packages/jogo/src/projetoDeTeste.ts'));

describe('sem telemetria: a interface', () => {
  it('nunca abre conexão por conta própria', () => {
    const proibidos = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bWebSocket\b/,
      /\bEventSource\b/,
      /\bsendBeacon\b/,
      /\bnew\s+Image\s*\(/,
      /@tauri-apps\/plugin-/,
    ];
    const achados = DA_INTERFACE.flatMap((c) =>
      proibidos.filter((p) => p.test(ler(c))).map((p) => `${nome(c)}: ${p}`),
    );
    expect(achados).toEqual([]);
  });

  it('a fixture com fetch só é usada pelos testes', () => {
    const usam = DA_INTERFACE.filter((c) => /projetoDeTeste/.test(ler(c)));
    expect(usam.map(nome)).toEqual([]);
  });

  it('só sistema.ts fala com a camada Rust', () => {
    const usam = DA_INTERFACE.filter((c) => /@tauri-apps\/api/.test(ler(c)));
    expect(usam.map(nome)).toEqual(['apps/desktop/src/sistema.ts']);
  });

  it('nenhuma dependência de rede ou plugin do Tauri na interface', () => {
    const pacote = JSON.parse(ler(join(desktop, 'package.json'))) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(pacote.dependencies).sort()).toEqual([
      '@quiz/i18n',
      '@quiz/jogo',
      '@quiz/ui',
      '@tauri-apps/api',
      'react',
      'react-dom',
    ]);
  });

  it('a CSP continua sem rede além do IPC (e do Vite, só em desenvolvimento)', () => {
    const conf = JSON.parse(ler(join(tauri, 'tauri.conf.json')));
    const comum = {
      'default-src': "'self'",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self'",
      'font-src': "'self'",
      'object-src': "'none'",
      'base-uri': "'none'",
      'form-action': "'none'",
      'frame-ancestors': "'none'",
    };
    expect(conf.app.withGlobalTauri).toBe(false);
    expect(conf.app.security.csp).toEqual({
      ...comum,
      'script-src': "'self'",
      'connect-src': 'ipc: http://ipc.localhost',
    });
    expect(conf.app.security.devCsp).toEqual({
      ...comum,
      'script-src': "'self' 'unsafe-inline'",
      'connect-src': 'ipc: http://ipc.localhost ws://localhost:1420',
    });
    expect(conf.app.security.capabilities).toEqual(['principal']);
  });

  it('a janela só tem as permissões dos comandos da lista fechada', () => {
    const cap = JSON.parse(ler(join(tauri, 'capabilities/principal.json'))) as {
      permissions: string[];
    };
    expect(cap.permissions.every((p) => /^allow-[a-z-]+$/.test(p))).toBe(true);
  });
});

describe('sem telemetria: a camada Rust', () => {
  const rust = arquivos(join(tauri, 'src'), ['.rs']);
  // Só o código que roda: os módulos de teste ficam de fora.
  const semTestes = (texto: string) => texto.split('#[cfg(test)]')[0]!;

  it('só login/site.rs faz HTTP, e só para a API do próprio site', () => {
    const http = rust.filter((c) => /\bureq\b/.test(ler(c)));
    expect(http.map(nome)).toEqual(['apps/desktop/src-tauri/src/login/site.rs']);
    const site = semTestes(ler(http[0]!));
    const chamadas = [...site.matchAll(/\.(get|post|put|delete|patch|head)\(\s*([^)]*)\)/g)].map(
      ([, metodo, url]) => `${metodo!.toUpperCase()} ${url}`,
    );
    expect(chamadas.sort()).toEqual([
      'GET format!("{origem}/api/desktop/eu"',
      'GET format!("{origem}/api/progresso"',
      'POST format!("{origem}/api/desktop/sair"',
      'POST format!("{origem}/api/desktop/token"',
      'PUT format!("{origem}/api/progresso"',
    ]);
  });

  it('nada de socket fora do loopback do login', () => {
    const sockets = rust.filter((c) =>
      /TcpStream::connect|UdpSocket|TcpListener::bind/.test(semTestes(ler(c))),
    );
    expect(sockets.map(nome)).toEqual(['apps/desktop/src-tauri/src/login/mod.rs']);
    expect(semTestes(ler(sockets[0]!))).toMatch(/TcpListener::bind\(\("127\.0\.0\.1", 0\)\)/);
  });

  it('o navegador só abre no login do site e na issue nova do repositório do Jogo', () => {
    const abrem = rust.filter((c) => /\bopen::/.test(semTestes(ler(c))));
    expect(abrem.map(nome).sort()).toEqual([
      'apps/desktop/src-tauri/src/login/mod.rs',
      'apps/desktop/src-tauri/src/relatorio.rs',
    ]);
    expect(ler(join(tauri, 'src/relatorio.rs'))).toContain(
      'pub const ISSUE_NOVA: &str = "https://github.com/Thyago331/quiz-your-slop/issues/new";',
    );
  });

  it('o updater só procura a Release do GitHub', () => {
    const conf = JSON.parse(ler(join(tauri, 'tauri.conf.json')));
    expect(conf.plugins.updater.endpoints).toEqual([
      'https://github.com/Thyago331/quiz-your-slop/releases/latest/download/latest.json',
    ]);
  });

  it('nenhuma biblioteca de rede além do ureq (e do updater)', () => {
    const cargo = ler(join(tauri, 'Cargo.toml'));
    const dependencias = cargo
      .split('[dependencies]')[1]!
      .split(/^\[/m)[0]!
      .split('\n')
      .map((l) => /^([a-z0-9_-]+)\s*=/.exec(l)?.[1])
      .filter(Boolean);
    expect(dependencias.sort()).toEqual([
      'base64',
      'dunce',
      'getrandom',
      'keyring',
      'open',
      'serde',
      'serde_json',
      'sha2',
      'tauri',
      'tauri-plugin-dialog',
      'tauri-plugin-updater',
      'tempfile',
      'ureq',
    ]);
  });
});
