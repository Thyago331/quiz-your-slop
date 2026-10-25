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

### Conta (login com GitHub) e Postgres

Tudo no site exige conta, inclusive o Tutorial. Para o login funcionar localmente:

1. Suba o Postgres de desenvolvimento: `docker compose -f compose.dev.yaml up -d` (porta 5433, para não brigar com um Postgres já instalado; usuário/senha/banco `quiz`).
2. Crie uma GitHub OAuth App em <https://github.com/settings/developers> com callback `http://localhost:3000/api/auth/callback/github`.
3. Copie `apps/site/.env.example` para `apps/site/.env.local` e preencha `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET`.
4. `pnpm dev`: as migrações rodam quando o servidor sobe.

Os testes de banco rodam só com `DATABASE_URL` definida (cada execução usa um schema descartável); sem ela, como na CI, são pulados:

```sh
DATABASE_URL=postgres://quiz:quiz@localhost:5433/quiz pnpm test
```
