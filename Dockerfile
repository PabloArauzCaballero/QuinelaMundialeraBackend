# --- Etapa 1: Construcción (Build) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package.json yarn.lock ./

# Instalar dependencias (utiliza la caché de capas de Docker estándar si package/lock no cambian)
RUN yarn install

COPY . .
RUN yarn build

# --- Etapa 2: Imagen Final de Producción ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./

# Instalar dependencias de producción
RUN yarn install --production

# Copiar archivos construidos y configuraciones necesarias
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/src/database/seeders ./src/database/seeders
COPY --from=builder /app/src/database/sequelize-cli.config.cjs ./src/database/sequelize-cli.config.cjs
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

# Dar permisos de ejecución y cambiar propietario a usuario node
RUN chmod +x ./scripts/docker-entrypoint.sh && chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["yarn", "start:prod"]
