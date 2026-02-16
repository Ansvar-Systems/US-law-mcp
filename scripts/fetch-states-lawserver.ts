#!/usr/bin/env tsx
/**
 * fetch-states-lawserver.ts — Fetch full statute text from LawServer.com
 *
 * Replaces the thin state seed data (1-2 provisions, ~600 char summaries)
 * with real full-text provisions by scraping LawServer's server-rendered HTML.
 *
 * Strategy:
 *   1. For each statute, fetch the chapter/article listing page on LawServer
 *   2. Parse listing pages to discover individual section URLs
 *   3. Fetch each section page and extract the full statute text using cheerio
 *   4. Write seed JSON files in the same format as the existing pipeline
 *
 * Usage:
 *   npm run fetch:states:lawserver                    # fetch all states
 *   npm run fetch:states:lawserver -- --dry-run       # list targets without fetching
 *   npm run fetch:states:lawserver -- --state CA      # fetch only California
 *   npm run fetch:states:lawserver -- --state AL --state CA  # fetch multiple
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import { STATE_TARGETS, type StateTarget } from '../data/manifests/state-targets.js';

// ── Paths ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'source', 'lawserver');
const SEED_DIR = path.join(ROOT, 'data', 'seed', 'states');

// ── Seed JSON types ────────────────────────────────────────────────
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
  stateFilters: string[];
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = { dryRun: false, stateFilters: [] };
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
      flags.stateFilters.push(next.toUpperCase());
      i++;
    }
  }
  return flags;
}

// ── Delay helper ───────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTML download with caching ─────────────────────────────────────

const BASE_URL = 'https://www.lawserver.com';

function cacheFilename(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 200) + '.html';
}

async function fetchHtml(url: string, cacheDir: string): Promise<string | null> {
  const cacheFile = path.join(cacheDir, cacheFilename(url));

  // Use cached file if < 30 days old
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < 30 * 24 * 60 * 60 * 1000) {
      return fs.readFileSync(cacheFile, 'utf-8');
    }
  }

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        'User-Agent':
          'Ansvar-US-Law-MCP/0.1 (legal-research; +https://github.com/Ansvar-Systems/US-law-mcp)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!resp.ok) {
      console.warn(`    WARNING: HTTP ${resp.status} for ${url}`);
      return null;
    }

    const html = await resp.text();
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, html, 'utf-8');
    return html;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`    WARNING: Failed to fetch ${url}: ${msg}`);
    return null;
  }
}

// ── LawServer chapter listing URL mapping ──────────────────────────
//
// Each statute in the manifest needs a LawServer chapter listing URL.
// From the listing page we discover individual section URLs.
// The mapping key is `{stateAbbrev}:{shortName}` from the manifest.
//
// When a single section URL is provided (not a chapter listing),
// the script fetches just that one section.

interface LawServerMapping {
  /** LawServer chapter listing URL(s) to crawl for section links */
  chapterUrls: string[];
  /** Path segment in LawServer URLs (e.g. 'codes', 'al-code', etc.) */
  pathSegment: string;
  /** Optional: filter section links to only those matching this pattern */
  sectionFilter?: RegExp;
}

