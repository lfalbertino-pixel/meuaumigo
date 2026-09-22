# ==========================================================
# Multi-stage: o runner sai só com o standalone do Next, o Prisma e o
# que o entrypoint precisa para migrar e semear.
# ==========================================================

FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

# ----------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Valor fictício: o build só precisa que o Prisma gere o client e que o
# schema de ambiente seja satisfeito. Nada aqui alcança banco de verdade.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate && npm run build

# ----------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# openssl: exigido pelo engine do Prisma. wget: healthcheck do compose.
RUN apt-get update && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m aumigo

COPY --from=builder /app/public ./public
COPY --from=builder --chown=aumigo:nodejs /app/.next/standalone ./
COPY --from=builder --chown=aumigo:nodejs /app/.next/static ./.next/static

# node_modules completo, prisma/ e scripts/: o entrypoint roda
# `migrate deploy`, os GRANTs e a semente de demonstração.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Fotos e vídeos dos animais, comprovantes de despesa.
RUN mkdir -p /app/storage/animais /app/storage/comprovantes \
    && chown -R aumigo:nodejs /app/storage

USER aumigo
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
