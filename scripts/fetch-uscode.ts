#!/usr/bin/env tsx
/**
 * fetch-uscode.ts — Download USC XML from GovInfo and extract target sections
 *
 * Usage:
 *   npm run fetch:federal                  # fetch all required titles
 *   npm run fetch:federal -- --dry-run     # list targets without downloading
 *   npm run fetch:federal -- --title 18    # fetch only Title 18
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

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

// ── GovInfo bulk-data URL pattern (USLM XML) ──────────────────────
const USC_YEAR = 2023;
function govInfoUrl(titleNum: number): string {
  return `https://www.govinfo.gov/bulkdata/USCODE/${USC_YEAR}/title${titleNum}/USCODE-${USC_YEAR}-title${titleNum}.xml`;
}

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
async function downloadTitle(titleNum: number): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, `title${titleNum}.xml`);

  // Use cached file if it exists and is less than 7 days old
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (ageMs < sevenDays) {
      console.log(`  Using cached XML for Title ${titleNum}`);
      return fs.readFileSync(cacheFile, 'utf-8');
    }
  }

  const url = govInfoUrl(titleNum);
  console.log(`  Downloading Title ${titleNum} from ${url} ...`);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to download Title ${titleNum}: ${resp.status} ${resp.statusText}`);
  }

  const xml = await resp.text();

  // Cache it
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, xml, 'utf-8');
  console.log(`  Cached to ${path.relative(ROOT, cacheFile)} (${(xml.length / 1024 / 1024).toFixed(1)} MB)`);

  return xml;
}

// ── Section matching helpers ───────────────────────────────────────

/**
 * Normalize a section identifier string to a comparable form.
 * USC XML identifiers look like "/us/usc/t18/s1030" or "/us/usc/t15/s6501".
 * We extract just the section part after the last "/s".
 */
function extractSectionId(identifier: string): string {
  const match = identifier.match(/\/s(.+)$/);
  return match ? match[1]! : identifier;
}

/**
 * Check if a section number falls within a target's range.
 * Handles pure numeric ranges and alphanumeric suffixes (e.g. "1028A", "1320d-9", "1681x").
 */
function sectionMatches(sectionId: string, target: FederalTarget): boolean {
  const start = String(target.sections.start);
  const end = target.sections.end !== undefined ? String(target.sections.end) : start;

  // Exact match for single-section targets
  if (start === end) {
    // Match the section itself or any subsection (e.g. "1030" matches "1030", "1030a")
    return sectionId === start || sectionId.startsWith(start + '/');
  }

  // For ranges, try numeric comparison first
  const numericSection = parseLeadingNumber(sectionId);
  const numericStart = parseLeadingNumber(start);
  const numericEnd = parseLeadingNumber(end);

  if (numericSection !== null && numericStart !== null && numericEnd !== null) {
    // If the leading numbers are in range, that's a match
    if (numericSection >= numericStart && numericSection <= numericEnd) {
      return true;
    }
    // Also check if section is a sub-section like "1320d-2" where base is "1320d"
    // and the range is "1320d" to "1320d-9"
    if (sectionId.startsWith(start.replace(/-\d+$/, ''))) {
      return sectionMatchesAlpha(sectionId, start, end);
    }
    return false;
  }

  // Fall back to string/alpha comparison for non-numeric sections
  return sectionMatchesAlpha(sectionId, start, end);
}

function parseLeadingNumber(s: string): number | null {
  const match = s.match(/^(\d+)/);
  return match ? parseInt(match[1]!, 10) : null;
}

function sectionMatchesAlpha(sectionId: string, start: string, end: string): boolean {
  // Pad for lexicographic comparison: "1681" <= "1681a" <= "1681x"
  const padded = (s: string) => s.replace(/(\d+)/g, (m) => m.padStart(10, '0'));
  const ps = padded(sectionId);
  const pStart = padded(start);
  const pEnd = padded(end);
  return ps >= pStart && ps <= pEnd;
}

// ── XML text extraction ────────────────────────────────────────────

/**
 * Recursively extract text content from a parsed XML node.
 * The fast-xml-parser preserves structure; we flatten to plain text.
 */
function extractText(node: unknown): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of Object.keys(obj)) {
      // Skip attribute keys (prefixed with @_)
      if (key.startsWith('@_')) continue;
      parts.push(extractText(obj[key]));
    }
    return parts.join(' ');
  }

  return '';
}