const LAWSERVER_MAP: Record<string, LawServerMapping> = {
  // ── Alabama ──
  'AL:AL Breach': {
    chapterUrls: [`${BASE_URL}/law/state/alabama/al-code/alabama_code_title_8_chapter_38`],
    pathSegment: 'al-code',
  },

  // ── Alaska ──
  'AK:AK Breach': {
    chapterUrls: [`${BASE_URL}/law/state/alaska/ak-statutes/alaska_statutes_chapter_45-48`],
    pathSegment: 'ak-statutes',
  },

  // ── Arizona ──
  'AZ:AZ Breach': {
    chapterUrls: [`${BASE_URL}/law/state/arizona/az-laws/arizona_laws_title_18_chapter_5_article_4`],
    pathSegment: 'az-laws',
    sectionFilter: /18-55/,
  },

  // ── Arkansas ──
  'AR:AR Breach': {
    chapterUrls: [`${BASE_URL}/law/state/arkansas/ar-code/arkansas_code_title_4_subtitle_7_chapter_110`],
    pathSegment: 'ar-code',
  },

  // ── California ──
  'CA:CA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/california/codes/california_civil_code_1798-82`],
    pathSegment: 'codes',
  },
  'CA:CCPA/CPRA': {
    chapterUrls: [`${BASE_URL}/law/state/california/codes/california_civil_code_division_3_part_4_title_1-81-5`],
    pathSegment: 'codes',
  },

  // ── Colorado ──
  'CO:CO Breach': {
    chapterUrls: [`${BASE_URL}/law/state/colorado/co-code/colorado_revised_statutes_title_6_article_1_part_7`],
    pathSegment: 'co-code',
    sectionFilter: /6-1-71[3-9]/,
  },
  'CO:CPA': {
    chapterUrls: [`${BASE_URL}/law/state/colorado/co-code/colorado_revised_statutes_title_6_article_1_part_13`],
    pathSegment: 'co-code',
  },

  // ── Connecticut ──
  'CT:CT Breach': {
    chapterUrls: [`${BASE_URL}/law/state/connecticut/ct-laws/connecticut_statutes_36a-701b`],
    pathSegment: 'ct-laws',
  },
  'CT:CTDPA': {
    chapterUrls: [`${BASE_URL}/law/state/connecticut/ct-laws/connecticut_statutes_title_42_chapter_743dd`],
    pathSegment: 'ct-laws',
  },

  // ── Delaware ──
  'DE:DE Breach': {
    chapterUrls: [`${BASE_URL}/law/state/delaware/codes/delaware_code_title_6_chapter_12b`],
    pathSegment: 'codes',
  },
  'DE:DPDPA': {
    chapterUrls: [`${BASE_URL}/law/state/delaware/codes/delaware_code_title_6_chapter_12d`],
    pathSegment: 'codes',
  },

  // ── District of Columbia ──
  'DC:DC Breach': {
    chapterUrls: [`${BASE_URL}/law/state/district-of-columbia/dc-code/dc_code_28-3851`],
    pathSegment: 'dc-code',
  },

  // ── Florida ──
  'FL:FIPA': {
    chapterUrls: [`${BASE_URL}/law/state/florida/statutes/florida_statutes_501-171`],
    pathSegment: 'statutes',
  },

  // ── Georgia ──
  'GA:GA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/georgia/ga-code/georgia_code_title_10_chapter_1_article_34`],
    pathSegment: 'ga-code',
  },

  // ── Hawaii ──
  'HI:HI Breach': {
    chapterUrls: [`${BASE_URL}/law/state/hawaii/codes/hawaii_statutes_chapter_487n`],
    pathSegment: 'codes',
  },

  // ── Idaho ──
  'ID:ID Breach': {
    chapterUrls: [`${BASE_URL}/law/state/idaho/codes/idaho_code_title_28_chapter_51`],
    pathSegment: 'codes',
  },

  // ── Illinois ──
  'IL:IL Breach': {
    chapterUrls: [`${BASE_URL}/law/state/illinois/codes/815_ilcs_530`],
    pathSegment: 'codes',
  },

  // ── Indiana ──
  'IN:IN Breach': {
    chapterUrls: [`${BASE_URL}/law/state/indiana/codes/indiana_code_title_24_article_4-9`],
    pathSegment: 'codes',
  },
  'IN:INCDPA': {
    chapterUrls: [`${BASE_URL}/law/state/indiana/codes/indiana_code_title_24_article_15`],
    pathSegment: 'codes',
  },

  // ── Iowa ──
  'IA:IA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/iowa/ia-code/iowa_code_chapter_715c`],
    pathSegment: 'ia-code',
  },
  'IA:IACDPA': {
    chapterUrls: [`${BASE_URL}/law/state/iowa/ia-code/iowa_code_chapter_715d`],
    pathSegment: 'ia-code',
  },

  // ── Kansas ──
  'KS:KS Breach': {
    chapterUrls: [`${BASE_URL}/law/state/kansas/codes/kansas_statutes_chapter_50_article_7a`],
    pathSegment: 'codes',
  },

  // ── Kentucky ──
  'KY:KY Breach': {
    chapterUrls: [`${BASE_URL}/law/state/kentucky/codes/kentucky_statutes_365-732`],
    pathSegment: 'codes',
  },
  'KY:KYCDPA': {
    chapterUrls: [`${BASE_URL}/law/state/kentucky/codes/kentucky_statutes_chapter_367`],
    pathSegment: 'codes',
    sectionFilter: /367\.5/,
  },

  // ── Louisiana ──
  'LA:LA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/louisiana/la-laws/louisiana_revised_statutes_title_51_chapter_51`],
    pathSegment: 'la-laws',
  },

  // ── Maine ──
  'ME:ME Breach': {
    chapterUrls: [`${BASE_URL}/law/state/maine/me-statutes/maine_revised_statutes_title_10_part_3_chapter_210-b`],
    pathSegment: 'me-statutes',
  },

  // ── Maryland ──
  'MD:MD Breach': {
    chapterUrls: [`${BASE_URL}/law/state/maryland/md-laws/maryland_laws_commercial_law_title_14_subtitle_35`],
    pathSegment: 'md-laws',
  },
  'MD:MODPA': {
    chapterUrls: [`${BASE_URL}/law/state/maryland/md-laws/maryland_laws_commercial_law_title_14_subtitle_46`],
    pathSegment: 'md-laws',
  },

  // ── Massachusetts ──
  'MA:MA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/massachusetts/ma-laws/massachusetts_general_laws_chapter_93h`],
    pathSegment: 'ma-laws',
  },
  'MA:MA 201 CMR 17.00': {
    // Regulation, not on LawServer - skip
    chapterUrls: [],
    pathSegment: 'ma-laws',
  },

  // ── Michigan ──
  'MI:MI Breach': {
    chapterUrls: [`${BASE_URL}/law/state/michigan/mi-laws/michigan_laws_445-72`],
    pathSegment: 'mi-laws',
  },

  // ── Minnesota ──
  'MN:MN Breach': {
    chapterUrls: [`${BASE_URL}/law/state/minnesota/codes/minnesota_statutes_325e-61`],
    pathSegment: 'codes',
  },
  'MN:MNCDPA': {
    chapterUrls: [`${BASE_URL}/law/state/minnesota/codes/minnesota_statutes_chapter_325o`],
    pathSegment: 'codes',
  },

  // ── Mississippi ──
  'MS:MS Breach': {
    chapterUrls: [`${BASE_URL}/law/state/mississippi/ms-code/mississippi_code_75-24-29`],
    pathSegment: 'ms-code',
  },

  // ── Missouri ──
  'MO:MO Breach': {
    chapterUrls: [`${BASE_URL}/law/state/missouri/mo-laws/missouri_laws_407-1500`],
    pathSegment: 'mo-laws',
  },

  // ── Montana ──
  'MT:MT Breach': {
    chapterUrls: [`${BASE_URL}/law/state/montana/codes/montana_code_title_30_chapter_14_part_17`],
    pathSegment: 'codes',
  },
  'MT:MTCDPA': {
    chapterUrls: [`${BASE_URL}/law/state/montana/codes/montana_code_title_30_chapter_14_part_28`],
    pathSegment: 'codes',
  },

  // ── Nebraska ──
  'NE:NE Breach': {
    chapterUrls: [`${BASE_URL}/law/state/nebraska/codes/nebraska_statutes_chapter_87_article_8`],
    pathSegment: 'codes',
  },
  'NE:NEDPA': {
    chapterUrls: [`${BASE_URL}/law/state/nebraska/codes/nebraska_statutes_chapter_87_article_11`],
    pathSegment: 'codes',
  },

  // ── Nevada ──
  'NV:NV Breach': {
    chapterUrls: [`${BASE_URL}/law/state/nevada/codes/nevada_revised_statutes_chapter_603a`],
    pathSegment: 'codes',
  },

  // ── New Hampshire ──
  'NH:NH Breach': {
    chapterUrls: [`${BASE_URL}/law/state/new-hampshire/nh-statutes/new_hampshire_revised_statutes_chapter_359-c`],
    pathSegment: 'nh-statutes',
    sectionFilter: /359-c[_-](19|20|21)/,
  },
  'NH:NHPA': {
    chapterUrls: [`${BASE_URL}/law/state/new-hampshire/nh-statutes/new_hampshire_revised_statutes_chapter_507-h`],
    pathSegment: 'nh-statutes',
  },

  // ── New Jersey ──
  'NJ:NJ Breach': {
    chapterUrls: [`${BASE_URL}/law/state/new-jersey/nj-laws/new_jersey_laws_title_56_chapter_8`],
    pathSegment: 'nj-laws',
    sectionFilter: /56[_-]8-16[1-6]/,
  },
  'NJ:NJDPA': {
    chapterUrls: [`${BASE_URL}/law/state/new-jersey/nj-laws/new_jersey_laws_title_56_chapter_8`],
    pathSegment: 'nj-laws',
    sectionFilter: /56[_-]8-166\./,
  },

  // ── New Mexico ──
  'NM:NM Breach': {
    chapterUrls: [`${BASE_URL}/law/state/new-mexico/nm-statutes/new_mexico_statutes_chapter_57_article_12c`],
    pathSegment: 'nm-statutes',
  },

  // ── New York ──
  'NY:NY Breach': {
    chapterUrls: [`${BASE_URL}/law/state/new-york/codes/ny_general_business_law_899-aa`],
    pathSegment: 'codes',
  },
  'NY:SHIELD Act': {
    chapterUrls: [`${BASE_URL}/law/state/new-york/codes/ny_general_business_law_899-bb`],
    pathSegment: 'codes',
  },

  // ── North Carolina ──
  'NC:NC Breach': {
    chapterUrls: [`${BASE_URL}/law/state/north-carolina/nc-laws/north_carolina_laws_chapter_75_article_2a`],
    pathSegment: 'nc-laws',
  },

  // ── North Dakota ──
  'ND:ND Breach': {
    chapterUrls: [`${BASE_URL}/law/state/north-dakota/nd-code/north_dakota_code_chapter_51_30`],
    pathSegment: 'nd-code',
  },

  // ── Ohio ──
  'OH:OH Breach': {
    chapterUrls: [`${BASE_URL}/law/state/ohio/codes/ohio_code_1349-19`],
    pathSegment: 'codes',
  },
  'OH:OH DPA': {
    chapterUrls: [`${BASE_URL}/law/state/ohio/codes/ohio_code_chapter_1354`],
    pathSegment: 'codes',
  },

  // ── Oklahoma ──
  'OK:OK Breach': {
    chapterUrls: [`${BASE_URL}/law/state/oklahoma/ok-statutes/oklahoma_statutes_title_24`],
    pathSegment: 'ok-statutes',
    sectionFilter: /24-16[1-9]/,
  },

  // ── Oregon ──
  'OR:OR Breach': {
    chapterUrls: [`${BASE_URL}/law/state/oregon/or-statutes/oregon_statutes_646a-604`],
    pathSegment: 'or-statutes',
  },
  'OR:OCPA': {
    chapterUrls: [`${BASE_URL}/law/state/oregon/or-statutes/oregon_statutes_chapter_646a`],
    pathSegment: 'or-statutes',
    sectionFilter: /646a-5[67]/,
  },

  // ── Pennsylvania ──
  'PA:PA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/pennsylvania/pa-statutes/pennsylvania_statutes_title_73_chapter_43`],
    pathSegment: 'pa-statutes',
  },

  // ── Rhode Island ──
  'RI:RI Breach': {
    chapterUrls: [`${BASE_URL}/law/state/rhode-island/ri-laws/rhode_island_general_laws_chapter_11-49-3`],
    pathSegment: 'ri-laws',
  },
  'RI:RIDTPPA': {
    chapterUrls: [`${BASE_URL}/law/state/rhode-island/ri-laws/rhode_island_general_laws_chapter_6-48-1`],
    pathSegment: 'ri-laws',
  },

  // ── South Carolina ──
  'SC:SC Breach': {
    chapterUrls: [`${BASE_URL}/law/state/south-carolina/sc-code/south_carolina_code_39-1-90`],
    pathSegment: 'sc-code',
  },

  // ── South Dakota ──
  'SD:SD Breach': {
    chapterUrls: [`${BASE_URL}/law/state/south-dakota/sd-code/south_dakota_codified_laws_title_22_chapter_40`],
    pathSegment: 'sd-code',
    sectionFilter: /22-40-(19|20|21|22|23|24|25|26)/,
  },

  // ── Tennessee ──
  'TN:TN Breach': {
    chapterUrls: [`${BASE_URL}/law/state/tennessee/tn-code/tennessee_code_47-18-2107`],
    pathSegment: 'tn-code',
  },
  'TN:TIPA': {
    chapterUrls: [`${BASE_URL}/law/state/tennessee/tn-code/tennessee_code_title_47_chapter_18_part_32`],
    pathSegment: 'tn-code',
  },

  // ── Texas ──
  'TX:TX Breach': {
    chapterUrls: [
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_521_subchapter_a`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_521_subchapter_b`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_521_subchapter_c`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_521_subchapter_d`,
    ],
    pathSegment: 'codes',
  },
  'TX:TDPSA': {
    chapterUrls: [
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_541_subchapter_a`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_541_subchapter_b`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_541_subchapter_c`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_541_subchapter_d`,
      `${BASE_URL}/law/state/texas/codes/texas_business_and_commerce_code_chapter_541_subchapter_e`,
    ],
    pathSegment: 'codes',
  },

  // ── Utah ──
  'UT:UT Breach': {
    chapterUrls: [`${BASE_URL}/law/state/utah/codes/utah_code_title_13_chapter_44`],
    pathSegment: 'codes',
  },
  'UT:UCPA': {
    chapterUrls: [`${BASE_URL}/law/state/utah/codes/utah_code_title_13_chapter_61`],
    pathSegment: 'codes',
  },

  // ── Vermont ──
  'VT:VT Breach': {
    chapterUrls: [`${BASE_URL}/law/state/vermont/vt-statutes/vermont_statutes_title_9_chapter_62`],
    pathSegment: 'vt-statutes',
  },

  // ── Virginia ──
  'VA:VA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/virginia/codes/virginia_code_18-2-186-6`],
    pathSegment: 'codes',
  },
  'VA:VCDPA': {
    chapterUrls: [`${BASE_URL}/law/state/virginia/codes/virginia_code_title_59-1_chapter_53`],
    pathSegment: 'codes',
  },

  // ── Washington ──
  'WA:WA Breach': {
    chapterUrls: [`${BASE_URL}/law/state/washington/wa-code/washington_code_chapter_19-255`],
    pathSegment: 'wa-code',
  },

  // ── West Virginia ──
  'WV:WV Breach': {
    chapterUrls: [`${BASE_URL}/law/state/west-virginia/wv-code/west_virginia_code_chapter_46a_article_2a`],
    pathSegment: 'wv-code',
  },

  // ── Wisconsin ──
  'WI:WI Breach': {
    chapterUrls: [`${BASE_URL}/law/state/wisconsin/wi-laws/wisconsin_laws_134-98`],
    pathSegment: 'wi-laws',
  },

  // ── Wyoming ──
  'WY:WY Breach': {
    chapterUrls: [`${BASE_URL}/law/state/wyoming/wy-statutes/wyoming_statutes_title_40_chapter_12_article_5`],
    pathSegment: 'wy-statutes',
  },
};

