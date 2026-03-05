FROM docker.io/library/node:20-bookworm-slim AS builder

WORKDIR /app

# Enable Gatsby/Sharp native deps
RUN apt-get update && apt-get install -y git build-essential python3 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV GATSBY_TELEMETRY_DISABLED=1
# Allow Gatsby build to read vault content at build time if mounted;
# falls back to the bundled ./content directory.
ENV VAULT_CONTENT_PATH=/app/content

# Give Node enough heap for a Gatsby build in constrained environments.
ENV NODE_OPTIONS=--max-old-space-size=2048

# Create vault directory for gatsby-source-filesystem
RUN mkdir -p /app/content

# Copy package manifest + lockfile first for layer-cache efficiency.
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts=false

# Copy source after deps so source changes don't bust the dep cache.
COPY . .

# Build the site at image-build time — not at container start.
RUN pnpm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM docker.io/library/node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/vault

# BUILD_ON_START=0: build already happened at image-build time.
# Set to 1 only as an escape hatch (e.g. dev with live vault mount).
ENV BUILD_ON_START=0

RUN mkdir -p /vault

# Copy built artefacts + runtime node_modules from builder.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.cache ./.cache
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
# Copy source files so BUILD_ON_START=1 can rebuild against a live vault mount.
COPY --from=builder /app/gatsby-config.mjs ./gatsby-config.mjs
COPY --from=builder /app/gatsby-node.js ./gatsby-node.js
COPY --from=builder /app/gatsby-browser.js ./gatsby-browser.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/static ./static
COPY scripts ./scripts

EXPOSE 8000

CMD ["sh", "/app/scripts/start.sh"]
