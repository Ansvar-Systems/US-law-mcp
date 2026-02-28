/**
 * USLM bulk XML parser — extracts all sections from a full USC title XML file.
 *
 * Input: raw XML string from a uscode.house.gov title download
 * Output: seed JSON format ({ documents, provisions }) compatible with ingest/federal.ts
 */
import * as cheerio from 'cheerio';

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

export interface SeedFile {
  documents: SeedDocument[];
  provisions: SeedProvision[];
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractSectionText($: cheerio.CheerioAPI, sectionEl: cheerio.Cheerio<cheerio.Element>): string {
  const clone = sectionEl.clone();
  clone.find('sourceCredit, note, notes, editorialNote, toc, analyzedTitle').remove();
  clone.children('num').first().remove();
  clone.children('heading').first().remove();
  return normalizeText(clone.text());
}

function extractSectionNumber($: cheerio.CheerioAPI, sectionEl: cheerio.Cheerio<cheerio.Element>): string {
  const numEl = sectionEl.children('num').first();
  const value = numEl.attr('value') ?? '';
  const text = numEl.text().trim();

  if (value) return `§ ${value}`;

  const match = text.match(/(?:§|Sec\.?)\s*(\S+)/);
  if (match) return `§ ${match[1].replace(/\.$/, '')}`;

  return text.replace(/\.$/, '');
}

export function parseUslmTitle(xml: string, titleNum: number, titleName: string): SeedFile {
  const $ = cheerio.load(xml, { xmlMode: true });

  const document: SeedDocument = {
    jurisdiction: 'US-FED',
    title: titleName,
    identifier: `${titleNum} USC`,
    short_name: `USC Title ${titleNum}`,
    document_type: 'statute',
    status: 'in_force',
    effective_date: '',
    last_amended: '',
    source_url: `https://uscode.house.gov/view.xhtml?path=/prelim@title${titleNum}`,
  };

  const provisions: SeedProvision[] = [];
  let orderIndex = 0;

  $('section').each((_i, el) => {
    const sectionEl = $(el);

    const status = sectionEl.attr('status') ?? '';
    if (status === 'repealed' || status === 'omitted') return;

    const sectionNumber = extractSectionNumber($, sectionEl);
    if (!sectionNumber) return;

    const heading = sectionEl.children('heading').first().text().trim();
    const text = extractSectionText($, sectionEl);

    if (text.length < 20) return;

    const MAX_TEXT = 50_000;
    const truncatedText = text.length > MAX_TEXT
      ? text.slice(0, MAX_TEXT) + '\n\n[Text truncated at 50,000 characters]'
      : text;

    orderIndex++;
    provisions.push({
      document_index: 0,
      jurisdiction: 'US-FED',
      section_number: sectionNumber,
      title: heading || `Section ${sectionNumber.replace('§ ', '')}`,
      text: truncatedText,
      order_index: orderIndex,
    });
  });

  return { documents: [document], provisions };
}