// ── Extract section links from a chapter listing page ──────────────

function extractSectionLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  // LawServer uses relative links in the content area
  // Section links are typically in the main content, linking to individual statute sections
  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip navigation, footer, and non-statute links
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;
    if (href.includes('legal-dictionary') || href.includes('attorney') || href.includes('lawyer')) return;
    if (href.includes('/search') || href.includes('/login') || href.includes('/signup')) return;
    if (href.includes('archv-')) return; // Skip archived versions

    // Identify section-level links (not chapter/title listings)
    // Section links typically contain numbers/section identifiers
    const linkText = $(el).text().trim();
    if (!linkText) return;

    // Match links that look like statute section references
    // They typically contain § or "Section" or have numeric section patterns
    const isSection =
      /§\s*\d/.test(linkText) ||
      /^(Section|Sec\.)\s/i.test(linkText) ||
      /^\d+[-.][\d.]+/.test(linkText) ||
      /^[A-Z]+\.\s/.test(linkText);

    // Also match links whose href contains typical section-level slug patterns
    const isSectionHref =
      /\d+[-_]\d+/.test(href) && !href.includes('chapter') && !href.includes('title') && !href.includes('article') && !href.includes('part');

    if (isSection || isSectionHref) {
      // Resolve relative URL
      const resolvedUrl = new URL(href, pageUrl).href;
      if (resolvedUrl.includes('lawserver.com/law/state/')) {
        links.push(resolvedUrl);
      }
    }
  });

  return [...new Set(links)];
}

