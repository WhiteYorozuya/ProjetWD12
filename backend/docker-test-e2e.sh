#!/bin/sh
# Tests de bout en bout dans le conteneur de développement, sur la base DÉDIÉE parcform_test (vidée par les tests)
set -e
export DATABASE_URL="postgresql://parcform:parcform@db:5432/parcform_test?schema=public"
npx prisma migrate deploy
npm run test:e2e
