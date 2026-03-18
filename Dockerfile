FROM node:20-alpine AS build

WORKDIR /app

ENV CI=1
ENV npm_config_cache=/tmp/.npm
ENV HOST=0.0.0.0
ENV PORT=8000

# Resolve local workspace dependency (@vault/ui -> ../../packages/ui)
COPY packages/ui /packages/ui
COPY apps/viewer/package.json ./
RUN npm install --include=dev --no-audit --no-fund && rm -rf /tmp/.npm

COPY apps/viewer .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

COPY --from=build /app /app

EXPOSE 8000

CMD ["npm", "run", "start"]
