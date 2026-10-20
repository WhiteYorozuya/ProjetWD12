#!/bin/sh
# Démarrage de l'API en développement dans le conteneur node:22-alpine (docker-compose.dev.yml)
set -e

apk add --no-cache openssl > /dev/null   # requis par le moteur de migrations de Prisma

echo "▶ Installation des dépendances"
npm install --no-audit --no-fund

echo "▶ Client Prisma et migrations"
npx prisma generate
npx prisma migrate deploy

echo "▶ Données de démonstration (ignoré si la base n'est pas vide)"
npx prisma db seed

echo "▶ API en mode développement (rechargement à chaud)"
exec npm run start:dev
