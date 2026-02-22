FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:22-alpine AS production

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S mcpserver && \
    adduser -u 1001 -S mcpserver -G mcpserver

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /build/dist ./dist
COPY data/database.db ./data/database.db

RUN chown -R mcpserver:mcpserver /app
USER mcpserver

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/src/http-server.js"]
