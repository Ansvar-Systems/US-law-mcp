#!/usr/bin/env tsx
/**
 * US Law MCP — Data Freshness Checker
 *
 * Checks whether the local database is stale or missing expected legislation.
 *
 * Detection strategy:
 * 1. Database age — flags if build_date > MAX_AGE days old
 * 2. Document count — compares DB rows against census.json expected count
 * 3. Source portal — verifies the official legal portal is reachable
 *
 * Exit codes:
 *   0 = database is fresh, no updates detected
 *   1 = updates detected (stale DB, missing documents, or new content upstream)
 *   2 = check failed (DB missing, portal unreachable, unexpected error)
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../data/database.db');
const CENSUS_PATH = resolve(__dirname, '../data/census.json');

const MAX_DB_AGE_DAYS = Number(process.env['MAX_DB_AGE_DAYS'] ?? '90');
const PORTAL_URL = 'https://www.govinfo.gov';
const PORTAL_NAME = 'GovInfo (US Government Publishing Office)';

interface CensusSummary {
  total_laws?: number;
  total_ingestable?: number;
  total_ingested?: number;
  [key: string]: unknown;
}

function daysSince(isoDate: string): number | null {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return null;
  return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
}

async function checkPortal(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': '@ansvar/us-law-mcp/1.0 (data-freshness-check)' },
    });
    clearTimeout(timeout);
    return res.ok || res.status === 301 || res.status === 302 || res.status === 403;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('US Law MCP — Data Freshness Check');
  console.log(`Portal: ${PORTAL_NAME} (${PORTAL_URL})`);
  console.log('');

  // --- 1. Database existence ---
  if (!existsSync(DB_PATH)) {
    console.error('ERROR: Database not found at', DB_PATH);
    console.error('Run "npm run build:db" first.');
    process.exit(2);
  }

  // --- 2. Database age check ---
  let updatesNeeded = false;
  const { default: Database } = await import('@ansvar/mcp-sqlite');
  const db = new Database(DB_PATH, { readonly: true });

  let buildDate: string | null = null;
  try {
    const row = db.prepare("SELECT value FROM db_metadata WHERE key = 'build_date'").get() as { value: string } | undefined;
    buildDate = row?.value ?? null;
  } catch {
    // db_metadata table may not exist
  }

  if (buildDate) {
    const age = daysSince(buildDate);
    if (age !== null && age > MAX_DB_AGE_DAYS) {
      console.log(`STALE: Database is ${age} days old (threshold: ${MAX_DB_AGE_DAYS} days)`);
      updatesNeeded = true;
    } else if (age !== null) {
      console.log(`OK: Database is ${age} days old (threshold: ${MAX_DB_AGE_DAYS} days)`);
    }
  } else {
    console.log('WARN: No build_date in db_metadata — cannot assess age');
  }

  // --- 3. Document count check ---
  let dbDocCount = 0;
  let dbProvCount = 0;
  try {
    const docRow = db.prepare("SELECT COUNT(*) as count FROM legal_documents").get() as { count: number };
    dbDocCount = docRow.count;
    console.log(`DB documents: ${dbDocCount}`);
  } catch {
    console.log('WARN: Cannot count legal_documents');
  }

  try {
    const provRow = db.prepare("SELECT COUNT(*) as count FROM legal_provisions").get() as { count: number };
    dbProvCount = provRow.count;
    console.log(`DB provisions: ${dbProvCount}`);
  } catch {
    console.log('WARN: Cannot count legal_provisions');
  }

  // Compare against census if available
  if (existsSync(CENSUS_PATH)) {
    try {
      const census = JSON.parse(readFileSync(CENSUS_PATH, 'utf-8')) as { summary?: CensusSummary };
      const expected = census.summary?.total_ingested ?? census.summary?.total_ingestable ?? census.summary?.total_laws;
      if (expected && dbDocCount < expected) {
        console.log(`MISSING: DB has ${dbDocCount} documents but census expects ${expected}`);
        updatesNeeded = true;
      } else if (expected) {
        console.log(`OK: DB documents (${dbDocCount}) >= census expected (${expected})`);
      }
    } catch {
      console.log('WARN: Could not parse census.json');
    }
  } else {
    console.log('INFO: No census.json — skipping count comparison');
  }

  db.close();

  // --- 4. Source portal reachability ---
  console.log('');
  console.log(`Checking portal: ${PORTAL_URL}`);
  const portalOk = await checkPortal(PORTAL_URL);
  if (portalOk) {
    console.log(`OK: ${PORTAL_NAME} is reachable`);
  } else {
    console.log(`WARN: ${PORTAL_NAME} is unreachable — manual check recommended`);
  }

  // --- Result ---
  console.log('');
  if (updatesNeeded) {
    console.log('RESULT: Updates detected — re-ingestion recommended');
    process.exit(1);
  } else {
    console.log('RESULT: Database appears current — no updates needed');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(2);
});
