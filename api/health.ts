import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../src/server-metadata.js';
import Database from '@ansvar/mcp-sqlite';
import { join } from 'path';
import { existsSync, copyFileSync, statSync, readFileSync, writeFileSync } from 'fs';
import { readDbMetadata } from '../src/capabilities.js';

const REPO_URL = 'https://github.com/Ansvar-Systems/US-law-mcp';

const SOURCE_DB = process.env.US_LAW_DB_PATH
  || join(process.cwd(), 'data', 'database.db');
const TMP_DB = '/tmp/database.db';
const TMP_DB_META = '/tmp/database.db.meta.json';

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
    if (typeof parsed.source === 'string' && typeof parsed.size === 'number' && typeof parsed.mtimeMs === 'number') {
      return { source: parsed.source, size: parsed.size, mtimeMs: parsed.mtimeMs };
    }
  } catch { /* ignore */ }
  return null;
}

function ensureDatabaseCopy(): void {
  if (!existsSync(SOURCE_DB)) return;
  const sourceStat = statSync(SOURCE_DB);
  const sourceMeta: DbCopyMeta = { source: SOURCE_DB, size: sourceStat.size, mtimeMs: sourceStat.mtimeMs };
  const currentMeta = readCopyMeta();
  const needsCopy = !existsSync(TMP_DB)
    || currentMeta === null
    || currentMeta.source !== sourceMeta.source
    || currentMeta.size !== sourceMeta.size
    || currentMeta.mtimeMs !== sourceMeta.mtimeMs;
  if (!needsCopy) return;
  copyFileSync(SOURCE_DB, TMP_DB);
  writeFileSync(TMP_DB_META, JSON.stringify(sourceMeta), 'utf-8');
}

function getDbStats(): { tier: string; documents: number; provisions: number; jurisdictions: number } {
  try {
    ensureDatabaseCopy();
    const dbPath = existsSync(TMP_DB) ? TMP_DB : SOURCE_DB;
    if (!existsSync(dbPath)) return { tier: 'unknown', documents: 0, provisions: 0, jurisdictions: 0 };

    const db = new Database(dbPath, { readonly: true });
    const meta = readDbMetadata(db);
    const docs = (db.prepare('SELECT COUNT(*) AS c FROM legal_documents').get() as { c: number }).c;
    const provs = (db.prepare('SELECT COUNT(*) AS c FROM legal_provisions').get() as { c: number }).c;
    const juris = (db.prepare('SELECT COUNT(DISTINCT jurisdiction) AS c FROM legal_documents').get() as { c: number }).c;
    db.close();
    return { tier: meta.tier, documents: docs, provisions: provs, jurisdictions: juris };
  } catch {
    return { tier: 'unknown', documents: 0, provisions: 0, jurisdictions: 0 };
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', `https://${req.headers.host}`);
  const stats = getDbStats();

  if (url.pathname === '/version' || url.searchParams.has('version')) {
    res.status(200).json({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      node_version: process.version,
      transport: ['stdio', 'streamable-http'],
      capabilities: ['statutes', 'cross_state_comparison'],
      tier: stats.tier,
      source_schema_version: '1.0',
      data: {
        documents: stats.documents,
        provisions: stats.provisions,
        jurisdictions: stats.jurisdictions,
      },
      repo_url: REPO_URL,
      report_issue_url: `${REPO_URL}/issues/new`,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    server: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
    uptime_seconds: Math.floor(process.uptime()),
    capabilities: ['statutes', 'cross_state_comparison'],
    tier: stats.tier,
    data: {
      documents: stats.documents,
      provisions: stats.provisions,
      jurisdictions: stats.jurisdictions,
    },
  });
}
