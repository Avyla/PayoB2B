# Etapa 1: Base - Dependencias y Prisma
FROM node:20-alpine AS base
WORKDIR /app
# Instalar OpenSSL necesario para Prisma
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Etapa 2: Construcción
FROM base AS builder
WORKDIR /app
COPY . .
# Generar el cliente de Prisma
RUN npx prisma generate
# Construir el código TypeScript
RUN npm run build

# Etapa 3: Producción
FROM node:20-alpine AS runner
WORKDIR /app
# Instalar OpenSSL
RUN apk add --no-cache openssl

# Copiar package.json y dependencias instaladas (incluyendo node_modules para evitar reinstalar en prod)
# Para una imagen aún más ligera, podríamos hacer 'npm ci --only=production' pero requeriría regenerar Prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# (Opcional) Copiar credenciales si se pasan por archivo, aunque es mejor inyectar variables de entorno.
# COPY --from=builder /app/*.json ./

# Establecer entorno
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Usamos node para ejecutar el compilado
CMD ["node", "dist/index.js"]
