# ============================================================
# ETAPA 1: CONSTRUCCIÓN (Build)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN npm run build

# ============================================================
# ETAPA 2: SERVIDOR NGINX ALPINE (Solo sirve archivos)
# ============================================================
FROM nginx:alpine

# Configuración mínima para SPA
RUN echo 'server { \
    listen 3001; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
