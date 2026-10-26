# Imagem do site (spec §11): o Next.js standalone, no mesmo molde do transito-analyzer. Construída
# da raiz do monorepo, porque o site transpila os pacotes do workspace (@quiz/*):
#   docker build -t quiz-your-slop-site .
# A origem pública (SITE_URL) é lida em tempo de execução, então a mesma imagem serve qualquer
# domínio: nada de build-arg.
FROM node:22.22-alpine AS base
# O mesmo pnpm do `packageManager` da raiz, pelo corepack que vem com o Node 22.
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/site/package.json apps/site/
COPY apps/desktop/package.json apps/desktop/
COPY packages/i18n/package.json packages/i18n/
COPY packages/jogo/package.json packages/jogo/
COPY packages/taverna/package.json packages/taverna/
COPY packages/ui/package.json packages/ui/
# Só o site e os pacotes de que ele depende: nada do desktop (Tauri) nem das ferramentas da raiz.
RUN pnpm install --frozen-lockfile --filter @quiz/site...

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @quiz/site build

FROM node:22.22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# O standalone já traz o node_modules rastreado a partir da raiz; os estáticos vão ao lado (o
# site não tem pasta public: imagens de Open Graph e ícones são rotas).
COPY --from=build --chown=app:app /repo/apps/site/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/site/.next/static ./apps/site/.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
# As migrações do Postgres rodam ao subir (src/instrumentation.ts), antes de atender.
CMD ["node", "apps/site/server.js"]
