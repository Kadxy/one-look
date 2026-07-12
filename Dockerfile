FROM oven/bun:1.3.8-alpine AS base

# ---- Install dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time.
# To change the upload limit, rebuild with: --build-arg NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
ARG NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=3
ENV NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=${NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB}

# Placeholder so the module-level REDIS_URL check passes during build.
# No connection is made (lazyConnect); the real URL is injected at runtime.
ENV REDIS_URL="redis://build-placeholder:6379"

RUN bun run build

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