// ── Extract statute text from a section page ───────────────────────

interface ExtractedSection {
  sectionNumber: string;
  title: string;
  text: string;
}

function extractSectionText(html: string, url: string): ExtractedSection | null {
  const $ = cheerio.load(html);

  // Extract the title from h1 or h2
  let titleEl = $('h1').first();
  if (!titleEl.length) {
    titleEl = $('h2').first();
  }
  let rawTitle = titleEl.text().trim();
  if (!rawTitle) return null;

  // Parse section number and title from heading
  // Formats: "Alabama Code 8-38-1. Short title"
  //          "California Civil Code 1798.100 – General Duties..."
  //          "N.Y. General Business Law 899-AA – Notification..."
  let sectionNumber = '';
  let title = rawTitle;

  // Try to extract section number: look for patterns like "8-38-1", "1798.100", "899-AA", "501.171"
  const sectionMatch = rawTitle.match(
    /(?:§\s*)?(\d+[-.][\w.]+(?:[-.][\w.]+)*)(?:\s*[.–—-]\s*(.+))?$/
  );
  if (sectionMatch) {
    sectionNumber = `§ ${sectionMatch[1]}`;
    title = sectionMatch[2]?.trim() || rawTitle;
  } else {
    // Try alternative: extract last numeric portion
    const altMatch = rawTitle.match(/\b(\d+[A-Za-z]?[-_.]\d+[A-Za-z]?(?:[-_.]\d+[A-Za-z]?)*)\b/);
    if (altMatch) {
      sectionNumber = `§ ${altMatch[1]}`;
      // Extract title after the number
      const afterNum = rawTitle.substring(rawTitle.indexOf(altMatch[1]!) + altMatch[1]!.length);
      const titlePart = afterNum.replace(/^[\s.–—-]+/, '').trim();
      title = titlePart || rawTitle;
    }
  }

  // Extract the body text
  // LawServer puts statute text in paragraphs within the main content area
  // We need to avoid navigation, sidebars, footer, and attorney listings
  const textParts: string[] = [];

  // Strategy: find the main content area after the h1/h2 heading
  // and before sidebars/footers
  const mainContent = $('article, .entry-content, .content, main').first();
  const container = mainContent.length ? mainContent : $('body');

  // Collect all paragraph text, list items, and content after the heading
  let foundHeading = false;
  container.find('h1, h2, h3, h4, h5, h6, p, ol, ul, blockquote, div.statute-text, pre').each((_i, el) => {
    const tag = el.tagName?.toLowerCase();
    const elText = $(el).text().trim();

    // Skip empty elements
    if (!elText) return;

    // Start collecting after we find the main heading
    if ((tag === 'h1' || tag === 'h2') && elText === rawTitle) {
      foundHeading = true;
      return;
    }

    if (!foundHeading) return;

    // Stop at "Related" sections, attorney blocks, footer content
    if (/^(Related|Featured|Terms Used|Find a|Similar|See Also|Law Summaries)/i.test(elText)) return;
    if (/attorneys?|lawyers?/i.test(elText) && elText.length < 100) return;
    if (/^(Previous section|Next section|Table of Contents)/i.test(elText)) return;

    // Skip "Terms Used In..." definition blocks (h4 headers for them)
    if (tag === 'h4' && /^Terms Used In/i.test(elText)) {
      return;
    }

    // Skip h3/h4/h5/h6 that are navigation headers
    if ((tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') &&
        /chapter|article|title|subchapter|part/i.test(elText) &&
        !/(definition|section|subsection)/i.test(elText)) {
      return;
    }

    // For lists, extract text properly
    if (tag === 'ol' || tag === 'ul') {
      $(el).find('li').each((_li, liEl) => {
        const liText = $(liEl).text().trim();
        if (liText) {
          textParts.push(liText);
        }
      });
      return;
    }

    // For paragraphs, take the text directly
    if (tag === 'p') {
      textParts.push(elText);
      return;
    }
  });

  // If we didn't find text after heading, try a more aggressive approach
  if (textParts.length === 0) {
    // Get all <p> elements, filter out navigational/boilerplate content
    container.find('p').each((_i, el) => {
      const t = $(el).text().trim();
      if (!t) return;
      if (t.length < 10) return;
      if (/^(Previous|Next|Table of|Related|Featured|Find a)/i.test(t)) return;
      if (/attorneys?|lawyers?|sponsored/i.test(t) && t.length < 100) return;
      textParts.push(t);
    });
  }

  const text = textParts.join('\n\n').trim();

  // Skip if we got essentially no statute text
  if (text.length < 50) return null;

  return { sectionNumber, title, text };
}

// ── Process a single statute ────────────────────────────────────────

async function processStatute(
  state: StateTarget,
  statuteIndex: number,
  cacheDir: string,
): Promise<SeedProvision[]> {
  const statute = state.statutes[statuteIndex]!;
  const mapKey = `${state.abbreviation}:${statute.shortName}`;
  const mapping = LAWSERVER_MAP[mapKey];

  if (!mapping || mapping.chapterUrls.length === 0) {
    console.log(`    ${statute.shortName}: No LawServer mapping found, skipping`);
    return [];
  }

  const allSectionUrls: string[] = [];
  let requestCount = 0;

  // Step 1: Fetch chapter listing pages to discover section URLs
  for (const chapterUrl of mapping.chapterUrls) {
    if (requestCount > 0) await delay(1000);
    requestCount++;

    console.log(`    Fetching listing: ${chapterUrl.split('/').slice(-1)[0]}`);
    const html = await fetchHtml(chapterUrl, cacheDir);
    if (!html) {
      // The chapter URL might itself be a section page
      // (for single-section statutes like FL 501.171)
      allSectionUrls.push(chapterUrl);
      continue;
    }

    const sectionLinks = extractSectionLinks(html, chapterUrl);

    if (sectionLinks.length === 0) {
      // No section links found = this IS a section page, not a listing
      allSectionUrls.push(chapterUrl);
    } else {
      allSectionUrls.push(...sectionLinks);
    }
  }

  // Apply section filter if specified
  let filteredUrls = allSectionUrls;
  if (mapping.sectionFilter) {
    filteredUrls = allSectionUrls.filter((url) => mapping.sectionFilter!.test(url));
  }

  // Deduplicate
  filteredUrls = [...new Set(filteredUrls)];

  if (filteredUrls.length === 0) {
    console.warn(`    ${statute.shortName}: No section URLs discovered`);
    return [];
  }

  console.log(`    ${statute.shortName}: Found ${filteredUrls.length} section URLs`);

  // Step 2: Fetch each section and extract text
  const provisions: SeedProvision[] = [];
  let orderIndex = 1;

  for (const sectionUrl of filteredUrls) {
    if (requestCount > 0) await delay(1000);
    requestCount++;

    const html = await fetchHtml(sectionUrl, cacheDir);
    if (!html) continue;

    const extracted = extractSectionText(html, sectionUrl);
    if (!extracted) continue;

    provisions.push({
      document_index: statuteIndex,
      jurisdiction: state.code,
      section_number: extracted.sectionNumber,
      title: extracted.title,
      text: extracted.text,
      order_index: orderIndex++,
    });
  }

  return provisions;
}

// ── Process a single state ──────────────────────────────────────────

async function processState(state: StateTarget): Promise<SeedFile> {
  const seed: SeedFile = { documents: [], provisions: [] };
  const cacheDir = path.join(SOURCE_DIR, state.abbreviation.toLowerCase());

  for (let i = 0; i < state.statutes.length; i++) {
    const statute = state.statutes[i]!;

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

    const provisions = await processStatute(state, i, cacheDir);
    seed.provisions.push(...provisions);

    console.log(`    ${statute.shortName}: ${provisions.length} provisions extracted`);
  }

  return seed;
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  console.log('=== US Law MCP — LawServer State Statute Fetcher ===\n');

  // Filter states
  let targets = STATE_TARGETS;
  if (flags.stateFilters.length > 0) {
    targets = STATE_TARGETS.filter((s) => flags.stateFilters.includes(s.abbreviation));
    if (targets.length === 0) {
      console.error(`No states found matching: ${flags.stateFilters.join(', ')}`);
      console.error('Valid: ' + STATE_TARGETS.map((s) => s.abbreviation).join(', '));
      process.exit(1);
    }
  }

  // Dry run
  if (flags.dryRun) {
    console.log('DRY RUN — listing targets:\n');
    let mapped = 0;
    let unmapped = 0;

    for (const state of targets) {
      console.log(`${state.code} ${state.name} (${state.abbreviation}):`);
      for (const statute of state.statutes) {
        const mapKey = `${state.abbreviation}:${statute.shortName}`;
        const mapping = LAWSERVER_MAP[mapKey];
        const hasMappingFlag = mapping && mapping.chapterUrls.length > 0 ? 'Y' : 'N';
        if (hasMappingFlag === 'Y') mapped++;
        else unmapped++;
        console.log(
          `  [${hasMappingFlag}] ${statute.shortName.padEnd(20)} [${statute.category}] ${(mapping?.chapterUrls[0] || 'NO MAPPING').slice(0, 80)}`,
        );
      }
    }

    console.log(`\nTotal: ${targets.length} jurisdictions`);
    console.log(`Mapped: ${mapped}, Unmapped: ${unmapped}`);
    return;
  }

  // Fetch and parse
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_DIR, { recursive: true });

  let totalDocs = 0;
  let totalProvisions = 0;
  let statesProcessed = 0;
  let statesFailed = 0;
  const stateStats: Array<{ state: string; provisions: number }> = [];

  for (const state of targets) {
    console.log(`\n── ${state.name} (${state.code}) ──`);

    try {
      const seed = await processState(state);
      const outFile = path.join(SEED_DIR, `${state.abbreviation.toLowerCase()}.json`);
      fs.writeFileSync(outFile, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

      const docCount = seed.documents.length;
      const provCount = seed.provisions.length;
      totalDocs += docCount;
      totalProvisions += provCount;
      statesProcessed++;
      stateStats.push({ state: state.abbreviation, provisions: provCount });

      console.log(
        `  => ${path.relative(ROOT, outFile)} (${docCount} docs, ${provCount} provisions)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${state.name}: ${msg}`);
      statesFailed++;
      stateStats.push({ state: state.abbreviation, provisions: 0 });
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`States processed: ${statesProcessed}`);
  if (statesFailed > 0) console.log(`States failed:    ${statesFailed}`);
  console.log(`Total documents:  ${totalDocs}`);
  console.log(`Total provisions: ${totalProvisions}`);

  // Per-state breakdown
  if (stateStats.length > 1) {
    const avgTextLen = totalProvisions > 0
      ? stateStats.reduce((sum, s) => sum + s.provisions, 0)
      : 0;
    console.log(`\nPer-state provisions:`);
    for (const s of stateStats) {
      const bar = '█'.repeat(Math.min(s.provisions, 50));
      console.log(`  ${s.state.padEnd(3)} ${String(s.provisions).padStart(4)} ${bar}`);
    }

    // Calculate average text length from seed files
    let totalChars = 0;
    let totalProvCount = 0;
    for (const s of stateStats) {
      if (s.provisions === 0) continue;
      const seedFile = path.join(SEED_DIR, `${s.state.toLowerCase()}.json`);
      if (!fs.existsSync(seedFile)) continue;
      const data = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as SeedFile;
      for (const p of data.provisions) {
        totalChars += p.text.length;
        totalProvCount++;
      }
    }
    if (totalProvCount > 0) {
      console.log(`\nAvg text length: ${Math.round(totalChars / totalProvCount)} chars/provision`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
