# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Makassar
RUN apt-get update \
  && apt-get install -y --no-install-recommends tzdata \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run typecheck && npm run lint && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p /app/data /app/backups && chown -R nextjs:nodejs /app/data /app/backups
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
