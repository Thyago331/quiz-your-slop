# Quiz your slop

> learn · gamification · unslop your code

Um game show/RPG em que o Jogador aprende como o próprio projeto funciona, com a IA dele como Mestre. O código do Jogador nunca sai da máquina dele. Spec em [`docs/spec-mvp.md`](docs/spec-mvp.md); vocabulário em [`CONTEXT.md`](CONTEXT.md).

## Partes

| Pasta           | O que é                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `apps/site`     | Site (Next.js): páginas públicas, conta, Tutorial no navegador, progresso |
| `apps/desktop`  | Jogo desktop (Tauri): joga no Projeto do Jogador com a IA dele            |
| `packages/jogo` | Regras do Jogo e validação do contrato com o Mestre (puro, sem DOM)       |
| `packages/ui`   | Interface compartilhada (React, pixel art JRPG)                           |

## Rodar

Requer Node 22 (`.node-version`) e pnpm (versão em `packageManager`).

```sh
pnpm install
pnpm dev            # site em http://localhost:3000 (saúde: /api/health)
pnpm dev:desktop    # frontend do desktop em http://localhost:1420
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### Jogo desktop (Tauri 2)

Requer Rust estável e, no Linux, o WebKitGTK 4.1 (`libwebkit2gtk-4.1-dev` ou `webkit2gtk4.1-devel`; lista completa no job `desktop` da CI).

```sh
pnpm --filter @quiz/desktop tauri dev            # abre a janela do Jogo
pnpm --filter @quiz/desktop tauri build --debug  # binário e pacotes em src-tauri/target
cd apps/desktop/src-tauri && cargo test && cargo clippy -- -D warnings
```

A camada Rust expõe só `rodar_mestre`, `rodar_git`, `ler_arquivo` (`src-tauri/src/lib.rs`), para a atualização automática, `verificar_atualizacao` e `instalar_atualizacao` (`src-tauri/src/atualizacao.rs`) e, para a Nova Aventura, `escolher_pasta`, `detectar_mestre`, `comando_do_mestre`, `salvar_aventura` e `carregar_aventuras` (`src-tauri/src/nova_aventura.rs`); a interface os chama por `apps/desktop/src/sistema.ts`. O seletor de pastas vem do `tauri-plugin-dialog`, mas só o Rust o usa: a janela não recebe nenhuma permissão `dialog:*` (`capabilities/principal.json`). Cada Aventura fica em `<dados do app>/aventuras/<uuid>.json` (no Linux, `~/.local/share/software.rapidsolutions.quizyourslop/`), nunca dentro do Projeto.

### Release do desktop

Uma tag `v<semver>` dispara `.github/workflows/release.yml`: compila no `ubuntu-22.04` (AppImage e `.deb`) e no `windows-latest` (instalador NSIS), dá nomes fixos aos arquivos (`quiz-your-slop-linux-x86_64.AppImage`, `quiz-your-slop-linux-amd64.deb`, `quiz-your-slop-windows-x64-setup.exe`: o site linka `releases/latest/download/<arquivo>`), gera os `.sig` e o `latest.json` do updater, o `SHA256SUMS.txt` de tudo e uma attestation por arquivo, e publica a Release. Rodar o workflow à mão (`workflow_dispatch`) é o ensaio: compila e deixa os arquivos no run, sem Release. A versão vem da tag; uma tag com sufixo (`v0.2.0-beta.1`) sai como pre-release.

Nada é assinado pelo sistema; o site explica o SmartScreen e como conferir (`/baixar`, `/verificar`). A atualização automática usa o `tauri-plugin-updater` só do Rust: a janela recebe os dois comandos, não a permissão `updater:*`, e o Jogo só instala o que estiver assinado com a chave do projeto (pública em `tauri.conf.json`, `plugins.updater.pubkey`; privada nos segredos `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`). A variável `QUIZ_SITE_URL` do repositório é a origem do site fixada no binário.

```sh
git tag v0.2.0 && git push origin v0.2.0   # publica a versão 0.2.0
```

### Conta (login com GitHub) e Postgres

Tudo no site exige conta, inclusive o Tutorial. Para o login funcionar localmente:

1. Suba o Postgres de desenvolvimento: `docker compose -f compose.dev.yaml up -d` (porta 5433, para não brigar com um Postgres já instalado; usuário/senha/banco `quiz`).
2. Crie uma GitHub OAuth App em <https://github.com/settings/developers> com callback `http://localhost:3000/api/auth/callback/github`.
3. Copie `apps/site/.env.example` para `apps/site/.env.local` e preencha `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET`. Para ver `/lista-de-espera/contagem`, ponha em `DONO_GITHUB_ID` o seu id numérico do GitHub (`gh api users/<login> -q .id`), não o login.
4. `pnpm dev`: as migrações rodam quando o servidor sobe.

Os testes de banco rodam só com `DATABASE_URL` definida (cada execução usa um schema descartável); sem ela, são pulados (a CI sobe um Postgres e os roda):

```sh
DATABASE_URL=postgres://quiz:quiz@localhost:5433/quiz pnpm test
```

## Licença

[MIT](LICENSE).
