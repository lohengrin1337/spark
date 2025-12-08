# syntax=docker/dockerfile:1
FROM caddy:2-alpine AS base

RUN addgroup -g 1001 caddygroup && \
    adduser -D -u 1001 -G caddygroup caddyuser

FROM base AS development
WORKDIR /usr/share/caddy


COPY --chown=caddyuser:caddygroup Caddyfile /etc/caddy/Caddyfile

RUN mkdir -p /usr/share/caddy && \
    cp -r html/* /usr/share/caddy/ 2>/dev/null || echo "No pre-built html, using volume mount"
USER caddyuser

EXPOSE 80
