# US Law MCP Server
# TypeScript + @ansvar/mcp-sqlite (better-sqlite3 native).
# Build: docker buildx build --platform linux/amd64 -t us-law-mcp .

FROM node:24-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
RUN npm rebuild better-sqlite3

COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

FROM node:24-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --omit=dev --ignore-scripts
RUN npm rebuild better-sqlite3
RUN apk del python3 make g++ && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY data/database.db ./data/database.db
RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/http-server.js"]
