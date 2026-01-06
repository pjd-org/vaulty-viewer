FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/vault

COPY package.json ./
RUN corepack enable && pnpm install

COPY . .

EXPOSE 8000

CMD ["./scripts/start.sh"]
