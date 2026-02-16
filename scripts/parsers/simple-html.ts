/**
 * parsers/simple-html.ts — Fallback HTML-to-text parser
 *
 * The simplest possible parser. Strips all HTML tags, finds section number
 * patterns in the resulting text, and splits on section boundaries.
 *
 * Used as a last resort when leginfo and legislature parsers fail to
 * extract meaningful provisions from a page.
 */
import * as cheerio from 'cheerio';
import { registerParser, type ParsedProvision } from './index.js';

/** Broad section number pattern for plain-text scanning */
const SECTION_RE = /(?:§§?\s*(\d+[\w.-]*)|Sec(?:tion|\.)\s+(\d+[\w.-]*)|Art(?:icle|\.)\s+(\d+[\w.-]*))/gi;

/**
 * Strip HTML to plain text, preserving paragraph breaks.
 */
function htmlToText(html: string): string {
  try {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, noscript, nav, header, footer, iframe').remove();

    // Replace block elements with newlines for paragraph separation
    $('p, br, div, li, tr, h1, h2, h3, h4, h5, h6, blockquote').each((_i, el) => {
      $(el).prepend('\n');
      $(el).append('\n');
    });

    return ($.text() ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')       // collapse horizontal whitespace
      .replace(/\n{3,}/g, '\n\n')    // collapse excessive newlines
      .trim();
  } catch {
    // If cheerio fails, do a crude tag strip
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

function parseSimpleHtml(html: string, _url: string): ParsedProvision[] {
  try {
    const text = htmlToText(html);
    if (text.length < 50) return [];

    const provisions: ParsedProvision[] = [];

    // Find all section number positions in the text
    const sectionPositions: Array<{ index: number; number: string }> = [];
    let match: RegExpExecArray | null;

    // Reset lastIndex for global regex
    SECTION_RE.lastIndex = 0;
    while ((match = SECTION_RE.exec(text)) !== null) {
      const sectionNum = match[1] ?? match[2] ?? match[3] ?? '';
      if (sectionNum) {
        sectionPositions.push({ index: match.index, number: sectionNum });
      }
    }

    if (sectionPositions.length === 0) {
      // No section numbers found — return the entire text as a single provision
      // with a generic section number. This ensures we always extract something.
      return [{
        sectionNumber: 'unknown',
        title: '',
        text: text.slice(0, 10000), // cap at 10k chars
      }];
    }

    // Split the text into provisions based on section positions
    for (let i = 0; i < sectionPositions.length; i++) {
      const pos = sectionPositions[i]!;
      const nextPos = sectionPositions[i + 1];
      const endIndex = nextPos ? nextPos.index : Math.min(pos.index + 10000, text.length);
      const sectionText = text.slice(pos.index, endIndex).trim();

      // Remove the section header from the text body
      SECTION_RE.lastIndex = 0;
      const textBody = sectionText
        .replace(SECTION_RE, '')
        .replace(/^[\s.:-]+/, '')
        .trim();

      if (textBody.length > 10) {
        const firstLine = textBody.split('\n')[0]?.trim() ?? '';
        const title = firstLine.length < 200 ? firstLine : '';

        provisions.push({
          sectionNumber: `\u00A7 ${pos.number}`,
          title,
          text: textBody,
        });
      }

      // Reset regex after manual use
      SECTION_RE.lastIndex = 0;
    }

    return provisions;
  } catch {
    return [];
  }
}

registerParser('simple-html', parseSimpleHtml);
