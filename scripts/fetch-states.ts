#!/usr/bin/env tsx
/**
 * fetch-states.ts — Fetch statute text from official state legislative portals
 *
 * Downloads HTML from state legislature websites for all 50 states + DC,
 * parses the content using registered parsers, and writes seed JSON files
 * for the ingestion pipeline.
 *
 * Usage:
 *   npm run fetch:states                    # fetch all states
 *   npm run fetch:states -- --dry-run       # list all states/statutes without fetching
 *   npm run fetch:states -- --state CA      # fetch only California
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { STATE_TARGETS, type StateTarget, type StatuteRef } from '../data/manifests/state-targets.js';
import type { ParsedProvision } from './parsers/index.js';

// Lazy-load parsers to avoid circular initialization in ESM
async function loadGetParser(): Promise<typeof import('./parsers/index.js')['getParser']> {
  const mod = await import('./parsers/index.js');
  return mod.getParser;
}
let _getParser: Awaited<ReturnType<typeof loadGetParser>> | null = null;
async function resolveParser(name: string) {
  if (!_getParser) {
    _getParser = await loadGetParser();
  }
  return _getParser(name);
}

// ── Paths ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'source', 'states');
const SEED_DIR = path.join(ROOT, 'data', 'seed', 'states');

// ── Seed JSON types (matches ingest format) ────────────────────────
interface SeedDocument {
  jurisdiction: string;
  title: string;
  identifier: string;
  short_name: string;
  document_type: string;
  status: string;
  effective_date: string;
  last_amended: string;
  source_url: string;
}

interface SeedProvision {
  document_index: number;
  jurisdiction: string;
  section_number: string;
  title: string;
  text: string;
  order_index: number;
}

interface SeedFile {
  documents: SeedDocument[];
  provisions: SeedProvision[];
}

// ── CLI flags ──────────────────────────────────────────────────────
interface CliFlags {
  dryRun: boolean;
  stateFilter: string | null;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = { dryRun: false, stateFilter: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--state') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--state requires a two-letter abbreviation (e.g. CA)');
        process.exit(1);
      }
      flags.stateFilter = next.toUpperCase();
      i++;
    }
  }
  return flags;
}

// ── Delay helper (be respectful to government servers) ─────────────
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTML download with caching ─────────────────────────────────────

/** Sanitize a URL into a safe filename for caching */
function cacheFilename(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 200) + '.html';
}

async function fetchHtml(
  url: string,
  cacheDir: string,
): Promise<string | null> {
  const cacheFile = path.join(cacheDir, cacheFilename(url));

  // Use cached file if it exists and is less than 30 days old
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (ageMs < thirtyDays) {
      return fs.readFileSync(cacheFile, 'utf-8');
    }
  }

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        'User-Agent': 'Ansvar-US-Law-MCP/0.1 (legal-research; +https://github.com/Ansvar-Systems/US-law-mcp)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!resp.ok) {
      console.warn(`    WARNING: HTTP ${resp.status} for ${url}`);
      return null;
    }

    const html = await resp.text();

    // Cache it
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, html, 'utf-8');

    return html;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`    WARNING: Failed to fetch ${url}: ${msg}`);
    return null;
  }
}

// ── Process a single state ─────────────────────────────────────────

async function processState(state: StateTarget): Promise<SeedFile> {
  const seed: SeedFile = { documents: [], provisions: [] };
  const cacheDir = path.join(SOURCE_DIR, state.abbreviation.toLowerCase());
  let isFirstRequest = true;

  for (const statute of state.statutes) {
    const docIndex = seed.documents.length;

    seed.documents.push({
      jurisdiction: state.code,
      title: statute.name,
      identifier: statute.citation,
      short_name: statute.shortName,
      document_type: 'statute',
      status: statute.status,
      effective_date: statute.effectiveDate,
      last_amended: statute.lastAmended,
      source_url: statute.url,
    });

    // Rate limiting: 2-second delay between HTTP requests
    if (!isFirstRequest) {
      await delay(2000);
    }
    isFirstRequest = false;

    // Fetch HTML (cached or fresh)
    const html = await fetchHtml(statute.url, cacheDir);
    if (!html) {
      console.warn(`    Skipping ${statute.shortName}: fetch failed`);
      continue;
    }

    // Parse using the appropriate parser
    let provisions: ParsedProvision[];
    try {
      const parser = await resolveParser(statute.parserType);
      provisions = parser(html, statute.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`    WARNING: Parser error for ${statute.shortName}: ${msg}`);
      continue;
    }

    if (provisions.length === 0) {
      console.warn(`    WARNING: ${statute.shortName} returned 0 provisions`);
    }

    for (let i = 0; i < provisions.length; i++) {
      const prov = provisions[i]!;
      seed.provisions.push({
        document_index: docIndex,
        jurisdiction: state.code,
        section_number: prov.sectionNumber,
        title: prov.title,
        text: prov.text,
        order_index: i + 1,
      });
    }

    console.log(`    ${statute.shortName}: ${provisions.length} provisions`);
  }

  return seed;
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP \u2014 State Statute Fetcher ===\n');

  // Filter states if --state flag provided
  let targets = STATE_TARGETS;
  if (flags.stateFilter) {
    targets = STATE_TARGETS.filter((s) => s.abbreviation === flags.stateFilter);
    if (targets.length === 0) {
      console.error(`No state found with abbreviation "${flags.stateFilter}"`);
      console.error('Valid abbreviations: ' + STATE_TARGETS.map((s) => s.abbreviation).join(', '));
      process.exit(1);
    }
  }

  // ── Dry run: just list targets ───────────────────────────────────
  if (flags.dryRun) {
    console.log('DRY RUN \u2014 listing targets without downloading:\n');
    let totalStatutes = 0;

    for (const state of targets) {
      console.log(`${state.code} ${state.name} (${state.abbreviation}):`);
      for (const statute of state.statutes) {
        console.log(
          `  ${statute.shortName.padEnd(20)} [${statute.category}] ${statute.parserType.padEnd(12)} ${statute.url.slice(0, 70)}...`,
        );
        totalStatutes++;
      }
    }

    console.log(
      `\nTotal: ${targets.length} jurisdictions, ${totalStatutes} statutes`,
    );
    return;
  }

  // ── Fetch and parse ──────────────────────────────────────────────
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_DIR, { recursive: true });

  let totalDocs = 0;
  let totalProvisions = 0;
  let statesProcessed = 0;
  let statesFailed = 0;

  for (const state of targets) {
    console.log(`\n\u2500\u2500 ${state.name} (${state.code}) \u2500\u2500`);

    try {
      const seed = await processState(state);

      const outFile = path.join(SEED_DIR, `${state.abbreviation.toLowerCase()}.json`);
      fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

      const docCount = seed.documents.length;
      const provCount = seed.provisions.length;
      totalDocs += docCount;
      totalProvisions += provCount;
      statesProcessed++;

      console.log(
        `  Wrote ${path.relative(ROOT, outFile)} (${docCount} documents, ${provCount} provisions)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR processing ${state.name}: ${msg}`);
      statesFailed++;
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  console.log(`States processed: ${statesProcessed}`);
  if (statesFailed > 0) {
    console.log(`States failed:    ${statesFailed}`);
  }
  console.log(`Total documents:  ${totalDocs}`);
  console.log(`Total provisions: ${totalProvisions}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
