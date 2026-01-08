FROM node:20-alpine AS build

WORKDIR /app

ENV CI=1
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/vault

# Viewer is standalone - use npm for flat node_modules (Gatsby CLI requires it)
# Build context is apps/viewer only
COPY package.json ./
RUN npm install --include=dev

COPY . .
RUN ./node_modules/.bin/gatsby build

# Runtime: serve static Gatsby build with nginx + start-time env injection
FROM nginx:1.27-alpine

WORKDIR /app

ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/vault
ENV PORT=4400

# Copy built static site
COPY --from=build /app/public /usr/share/nginx/html

# Ensure config.json can be written at runtime, nginx cache/pid/logs dirs are writable
RUN touch /usr/share/nginx/html/config.json && chmod 666 /usr/share/nginx/html/config.json && \
  mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
  chmod -R 777 /var/cache/nginx && \
  touch /run/nginx.pid && chmod 666 /run/nginx.pid && \
  chmod -R 777 /var/log/nginx

# Copy runtime scripts for env injection
COPY --from=build /app/scripts /app/scripts
RUN chmod +x /app/scripts/start.sh

# Nginx config: listen on 4400 and support SPA-style routing fallback
RUN printf '%s\n' \
  'server {' \
  '  listen 4400;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '' \
  '  location ~* \\.(?:css|js|mjs|map|json|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$ {' \
  '    expires 30d;' \
  '    add_header Cache-Control "public, max-age=2592000, immutable";' \
  '    try_files $uri =404;' \
  '  }' \
  '' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '}' \
  > /etc/nginx/conf.d/default.conf

EXPOSE 4400

CMD ["/app/scripts/start.sh"]
