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
