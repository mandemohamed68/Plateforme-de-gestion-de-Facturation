# ------------------------------------------------------------------------------
# DOCKERFILE POUR SERVEUR LOCAL (NODE.JS + EXPRESS + REACT / VITE)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source complet
COPY . .

# Construction de l'application cliente et compilation du serveur
RUN npm run build

# ------------------------------------------------------------------------------
# Image d'exécution finale légère
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copie des artefacts de build et des dépendances nécessaires
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/types.ts ./src/types.ts

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
