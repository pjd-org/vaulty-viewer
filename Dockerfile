FROM docker.io/library/node:20-bookworm-slim

WORKDIR /app

# Enable Gatsby/Sharp native deps
RUN apt-get update && apt-get install -y git build-essential python3 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/vault

# Create vault directory for gatsby-source-filesystem
RUN mkdir -p /vault

# Copy viewer app files
COPY . .

# Install dependencies from monorepo workspace
RUN corepack enable && pnpm install --ignore-scripts=false && pnpm rebuild sharp gatsby gatsby-cli

EXPOSE 8000

CMD ["sh", "/app/scripts/start.sh"]
