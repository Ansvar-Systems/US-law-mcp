import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface VercelConfig {
  buildCommand?: string;
  rewrites?: Array<{ source: string; destination: string }>;
  crons?: Array<{ path: string; schedule: string }>;
  functions?: Record<string, { includeFiles?: string; maxDuration?: number; memory?: number }>;
}

function loadVercelConfig(): VercelConfig {
  const filePath = path.resolve(process.cwd(), 'vercel.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as VercelConfig;
}

describe('vercel deployment config', () => {
  it('keeps build pipeline for database + ingest + build', () => {
    const config = loadVercelConfig();
    expect(config.buildCommand).toContain('npm run build:db');
    expect(config.buildCommand).toContain('npm run ingest:all');
    expect(config.buildCommand).toContain('npm run build');
  });

  it('routes mcp and health endpoints correctly', () => {
    const config = loadVercelConfig();
    const rewrites = config.rewrites ?? [];

    expect(rewrites).toContainEqual({ source: '/mcp', destination: '/api/mcp' });
    expect(rewrites).toContainEqual({ source: '/health', destination: '/api/health' });
    expect(rewrites).toContainEqual({ source: '/version', destination: '/api/health?version' });
  });

  it('ships database file into MCP function bundle', () => {
    const config = loadVercelConfig();
    const mcpFunction = config.functions?.['api/mcp.ts'];
    expect(mcpFunction).toBeDefined();
    expect(mcpFunction?.includeFiles).toContain('data/database.db');
  });

  it('keeps health cron enabled', () => {
    const config = loadVercelConfig();
    const crons = config.crons ?? [];
    expect(crons).toContainEqual({ path: '/health', schedule: '*/5 * * * *' });
  });
});
