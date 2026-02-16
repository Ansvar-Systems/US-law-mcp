#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Database from '@ansvar/mcp-sqlite';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { registerTools } from './tools/registry.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './server-metadata.js';

const DB_ENV_VAR = 'US_LAW_DB_PATH';
const DEFAULT_DB_PATH = '../data/database.db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDefaultDbPath(): string {
  return path.resolve(__dirname, DEFAULT_DB_PATH);
}

let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    const dbPath = process.env[DB_ENV_VAR] ?? getDefaultDbPath();
    dbInstance = new Database(dbPath, { readonly: true });
    dbInstance.pragma('foreign_keys = ON');
    console.error(`[${MCP_SERVER_NAME}] Database opened: ${dbPath}`);
  }
  return dbInstance;
}

function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

async function main(): Promise<void> {
  const server = new Server(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  registerTools(server, getDb());

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${MCP_SERVER_NAME}] Server started on stdio`);
}

process.on('SIGINT', () => {
  console.error(`[${MCP_SERVER_NAME}] Shutting down (SIGINT)...`);
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error(`[${MCP_SERVER_NAME}] Shutting down (SIGTERM)...`);
  closeDb();
  process.exit(0);
});

main().catch((error: unknown) => {
  console.error(`[${MCP_SERVER_NAME}] Fatal error:`, error);
  closeDb();
  process.exit(1);
});
