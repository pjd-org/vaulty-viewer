FROM node:22-alpine AS deps

WORKDIR /repo

ENV CI=1
ENV npm_config_cache=/tmp/.npm
ENV HOST=0.0.0.0
ENV PORT=8000

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Copy manifests first so dependency install stays cached across source edits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/viewer/package.json apps/viewer/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY apps/viewer apps/viewer
COPY packages/ui packages/ui

RUN pnpm --filter ./apps/viewer build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000
ENV HOME=/home/node

# Runtime needs node_modules for external imports in the SSR entry.
COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/apps/viewer/dist /app/dist
COPY --from=build /repo/apps/viewer/app/server-node.mjs /app/app/server-node.mjs

USER node

EXPOSE 8000

CMD ["node", "app/server-node.mjs"]
