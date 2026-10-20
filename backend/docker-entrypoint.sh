#!/bin/sh
set -e

# Secret JWT : fourni par l'environnement, sinon généré une fois et conservé dans le volume /app/secrets
if [ -z "$JWT_SECRET" ]; then
  FICHIER=/app/secrets/jwt_secret
  if [ ! -s "$FICHIER" ]; then
    echo "▶ Génération d'un secret JWT aléatoire"
    node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64'))" > "$FICHIER"
    chmod 600 "$FICHIER"
  fi
  JWT_SECRET="$(cat "$FICHIER")"
  export JWT_SECRET
fi

echo "▶ Application des migrations de base de données"
npx prisma migrate deploy

if [ "$SEED_DEMO" = "true" ]; then
  echo "▶ Chargement des données de démonstration (ignoré si la base n'est pas vide)"
  node dist-seed/seed.js
fi

echo "▶ Démarrage de l'API"
exec node dist/main.js
