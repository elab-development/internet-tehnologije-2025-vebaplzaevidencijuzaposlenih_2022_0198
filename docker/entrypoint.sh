#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')

# Fallback if port not parsed (some URLs omit it)
if [ -z "$DB_PORT" ] || [ "$DB_PORT" = "$DATABASE_URL" ]; then
  DB_PORT=5432
fi

echo "✅ Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "✅ Running migrations..."
npx prisma migrate deploy

echo "✅ Running seed..."
node prisma/seed.js

echo "✅ Starting Next.js..."
npm run start
