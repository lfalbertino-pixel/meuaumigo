#!/bin/sh
set -e

# ==========================================================
# Boot da aplicação.
#
# Migrations e GRANTs rodam com o papel DONO, nunca com o da aplicação:
# a app não pode ter permissão de alterar o próprio schema.
# ==========================================================

echo "→ Aplicando migrations..."
DATABASE_URL="${DATABASE_URL_OWNER:-$DATABASE_URL}" npx prisma migrate deploy

echo "→ Aplicando GRANTs..."
DATABASE_URL="${DATABASE_URL_OWNER:-$DATABASE_URL}" \
  npx prisma db execute --file prisma/sql/grants.sql --schema prisma/schema.prisma

echo "→ Semeando (idempotente: não toca em banco que já tem animal)..."
node_modules/.bin/tsx prisma/seed.ts || echo "  aviso: semente falhou, seguindo"

exec "$@"
