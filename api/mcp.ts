import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import Database from '@ansvar/mcp-sqlite';
import { join } from 'path';
import { existsSync, copyFileSync, rmSync, readFileSync, writeFileSync, statSync } from 'fs';

import { registerTools } from '../src/tools/registry.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../src/server-metadata.js';

const SOURCE_DB = process.env.US_LAW_DB_PATH
  || join(process.cwd(), 'data', 'database.db');
const TMP_DB = '/tmp/database.db';
const TMP_DB_LOCK = '/tmp/database.db.lock';
const TMP_DB_META = '/tmp/database.db.meta.json';

let db: Database | null = null;

interface DbCopyMeta {
  source: string;
  size: number;
  mtimeMs: number;
}

function readCopyMeta(): DbCopyMeta | null {
  if (!existsSync(TMP_DB_META)) return null;

  try {
    const raw = readFileSync(TMP_DB_META, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DbCopyMeta>;
    if (
      typeof parsed.source === 'string'
      && typeof parsed.size === 'number'
      && typeof parsed.mtimeMs === 'number'
    ) {
      return {
        source: parsed.source,
        size: parsed.size,
        mtimeMs: parsed.mtimeMs,
      };
    }
  } catch {
    // Ignore malformed metadata and force refresh.
  }

  return null;
}

function ensureDatabaseCopyCurrent(): void {
  const sourceStat = statSync(SOURCE_DB);
  const sourceMeta: DbCopyMeta = {
    source: SOURCE_DB,
    size: sourceStat.size,
    mtimeMs: sourceStat.mtimeMs,
  };

  const currentMeta = readCopyMeta();
  const needsCopy = !existsSync(TMP_DB)
    || currentMeta === null
    || currentMeta.source !== sourceMeta.source
    || currentMeta.size !== sourceMeta.size
    || currentMeta.mtimeMs !== sourceMeta.mtimeMs;

  if (!needsCopy) return;

  copyFileSync(SOURCE_DB, TMP_DB);
  writeFileSync(TMP_DB_META, JSON.stringify(sourceMeta), 'utf-8');
  db = null;
}

function getDatabase(): Database {
  if (!db) {
    if (existsSync(TMP_DB_LOCK)) {
      rmSync(TMP_DB_LOCK, { recursive: true, force: true });
    }
    ensureDatabaseCopyCurrent();
    db = new Database(TMP_DB, { readonly: true });
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      protocol: 'mcp-streamable-http',
    });
    return;
  }

  try {
    if (!existsSync(SOURCE_DB)) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Database not found at ${SOURCE_DB}` },
        id: null,
      });
      return;
    }

    const database = getDatabase();

    const server = new Server(
      { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      { capabilities: { tools: {} } }
    );

    registerTools(server, database);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MCP handler error:', message);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message },
        id: null,
      });
    }
  }
}
