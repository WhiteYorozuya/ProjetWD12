# ─── Étape 1 : compilation ───
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm run build:seed

# Retire les dépendances de développement puis régénère le client Prisma
RUN npm prune --omit=dev && npx prisma generate

# ─── Étape 2 : image d'exécution minimale ───
FROM node:22-alpine
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-seed ./dist-seed
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json docker-entrypoint.sh ./
# Dossier du secret JWT généré (monté en volume, il hérite de ce propriétaire)
RUN mkdir -p /app/secrets && chown node:node /app/secrets && chmod 700 /app/secrets

# Ne jamais exécuter l'API en root
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget -qO- http://127.0.0.1:3000/api/sante || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "./docker-entrypoint.sh"]
