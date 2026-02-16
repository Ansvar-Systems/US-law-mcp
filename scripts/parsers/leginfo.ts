/**
 * parsers/leginfo.ts — California leginfo.legislature.ca.gov parser
 *
 * Handles two page types:
 *   - codes_displaySection.xhtml  (single section view)
 *   - codes_displayText.xhtml     (multi-section view)
 *
 * California section numbers look like: 1798.82, 1798.100, 56.05
 * Sections may have headings in bold or italic tags immediately after the number.
 */
import * as cheerio from 'cheerio';
import { registerParser, type ParsedProvision } from './index.js';

/** Match California-style section numbers: "1798.82." or "1798.100." */
const CA_SECTION_RE = /^(\d+(?:\.\d+)*)\.\s*/;

/** Match section number with optional title suffix: "1798.82.  (a) Definitions" */
const CA_HEADING_RE = /^(\d+(?:\.\d+)*)\.\s+(.+)/;

function parseLeginfo(html: string, _url: string): ParsedProvision[] {
  try {
    const $ = cheerio.load(html);
    const provisions: ParsedProvision[] = [];

    // Remove navigation, headers, footers
    $('nav, header, footer, #header, #footer, .breadcrumbs, .toolbar, script, style, noscript').remove();

    // Primary content container on leginfo pages
    const contentSelectors = [
      '#content-body',
      '#codeLawContent',
      '#manylawsections',
      '.law-section-body',
      '#content_main',
      'div[id*="content"]',
      'body',
    ];

    let $content: ReturnType<typeof $> | null = null;
    for (const sel of contentSelectors) {
      const $el = $(sel);
      if ($el.length > 0 && ($el.text() ?? '').trim().length > 100) {
        $content = $el;
        break;
      }
    }

    if (!$content) return [];

    // Strategy 1: Look for individual law-section containers
    const $sections = $content.find('.law-section, [class*="lawSection"], [id*="lawSection"]');
    if ($sections.length > 0) {
      $sections.each((_i, el) => {
        const sectionText = ($(el).text() ?? '').trim();
        const match = CA_SECTION_RE.exec(sectionText);
        if (match) {
          const sectionNumber = match[1] ?? '';
          const headingMatch = CA_HEADING_RE.exec(sectionText);
          const title = headingMatch?.[2]?.split('\n')[0]?.trim() ?? '';
          const text = sectionText.replace(CA_SECTION_RE, '').trim();
          if (sectionNumber && text.length > 10) {
            provisions.push({ sectionNumber: `\u00A7 ${sectionNumber}`, title, text });
          }
        }
      });
      if (provisions.length > 0) return provisions;
    }

    // Strategy 2: Parse the full text, splitting on section number patterns
    const fullText = ($content.text() ?? '').trim();
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    let currentSection: ParsedProvision | null = null;
    for (const line of lines) {
      const match = CA_SECTION_RE.exec(line);
      if (match) {
        if (currentSection && currentSection.text.length > 10) {
          provisions.push(currentSection);
        }
        const sectionNumber = match[1] ?? '';
        const headingMatch = CA_HEADING_RE.exec(line);
        const title = headingMatch?.[2]?.split('\n')[0]?.trim() ?? '';
        const rest = line.replace(CA_SECTION_RE, '').trim();
        currentSection = {
          sectionNumber: `\u00A7 ${sectionNumber}`,
          title,
          text: rest,
        };
      } else if (currentSection) {
        currentSection.text += '\n' + line;
      }
    }
    if (currentSection && currentSection.text.length > 10) {
      provisions.push(currentSection);
    }

    return provisions;
  } catch {
    return [];
  }
}

registerParser('leginfo', parseLeginfo);
