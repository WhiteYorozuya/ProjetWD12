#!/bin/sh
set -e

echo "▶ Application des migrations de base de données"
npx prisma migrate deploy

if [ "$SEED_DEMO" = "true" ]; then
  echo "▶ Chargement des données de démonstration (ignoré si la base n'est pas vide)"
  node dist-seed/seed.js
fi

echo "▶ Démarrage de l'API"
exec node dist/main.js
