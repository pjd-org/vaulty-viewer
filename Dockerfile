FROM node:20-alpine AS build

WORKDIR /app

ENV CI=1
ENV GATSBY_TELEMETRY_DISABLED=1
ENV VAULT_CONTENT_PATH=/app/content

# Viewer is standalone - use npm for flat node_modules (Gatsby CLI requires it)
# Build context is apps/viewer only
COPY package.json ./
RUN npm install --include=dev

COPY . .

# Create a placeholder content directory for builds without vault
# The actual vault content will be mounted at runtime
RUN mkdir -p /app/content && \
  echo '---' > /app/content/.placeholder.md && \
  echo 'title: Placeholder' >> /app/content/.placeholder.md && \
  echo '---' >> /app/content/.placeholder.md && \
  echo 'This is a placeholder. Vault content will be loaded at runtime via API.' >> /app/content/.placeholder.md

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

# Create nginx config template (API_PROXY_URL will be substituted at runtime)
# Default: http://127.0.0.1:4300 for local pod, override with API_PROXY_URL env var
RUN printf '%s\n' \
  'server {' \
  '  listen 4400;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '' \
  '  # Proxy API requests to backend API service' \
  '  location /api/ {' \
  '    proxy_pass __API_PROXY_URL__;' \
  '    proxy_http_version 1.1;' \
  '    proxy_set_header Host $host;' \
  '    proxy_set_header X-Real-IP $remote_addr;' \
  '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
  '    proxy_set_header X-Forwarded-Proto $scheme;' \
  '  }' \
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
  > /etc/nginx/conf.d/default.conf.template && \
  cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf

EXPOSE 4400

CMD ["/app/scripts/start.sh"]
