FROM node:20-slim AS base

# 1. Instalar dependencias
FROM base AS deps
WORKDIR /app

COPY package*.json ./
# Evitamos error npm si existe legacy peer deps, o usamos npm ci
RUN npm install

# 2. Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Usamos NEXT_TELEMETRY_DISABLED para desactivar la telemetría durante el build
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# 3. Imagen final de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root para mayor seguridad
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid 1001 nextjs

# Copiar la carpeta public (si tienes assets estáticos)
COPY --from=builder /app/public ./public

# Crear directorio para la cache y dar permisos
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar el output standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Al usar standalone, server.js se genera en el root del standalone
CMD ["node", "server.js"]
