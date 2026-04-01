FROM node:20-alpine AS build

WORKDIR /app

ENV CI=1
ENV npm_config_cache=/tmp/.npm
ENV HOST=0.0.0.0
ENV PORT=8000

# Use the same package manager/version as local to keep TanStack deps consistent.
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

# Resolve local workspace dependency (@vault/ui -> ../../packages/ui)
COPY packages/ui /packages/ui
COPY apps/viewer/package.json apps/viewer/pnpm-lock.yaml apps/viewer/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY apps/viewer .
RUN pnpm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/.output /app/.output

EXPOSE 8000

CMD ["node", ".output/server/index.mjs"]
