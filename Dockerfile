# syntax=docker/dockerfile:1

FROM node:22.21-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Unprivileged nginx listens on 8080 and runs as a non-root user.
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

# API_ORIGIN: where the browser calls the API. Empty means same origin, with /api proxied to API_UPSTREAM.
ENV API_ORIGIN="" \
    API_UPSTREAM="http://server:8080"

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
