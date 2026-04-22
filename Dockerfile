FROM node:20-alpine AS build

WORKDIR /app

ENV CI=1
ENV npm_config_cache=/tmp/.npm
ENV HOST=0.0.0.0
ENV PORT=8000

# Use the same package manager/version as local to keep TanStack deps consistent.
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

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
ENV HOME=/home/node

# Runtime needs node_modules for external imports in dist/server/server.js
# (react, @tanstack/react-router, etc. are not bundled)
COPY --from=build /app/node_modules /app/node_modules
# Vite SSR build output (client assets + server render module)
COPY --from=build /app/dist /app/dist
# Node.js HTTP adapter — adapts the WinterCG { fetch } export to http.createServer
COPY --from=build /app/app/server-node.mjs /app/app/server-node.mjs

USER node

EXPOSE 8000

CMD ["node", "app/server-node.mjs"]
