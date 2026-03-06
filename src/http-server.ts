#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './server-metadata.js';
import { registerTools } from './tools/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_ENV_VAR = 'US_LAW_DB_PATH';

function resolveDbPath(): string {
  if (process.env[DB_ENV_VAR]) return process.env[DB_ENV_VAR]!;
  const relative = join(__dirname, '..', '..', 'data', 'database.db');
  if (existsSync(relative)) return relative;
  const alt = join(__dirname, '..', 'data', 'database.db');
  if (existsSync(alt)) return alt;
  throw new Error(`Database not found. Set ${DB_ENV_VAR} or ensure data/database.db exists`);
}

async function main() {
  const dbPath = resolveDbPath();
  const { default: Database } = await import('@ansvar/mcp-sqlite');
  const db = new Database(dbPath, { readonly: true });

  const sessions = new Map<string, StreamableHTTPServerTransport>();

  function createMCPServer(): Server {
    const server = new Server(
      { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      { capabilities: { tools: {} } },
    );
    registerTools(server, db);
    return server;
  }

  const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (url.pathname === '/health' && req.method === 'GET') {
        let dbOk = false;
        try {
          db.prepare('SELECT 1').get();
          dbOk = true;
        } catch {
          // DB not healthy
        }
        res.writeHead(dbOk ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: dbOk ? 'ok' : 'degraded',
          server: MCP_SERVER_NAME,
          version: MCP_SERVER_VERSION,
        }));
        return;
      }

      if (url.pathname === '/mcp') {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (sessionId && sessions.has(sessionId)) {
          await sessions.get(sessionId)!.handleRequest(req, res);
          return;
        }

        if (req.method === 'POST') {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
          });
          const server = createMCPServer();
          await server.connect(transport);
          transport.onclose = () => {
            if (transport.sessionId) sessions.delete(transport.sessionId);
          };
          await transport.handleRequest(req, res);
          if (transport.sessionId) sessions.set(transport.sessionId, transport);
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request — missing or invalid session' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      console.error('[HTTP] Unhandled error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`${MCP_SERVER_NAME} v${MCP_SERVER_VERSION} HTTP server listening on port ${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down...');
    for (const [, t] of sessions) t.close().catch(() => {});
    sessions.clear();
    try { db.close(); } catch {}
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
