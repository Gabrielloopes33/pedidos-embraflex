# Dockerfile para Backend Embraflex
# Para deploy em serviços que suportam Docker (Railway, Fly.io, etc)

FROM node:18-alpine AS builder

# Configurar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build

# Stage de produção
FROM node:18-alpine

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expor porta
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de start
CMD ["node", "dist/index.js"]
