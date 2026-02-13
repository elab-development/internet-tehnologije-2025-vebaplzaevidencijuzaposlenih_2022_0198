#!/bin/sh
set -e

echo "✅ Waiting for database..."
# cekamo da DB bude spremna
until nc -z db 5432; do
  sleep 1
done

echo "✅ Running migrations..."
npx prisma migrate deploy

echo "✅ Running seed..."
node prisma/seed.js

echo "✅ Starting Next.js..."
npm run start
