# ─── Étape 1 : construction de l'application Vue ───
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_COMPTES_DEMO=false
ENV VITE_COMPTES_DEMO=$VITE_COMPTES_DEMO
RUN npm run build

# ─── Étape 2 : Nginx sert l'application et relaie /api vers le backend ───
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
