/**
 * parsers/legislature.ts — Generic state legislature parser
 *
 * The workhorse parser handling ~44 states with common HTML patterns.
 * Designed to be resilient: extracts something useful from most pages,
 * even when the HTML structure doesn't perfectly match expectations.
 *
 * Common section number formats across states:
 *   - "§ 1234"  or  "§§ 1234-1235"
 *   - "Section 1234"  or  "Sec. 1234"
 *   - "1234.01"  or  "1234-01"  or  "1234A"
 *   - "Art. 1234"
 *   - "Chapter 1234, Section 5"
 */
import * as cheerio from 'cheerio';
import { registerParser, type ParsedProvision } from './registry.js';

// ── Section number patterns (ordered from most to least specific) ──

const SECTION_PATTERNS: RegExp[] = [
  // "§ 1798.82" or "§§ 1798.82-1798.84"
  /§§?\s*(\d+[\w.-]*(?:\s*[-–]\s*\d+[\w.-]*)?)/,
  // "Section 1234" or "Sec. 1234"
  /\bSec(?:tion|\.)\s+(\d+[\w.-]*)/i,
  // "Article 1234"
  /\bArt(?:icle|\.)\s+(\d+[\w.-]*)/i,
  // Standalone numeric sections like "1234.01" or "1234-5-101"
  /\b(\d{2,}(?:[.-]\d+)+[a-zA-Z]?)\b/,
];

/** Combined pattern for splitting text on section boundaries */
const SECTION_BOUNDARY_RE = /(?:§§?\s*\d+[\w.-]*(?:\s*[-–]\s*\d+[\w.-]*)?|(?:Sec(?:tion|\.))\s+\d+[\w.-]*|(?:Art(?:icle|\.))\s+\d+[\w.-]*)/gi;

/** Selectors for elements to remove before parsing */
const REMOVE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '#header', '#footer', '#sidebar', '#navigation', '#nav',
  '.nav', '.navbar', '.menu', '.sidebar', '.footer', '.header',
  '.breadcrumb', '.breadcrumbs', '.toolbar', '.pagination',
  '.cookie-banner', '.cookie-notice', '.banner',
  'script', 'style', 'noscript', 'iframe',
].join(', ');

/** Selectors for main content containers (tried in order) */
const CONTENT_SELECTORS = [
  // Common state legislature content containers
  '#content', '#main-content', '#maincontent',
  '#content-body', '#statute-body', '#lawContent',
  'main', 'article',
  '.content', '.main-content', '.statute-content',
  '.law-text', '.bill-text', '.code-text',
  '[role="main"]',
  // Broader fallbacks
  '#wrapper', '.wrapper', '#container', '.container',
  'body',
];

/**
 * Try to extract a title from the text following a section number.
 * Many states put section titles in the same line or next element.
 */
function extractTitle(text: string): string {
  // Look for a title pattern like "Short title" or "Definitions" on the first line
  const firstLine = text.split('\n')[0]?.trim() ?? '';
  // If the first line is short enough, treat it as a title
  if (firstLine.length > 0 && firstLine.length < 200 && !firstLine.match(/^\(/)) {
    return firstLine;
  }
  return '';
}

/**
 * Extract section number from a text fragment using our pattern library.
 */
function findSectionNumber(text: string): string | null {
  for (const pattern of SECTION_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      return match[1] ?? match[0] ?? null;
    }
  }
  return null;
}

function parseLegislature(html: string, _url: string): ParsedProvision[] {
  try {
    const $ = cheerio.load(html);
    const provisions: ParsedProvision[] = [];

    // Clean the DOM
    $(REMOVE_SELECTORS).remove();

    // Find the best content container
    let $content: ReturnType<typeof $> | null = null;
    for (const sel of CONTENT_SELECTORS) {
      const $el = $(sel);
      if ($el.length > 0) {
        const text = ($el.text() ?? '').trim();
        if (text.length > 100) {
          $content = $el;
          break;
        }
      }
    }

    if (!$content) return [];

    // ── Strategy 1: Structured section elements ────────────────────
    // Many legislatures wrap each section in a specific element
    const structuredSelectors = [
      '.section', '.statute-section', '.law-section',
      '[class*="section"]', '[id*="section"]',
      'div.level-section', 'div.code-section',
    ];

    for (const sel of structuredSelectors) {
      const $sections = $content.find(sel);
      if ($sections.length >= 2) {
        $sections.each((_i, el) => {
          const sectionText = ($(el).text() ?? '').trim();
          if (sectionText.length < 20) return;

          const sectionNum = findSectionNumber(sectionText);
          if (!sectionNum) return;

          // Remove the section number prefix from text
          const cleanedText = sectionText
            .replace(SECTION_BOUNDARY_RE, '')
            .trim();

          const title = extractTitle(cleanedText);
          provisions.push({
            sectionNumber: `\u00A7 ${sectionNum}`,
            title,
            text: cleanedText,
          });
        });

        if (provisions.length > 0) return provisions;
      }
    }

    // ── Strategy 2: Heading-based extraction ────────────────────────
    // Look for section numbers in headings (h1-h6, strong, b)
    const headingEls = $content.find('h1, h2, h3, h4, h5, h6, strong, b');
    const headingProvisions: ParsedProvision[] = [];

    headingEls.each((_i, el) => {
      const headingText = ($(el).text() ?? '').trim();
      const sectionNum = findSectionNumber(headingText);
      if (!sectionNum) return;

      // Collect all text until the next heading with a section number
      const textParts: string[] = [];
      const current = $(el).parent().length ? $(el).parent() : $(el);
      let sibling = current.next();
      let iterations = 0;

      while (sibling.length > 0 && iterations < 100) {
        iterations++;
        const sibText = (sibling.text() ?? '').trim();
        // Stop if we hit another section header
        if (findSectionNumber(sibling.find('h1, h2, h3, h4, h5, h6, strong, b').first().text() ?? '')) {
          break;
        }
        if (sibText.length > 0) {
          textParts.push(sibText);
        }
        sibling = sibling.next();
      }

      const fullText = textParts.join('\n').trim();
      if (fullText.length > 10) {
        const title = headingText
          .replace(SECTION_BOUNDARY_RE, '')
          .replace(/^[\s.:-]+/, '')
          .trim();
        headingProvisions.push({
          sectionNumber: `\u00A7 ${sectionNum}`,
          title,
          text: fullText,
        });
      }
    });

    if (headingProvisions.length > 0) return headingProvisions;

    // ── Strategy 3: Full-text line-by-line split ────────────────────
    // Last structured approach: split text on section boundaries
    const fullText = ($content.text() ?? '').trim();
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentProvision: ParsedProvision | null = null;

    for (const line of lines) {
      const sectionNum = findSectionNumber(line);
      // Only treat as a new section if the section number appears near the start
      const isNewSection = sectionNum && line.indexOf(sectionNum) < 50;

      if (isNewSection && sectionNum) {
        if (currentProvision && currentProvision.text.length > 10) {
          provisions.push(currentProvision);
        }
        const afterNum = line.replace(SECTION_BOUNDARY_RE, '').replace(/^[\s.:-]+/, '').trim();
        currentProvision = {
          sectionNumber: `\u00A7 ${sectionNum}`,
          title: extractTitle(afterNum),
          text: afterNum,
        };
      } else if (currentProvision) {
        currentProvision.text += '\n' + line;
      }
    }

    if (currentProvision && currentProvision.text.length > 10) {
      provisions.push(currentProvision);
    }

    return provisions;
  } catch {
    return [];
  }
}

registerParser('legislature', parseLegislature);