/** Clean up extracted text: collapse whitespace, trim */
function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\s([.,;:)])/g, '$1')
    .replace(/([(\[])\s/g, '$1')
    .trim();
}

/**
 * Try to extract a heading/title from a section node.
 * USLM sections typically have a <heading> child element.
 */
function extractHeading(section: Record<string, unknown>): string {
  if (typeof section['heading'] === 'string') return section['heading'];
  if (section['heading'] && typeof section['heading'] === 'object') {
    return cleanText(extractText(section['heading']));
  }
  // Try num + heading combo
  const num = section['num'] ? cleanText(extractText(section['num'])) : '';
  return num || 'Untitled section';
}

// ── Main parsing logic ─────────────────────────────────────────────

function parseTitle(xml: string, titleNum: number): SeedFile {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    preserveOrder: false,
    trimValues: true,
  });

  const doc = parser.parse(xml) as Record<string, unknown>;

  // Collect all <section> elements with identifiers from the parsed tree
  const sections: Array<{ identifier: string; node: Record<string, unknown> }> = [];
  collectSections(doc, sections);

  console.log(`  Found ${sections.length} total sections in Title ${titleNum}`);

  // Get targets for this title
  const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);

  const seed: SeedFile = { documents: [], provisions: [] };

  for (const target of targets) {
    const docIndex = seed.documents.length;

    // Build document entry
    seed.documents.push({
      jurisdiction: 'US-FED',
      title: target.name,
      identifier: target.identifier,
      short_name: target.short_name,
      document_type: target.document_type,
      status: target.status,
      effective_date: target.effective_date,
      last_amended: target.last_amended,
      source_url: govInfoUrl(titleNum),
    });

    // Find matching sections
    let orderIndex = 0;
    for (const { identifier, node } of sections) {
      const sectionId = extractSectionId(identifier);
      if (sectionMatches(sectionId, target)) {
        orderIndex++;
        const heading = extractHeading(node);
        const text = cleanText(extractText(node));

        if (text.length < 10) continue; // Skip empty/trivial sections

        seed.provisions.push({
          document_index: docIndex,
          jurisdiction: 'US-FED',
          section_number: `\u00a7 ${sectionId}`,
          title: heading,
          text,
          order_index: orderIndex,
        });
      }
    }

    console.log(`  ${target.short_name}: ${orderIndex} provisions extracted`);
  }

  return seed;
}

/**
 * Recursively walk the parsed XML tree and collect all elements
 * that have an @_identifier attribute matching the USC section pattern.
 */
function collectSections(
  node: unknown,
  out: Array<{ identifier: string; node: Record<string, unknown> }>,
): void {
  if (node === null || node === undefined || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (const item of node) {
      collectSections(item, out);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  // Check if this node has a section identifier
  const id = obj['@_identifier'];
  if (typeof id === 'string' && /\/us\/usc\/t\d+\/s/.test(id)) {
    out.push({ identifier: id, node: obj });
    // Don't recurse into matched sections — we'll extract text from them directly
    return;
  }

  // Recurse into child elements
  for (const key of Object.keys(obj)) {
    if (key.startsWith('@_')) continue;
    collectSections(obj[key], out);
  }
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP — Federal USC XML Fetcher ===\n');

  const titles = flags.titleFilter !== null
    ? REQUIRED_TITLES.filter((t) => t === flags.titleFilter)
    : REQUIRED_TITLES;

  if (titles.length === 0) {
    console.error(`No matching titles found for --title ${flags.titleFilter}`);
    process.exit(1);
  }

  // ── Dry run: just list targets ───────────────────────────────────
  if (flags.dryRun) {
    console.log('DRY RUN — listing targets without downloading:\n');
    for (const titleNum of titles) {
      const targets = FEDERAL_TARGETS.filter((t) => t.usc_title === titleNum);
      console.log(`Title ${titleNum}:`);
      for (const t of targets) {
        const range = t.sections.end
          ? `\u00a7\u00a7 ${t.sections.start}\u2013${t.sections.end}`
          : `\u00a7 ${t.sections.start}`;
        console.log(`  ${t.short_name.padEnd(20)} ${range.padEnd(20)} ${t.name}`);
      }
    }
    console.log(`\nTotal: ${FEDERAL_TARGETS.filter((t) => titles.includes(t.usc_title)).length} statutes across ${titles.length} USC titles`);
    console.log(`Source: GovInfo bulk data (${USC_YEAR})`);
    return;
  }

  // ── Fetch and parse ──────────────────────────────────────────────
  fs.mkdirSync(SEED_DIR, { recursive: true });

  for (const titleNum of titles) {
    console.log(`\n── Title ${titleNum} ──`);
    const xml = await downloadTitle(titleNum);
    const seed = parseTitle(xml, titleNum);

    const outFile = path.join(SEED_DIR, `title${titleNum}.json`);
    fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

    const docCount = seed.documents.length;
    const provCount = seed.provisions.length;
    console.log(`  Wrote ${outFile} (${docCount} documents, ${provCount} provisions)`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
