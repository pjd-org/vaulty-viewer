FROM docker.io/library/node:22-alpine AS deps

WORKDIR /repo

ENV CI=1
ENV npm_config_cache=/tmp/.npm
ENV HOST=0.0.0.0
ENV PORT=8000

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

# Copy manifests first so dependency install stays cached across source edits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/viewer/package.json apps/viewer/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile
RUN pnpm dedupe

FROM deps AS build

COPY apps/viewer apps/viewer
COPY packages/ui packages/ui

RUN pnpm --filter ./packages/ui build
RUN pnpm --filter ./apps/viewer build

FROM docker.io/library/node:22-alpine AS runtime

WORKDIR /repo/apps/viewer

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000
ENV HOME=/home/node

# Preserve pnpm's workspace-relative symlinks.  Viewer node_modules entries
# point back to /repo/node_modules/.pnpm, so copying into /app breaks imports.
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/packages/ui /repo/packages/ui
COPY --from=build /repo/apps/viewer/node_modules /repo/apps/viewer/node_modules
COPY --from=build /repo/apps/viewer/dist /repo/apps/viewer/dist
COPY --from=build /repo/apps/viewer/app/server-node.mjs /repo/apps/viewer/app/server-node.mjs

USER node

EXPOSE 8000

CMD ["node", "app/server-node.mjs"]
