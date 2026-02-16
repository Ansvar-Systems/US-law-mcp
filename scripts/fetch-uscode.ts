#!/usr/bin/env tsx
/**
 * fetch-uscode.ts — Download USC section text from Cornell LII and build seed JSONs
 *
 * Source: Cornell Law Information Institute (https://www.law.cornell.edu/uscode/text/)
 * Fetches individual USC sections as HTML, extracts statutory text with cheerio,
 * and writes per-title seed JSON files for the ingestion pipeline.
 *
 * Usage:
 *   npm run fetch:federal                  # fetch all required titles
 *   npm run fetch:federal -- --dry-run     # list targets without downloading
 *   npm run fetch:federal -- --title 18    # fetch only Title 18
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import {
  FEDERAL_TARGETS,
  REQUIRED_TITLES,
  type FederalTarget,
} from '../data/manifests/federal-targets.js';

// ── Paths ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'data', 'source', 'usc');
const SEED_DIR = path.join(ROOT, 'data', 'seed', 'federal');

// ── Cornell LII URL ────────────────────────────────────────────────
function cornellUrl(titleNum: number, section: string): string {
  return `https://www.law.cornell.edu/uscode/text/${titleNum}/${section}`;
}

// ── Explicit section lists per target ──────────────────────────────
// Pre-computed: these are the actual existing USC sections within each range.
// Using explicit lists avoids probing for non-existent sections.
const SECTION_LISTS: Record<string, string[]> = {
  // Title 18
  '18 USC 1030': ['1030'],
  '18 USC 1028-1028A': ['1028', '1028A'],
  '18 USC 2511-2522': Array.from({ length: 12 }, (_, i) => String(2511 + i)),
  '18 USC 2701-2712': Array.from({ length: 12 }, (_, i) => String(2701 + i)),
  '18 USC 3121-3127': Array.from({ length: 7 }, (_, i) => String(3121 + i)),

  // Title 15
  '15 USC 45': ['45'],
  '15 USC 6501-6506': Array.from({ length: 6 }, (_, i) => String(6501 + i)),
  '15 USC 6801-6827': [
    ...Array.from({ length: 9 }, (_, i) => String(6801 + i)),
    ...Array.from({ length: 7 }, (_, i) => String(6821 + i)),
  ],
  '15 USC 7701-7713': Array.from({ length: 13 }, (_, i) => String(7701 + i)),
  '15 USC 1681-1681x': [
    '1681',
    ...'abcdefghijklmnopqrstuvwx'.split('').map((l) => `1681${l}`),
  ],

  // Title 42
  '42 USC 1320d-1320d-9': [
    '1320d',
    ...Array.from({ length: 9 }, (_, i) => `1320d-${i + 1}`),
  ],

  // Title 44
  '44 USC 3551-3558': Array.from({ length: 8 }, (_, i) => String(3551 + i)),

  // Title 20
  '20 USC 1232g': ['1232g'],

  // Title 47
  '47 USC 222': ['222'],
  '47 USC 551': ['551'],
};

// ── CLI flags ──────────────────────────────────────────────────────
interface CliFlags {
  dryRun: boolean;
  titleFilter: number | null;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = { dryRun: false, titleFilter: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--title') {
      const next = args[i + 1];
      if (next === undefined) {
        console.error('--title requires a number argument');
        process.exit(1);
      }
      flags.titleFilter = parseInt(next, 10);
      i++;
    }
  }
  return flags;
}

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

// ── HTML download with caching ─────────────────────────────────────
async function downloadSection(
  titleNum: number,
  section: string,
): Promise<string | null> {
  const cacheFile = path.join(CACHE_DIR, `t${titleNum}_s${section}.html`);

  // Use cached file if it exists and is less than 30 days old
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (ageMs < thirtyDays) {
      return fs.readFileSync(cacheFile, 'utf-8');
    }
  }

  const url = cornellUrl(titleNum, section);

  const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!resp.ok) {
    console.warn(`    WARNING: HTTP ${resp.status} for ${url}`);
    return null;
  }

  const html = await resp.text();

  // Check for error pages
  if (html.includes('Page not found') || !html.includes('tab-pane')) {
    console.warn(`    WARNING: Section ${section} not found at Cornell LII`);
    return null;
  }

  // Cache it
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, html, 'utf-8');

  return html;
}

// ── HTML text extraction ────────────────────────────────────────────

function parseSection(html: string): { heading: string; text: string } {
  const $ = cheerio.load(html);

  // Extract heading from page title: "18 U.S. Code § 1030 - Heading | ..."
  const pageTitle = $('title').text();
  const headingMatch = pageTitle.match(/§\s*\S+\s*-\s*([^|]+)/);
  const heading = headingMatch ? headingMatch[1]!.trim() : 'Untitled section';

  // Extract statute body from the active tab pane
  const body = $('.tab-pane.active').text().trim();

  // Clean up: collapse whitespace, fix punctuation spacing
  const cleaned = body
    .replace(/\s+/g, ' ')
    .replace(/\s([.,;:)])/g, '$1')
    .replace(/([(\[])\s/g, '$1')
    .trim();

  return { heading, text: cleaned };
}

// ── Delay helper (be polite to Cornell) ─────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main parsing logic ─────────────────────────────────────────────

async function processTarget(
  target: FederalTarget,
  docIndex: number,
  seed: SeedFile,
): Promise<number> {
  const sections = SECTION_LISTS[target.identifier];
  if (!sections) {
    console.error(`    No section list found for ${target.identifier}`);
    return 0;
  }

  let orderIndex = 0;

  for (const section of sections) {
    const html = await downloadSection(target.usc_title, section);
    if (!html) continue;

    const { heading, text } = parseSection(html);

    if (text.length < 20) {
      console.warn(`    Skipping ${section}: too short (${text.length} chars)`);
      continue;
    }

    orderIndex++;
    seed.provisions.push({
      document_index: docIndex,
      jurisdiction: 'US-FED',
      section_number: `\u00a7 ${section}`,
      title: heading,
      text,
      order_index: orderIndex,
    });

    // Be polite: small delay between requests
    await delay(200);
  }

  return orderIndex;
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP \u2014 Federal USC Fetcher (Cornell LII) ===\n');

  const titles =
    flags.titleFilter !== null
      ? REQUIRED_TITLES.filter((t) => t === flags.titleFilter)
      : REQUIRED_TITLES;

  if (titles.length === 0) {
    console.error(`No matching titles found for --title ${flags.titleFilter}`);
    process.exit(1);
  }

  // ── Dry run: just list targets ───────────────────────────────────
  if (flags.dryRun) {
    console.log('DRY RUN \u2014 listing targets without downloading:\n');
    let totalSections = 0;
    for (const titleNum of titles) {
      const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);
      console.log(`Title ${titleNum}:`);
      for (const t of targets) {
        const secs = SECTION_LISTS[t.identifier] ?? [];
        const range = t.sections.end
          ? `\u00a7\u00a7 ${t.sections.start}\u2013${t.sections.end}`
          : `\u00a7 ${t.sections.start}`;
        console.log(
          `  ${t.short_name.padEnd(20)} ${range.padEnd(20)} ${secs.length} sections`,
        );
        totalSections += secs.length;
      }
    }
    console.log(
      `\nTotal: ${FEDERAL_TARGETS.filter((t) => titles.includes(t.usc_title)).length} statutes, ${totalSections} sections across ${titles.length} USC titles`,
    );
    console.log('Source: Cornell LII (https://www.law.cornell.edu/uscode/)');
    return;
  }

  // ── Fetch and parse ──────────────────────────────────────────────
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  for (const titleNum of titles) {
    console.log(`\n\u2500\u2500 Title ${titleNum} \u2500\u2500`);

    const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);
    const seed: SeedFile = { documents: [], provisions: [] };

    for (const target of targets) {
      const docIndex = seed.documents.length;

      seed.documents.push({
        jurisdiction: 'US-FED',
        title: target.name,
        identifier: target.identifier,
        short_name: target.short_name,
        document_type: target.document_type,
        status: target.status,
        effective_date: target.effective_date,
        last_amended: target.last_amended,
        source_url: `https://www.law.cornell.edu/uscode/text/${target.usc_title}`,
      });

      const count = await processTarget(target, docIndex, seed);
      console.log(`  ${target.short_name}: ${count} provisions extracted`);
    }

    const outFile = path.join(SEED_DIR, `title${titleNum}.json`);
    fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

    const docCount = seed.documents.length;
    const provCount = seed.provisions.length;
    console.log(
      `  Wrote ${path.relative(ROOT, outFile)} (${docCount} documents, ${provCount} provisions)`,
    );
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
