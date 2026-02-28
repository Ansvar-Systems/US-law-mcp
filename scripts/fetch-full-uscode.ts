#!/usr/bin/env tsx
/**
 * fetch-full-uscode.ts — Download ALL 53 USC title XML files and generate seed JSON.
 *
 * Downloads per-title XML from GovInfo bulk data, parses all sections using
 * the USLM bulk parser, and writes seed JSON files for the ingestion pipeline.
 *
 * Usage:
 *   npm run fetch:federal:full                    # fetch all 53 titles
 *   npm run fetch:federal:full -- --dry-run       # list targets without downloading
 *   npm run fetch:federal:full -- --title 18      # fetch only Title 18
 *   npm run fetch:federal:full -- --concurrency 3 # limit parallel downloads
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { USC_TITLES, padTitle } from '../data/manifests/usc-titles.js';
import { parseUslmTitle } from './parsers/uslm-bulk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'data', 'source', 'usc-bulk');
const SEED_DIR = path.join(ROOT, 'data', 'seed', 'federal');

// Source priority: GitHub mirror (fast, reliable) > uscode.house.gov > GovInfo
const GITHUB_MIRROR = 'https://raw.githubusercontent.com/BlackacreLabs/uscode-xml/master/data';
const USCODE_HOUSE = 'https://uscode.house.gov/download/releasepoints/us/pl';
const GOVINFO_BASE = 'https://www.govinfo.gov/bulkdata/USCODE';
const USER_AGENT = 'Ansvar-US-Law-MCP/1.0 (legal-research; https://github.com/Ansvar-Systems/US-law-mcp)';

interface CliFlags {
  dryRun: boolean;
  titleFilter: number | null;
  concurrency: number;
  year: number;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = {
    dryRun: false,
    titleFilter: null,
    concurrency: 5,
    year: new Date().getFullYear(),
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--title' && args[i + 1]) { flags.titleFilter = parseInt(args[++i], 10); }
    else if (arg === '--concurrency' && args[i + 1]) { flags.concurrency = parseInt(args[++i], 10); }
    else if (arg === '--year' && args[i + 1]) { flags.year = parseInt(args[++i], 10); }
  }
  return flags;
}

function isValidUslmXml(content: string): boolean {
  return content.length > 200 && !content.includes('<!DOCTYPE html') &&
    (content.includes('<section') || content.includes('<lawDoc') || content.includes('<uscDoc'));
}

async function tryFetch(url: string, timeoutMs: number = 120_000): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return isValidUslmXml(text) ? text : null;
  } catch {
    return null;
  }
}

async function downloadTitleXml(titleNum: number, year: number): Promise<string | null> {
  const padded = padTitle(titleNum);
  const cacheFile = path.join(CACHE_DIR, `usc${padded}.xml`);

  // Use cache if < 30 days old
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < 30 * 24 * 60 * 60 * 1000) {
      const cached = fs.readFileSync(cacheFile, 'utf-8');
      if (isValidUslmXml(cached)) return cached;
    }
  }

  // Source 1: GitHub mirror (OLRC XML, fast and reliable from any network)
  const githubUrl = `${GITHUB_MIRROR}/usc${padded}.xml`;
  console.log(`  Trying GitHub mirror: usc${padded}.xml`);
  const githubXml = await tryFetch(githubUrl, 60_000);
  if (githubXml) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, githubXml, 'utf-8');
    console.log(`  Cached from GitHub (${(githubXml.length / 1024 / 1024).toFixed(1)} MB)`);
    return githubXml;
  }

  // Source 2: GovInfo bulk data (may be slow or unavailable from cloud VMs)
  for (const y of [year, year - 1]) {
    const govUrl = `${GOVINFO_BASE}/${y}/usc${padded}/USCODE-${y}-title${titleNum}.xml`;
    console.log(`  Trying GovInfo: year ${y}`);
    const govXml = await tryFetch(govUrl);
    if (govXml) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, govXml, 'utf-8');
      console.log(`  Cached from GovInfo (${(govXml.length / 1024 / 1024).toFixed(1)} MB)`);
      return govXml;
    }
  }

  console.warn(`  FAILED: Title ${padded} not available from any source`);
  return null;
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!;
      results.push(await fn(item));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

interface FetchResult {
  titleNum: number;
  name: string;
  provisions: number;
  success: boolean;
}

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP — Full USC Bulk Fetcher ===\n');
  console.log(`Source: GovInfo bulk data (year: ${flags.year})`);
  console.log(`Concurrency: ${flags.concurrency}\n`);

  const titles = flags.titleFilter !== null
    ? USC_TITLES.filter(t => t.number === flags.titleFilter)
    : USC_TITLES;

  if (titles.length === 0) {
    console.error(`No matching title for --title ${flags.titleFilter}`);
    process.exit(1);
  }

  if (flags.dryRun) {
    console.log('DRY RUN — would download:\n');
    for (const t of titles) {
      console.log(`  Title ${padTitle(t.number)}: ${t.name} (positive law: ${t.positivelaw})`);
    }
    console.log(`\nTotal: ${titles.length} titles`);
    return;
  }

  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Clear old federal seed files
  const oldFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json'));
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(SEED_DIR, f));
  }
  if (oldFiles.length > 0) {
    console.log(`Cleared ${oldFiles.length} old federal seed files\n`);
  }

  const results = await mapConcurrent(titles, flags.concurrency, async (t): Promise<FetchResult> => {
    const padded = padTitle(t.number);
    console.log(`\nFetching Title ${padded}: ${t.name}...`);

    const xml = await downloadTitleXml(t.number, flags.year);
    if (!xml) {
      console.warn(`  SKIP Title ${padded}: download failed`);
      return { titleNum: t.number, name: t.name, provisions: 0, success: false };
    }

    const seed = parseUslmTitle(xml, t.number, t.name);

    const outFile = path.join(SEED_DIR, `title${padded}.json`);
    fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

    console.log(`  Title ${padded}: ${seed.provisions.length} provisions → ${path.basename(outFile)}`);

    return { titleNum: t.number, name: t.name, provisions: seed.provisions.length, success: true };
  });

  // Summary
  let totalDocs = 0;
  let totalProvisions = 0;
  let successCount = 0;
  let failCount = 0;

  console.log('\n=== Summary ===\n');
  for (const r of results.sort((a, b) => a.titleNum - b.titleNum)) {
    const status = r.success ? `${r.provisions} provisions` : 'FAILED';
    console.log(`  Title ${padTitle(r.titleNum)}: ${r.name} — ${status}`);
    if (r.success) {
      totalDocs++;
      totalProvisions += r.provisions;
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\nTotal: ${successCount}/${titles.length} titles, ${totalDocs} documents, ${totalProvisions} provisions`);
  if (failCount > 0) {
    console.warn(`WARNING: ${failCount} titles failed to download`);
    process.exit(1);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
