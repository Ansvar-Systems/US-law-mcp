#!/usr/bin/env tsx
/**
 * fetch-uscode.ts — Download USC section text from official US Code (USLM) endpoints.
 *
 * Source: Office of the Law Revision Counsel (uscode.house.gov)
 * Fetches section-level USLM XML from official US Code endpoints, extracts
 * statutory text, and writes per-title seed JSON files for the ingestion pipeline.
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

// ── Official US Code (USLM) section URL builder ───────────────────
const USLM_VIEW_URL = 'https://uscode.house.gov/view.xhtml';

export function buildUslmSectionUrl(titleNum: number, section: string): string {
  const url = new URL(USLM_VIEW_URL);
  url.searchParams.set('req', `granuleid:USC-prelim-title${titleNum}-section${section}`);
  url.searchParams.set('num', '0');
  url.searchParams.set('edition', 'prelim');
  url.searchParams.set('f', 'xml');
  return url.toString();
}

// ── Explicit section lists per target ─────────────────────────────
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

// ── XML download with caching ──────────────────────────────────────
async function downloadSectionXml(
  titleNum: number,
  section: string,
): Promise<string | null> {
  const cacheFile = path.join(CACHE_DIR, `t${titleNum}_s${section}.xml`);
  const hasCache = fs.existsSync(cacheFile);
  const staleCached = hasCache ? fs.readFileSync(cacheFile, 'utf-8') : null;

  // Use cached file if it exists and is less than 30 days old
  if (hasCache) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (ageMs < thirtyDays) {
      return staleCached;
    }
  }

  const url = buildUslmSectionUrl(titleNum, section);
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        'User-Agent': 'Ansvar-US-Law-MCP/0.1 (legal-research)',
        Accept: 'application/xml,text/xml;q=0.9,text/html;q=0.8,*/*;q=0.5',
      },
      redirect: 'follow',
    });

    if (!resp.ok) {
      console.warn(`    WARNING: HTTP ${resp.status} for ${url}`);
      return staleCached;
    }

    const xml = await resp.text();
    if (!xml.includes('<section') && !xml.includes(':section')) {
      console.warn(`    WARNING: Section ${section} not found at official US Code endpoint`);
      return staleCached;
    }

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, xml, 'utf-8');
    return xml;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`    WARNING: Fetch failed for ${url}: ${message}`);
    return staleCached;
  }
}

// ── XML text extraction ─────────────────────────────────────────────

interface ParsedSection {
  heading: string;
  text: string;
}

function normalizeStatuteText(raw: string): string {
  return raw
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function parseUslmSectionXml(xml: string, fallbackSection: string): ParsedSection | null {
  const $ = cheerio.load(xml, { xmlMode: true });

  const sectionEl = $('section').first().length > 0
    ? $('section').first()
    : $('*[name="section"]').first();
  if (!sectionEl.length) return null;

  const heading = sectionEl.find('heading').first().text().trim() || `Section ${fallbackSection}`;

  const contentEl = sectionEl.find('content').first();
  const extractionRoot = contentEl.length > 0 ? contentEl.clone() : sectionEl.clone();
  extractionRoot.find('sourceCredit, note, notes, editorialNote, toc').remove();

  const text = normalizeStatuteText(extractionRoot.text());
  if (text.length < 20) return null;

  return { heading, text };
}

// ── Delay helper (be polite to uscode.house.gov) ───────────────────
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
    const xml = await downloadSectionXml(target.usc_title, section);
    if (!xml) continue;

    const parsed = parseUslmSectionXml(xml, section);
    if (!parsed) {
      console.warn(`    Skipping ${section}: parse failed`);
      continue;
    }

    orderIndex++;
    seed.provisions.push({
      document_index: docIndex,
      jurisdiction: 'US-FED',
      section_number: `\u00a7 ${section}`,
      title: parsed.heading,
      text: parsed.text,
      order_index: orderIndex,
    });

    // Small delay between requests
    await delay(200);
  }

  return orderIndex;
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP — Federal USC Fetcher (Official USLM) ===\n');

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
    console.log('DRY RUN — listing targets without downloading:\n');
    let totalSections = 0;
    for (const titleNum of titles) {
      const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);
      console.log(`Title ${titleNum}:`);
      for (const t of targets) {
        const secs = SECTION_LISTS[t.identifier] ?? [];
        const range = t.sections.end
          ? `§§ ${t.sections.start}–${t.sections.end}`
          : `§ ${t.sections.start}`;
        console.log(
          `  ${t.short_name.padEnd(20)} ${range.padEnd(20)} ${secs.length} sections`,
        );
        totalSections += secs.length;
      }
    }
    console.log(
      `\nTotal: ${FEDERAL_TARGETS.filter((t) => titles.includes(t.usc_title)).length} statutes, ${totalSections} sections across ${titles.length} USC titles`,
    );
    console.log('Source: uscode.house.gov (Official USLM endpoint)');
    return;
  }

  // ── Fetch and parse ──────────────────────────────────────────────
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  for (const titleNum of titles) {
    console.log(`\n── Title ${titleNum} ──`);

    const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);
    const seed: SeedFile = { documents: [], provisions: [] };

    for (const target of targets) {
      const docIndex = seed.documents.length;
      const firstSection = String(target.sections.start);

      seed.documents.push({
        jurisdiction: 'US-FED',
        title: target.name,
        identifier: target.identifier,
        short_name: target.short_name,
        document_type: target.document_type,
        status: target.status,
        effective_date: target.effective_date,
        last_amended: target.last_amended,
        source_url: buildUslmSectionUrl(target.usc_title, firstSection),
      });

      const count = await processTarget(target, docIndex, seed);
      console.log(`  ${target.short_name}: ${count} provisions extracted`);
    }

    const outFile = path.join(SEED_DIR, `title${titleNum}.json`);
    fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

    console.log(
      `  Wrote ${path.relative(ROOT, outFile)} (${seed.documents.length} documents, ${seed.provisions.length} provisions)`,
    );
  }

  console.log('\nDone.');
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryFile === __filename) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
