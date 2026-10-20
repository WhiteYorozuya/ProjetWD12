#!/bin/sh
# Tests de bout en bout dans le conteneur de développement, sur la base DÉDIÉE aster_test (vidée par les tests)
set -e
export DATABASE_URL="postgresql://aster:aster@db:5432/aster_test?schema=public"
npx prisma migrate deploy
npm run test:e2e
