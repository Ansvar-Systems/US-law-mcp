import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseUslmTitle } from '../../scripts/parsers/uslm-bulk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.resolve(__dirname, '..', '..', 'fixtures', 'uslm-sample-title.xml');

describe('parseUslmTitle', () => {
  const xml = fs.readFileSync(FIXTURE_PATH, 'utf-8');

  it('extracts all sections from the title XML', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    expect(result.provisions.length).toBe(3);
  });

  it('extracts section numbers with § prefix', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    const sectionNums = result.provisions.map(p => p.section_number);
    expect(sectionNums).toContain('§ 101');
    expect(sectionNums).toContain('§ 102');
    expect(sectionNums).toContain('§ 201');
  });

  it('extracts section headings', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    const s101 = result.provisions.find(p => p.section_number === '§ 101');
    expect(s101?.title).toBe('Definitions');
  });

  it('concatenates subsection text into section body', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    const s101 = result.provisions.find(p => p.section_number === '§ 101');
    expect(s101?.text).toContain('protected system');
    expect(s101?.text).toContain('operator');
    expect(s101?.text).toContain('(a)');
    expect(s101?.text).toContain('(b)');
  });

  it('extracts content from sections without subsections', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    const s102 = result.provisions.find(p => p.section_number === '§ 102');
    expect(s102?.text).toContain('unlawful');
    expect(s102?.text).toContain('without authorization');
  });

  it('creates a single document for the title', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    expect(result.documents.length).toBe(1);
    expect(result.documents[0].identifier).toBe('99 USC');
    expect(result.documents[0].jurisdiction).toBe('US-FED');
    expect(result.documents[0].short_name).toBe('USC Title 99');
  });

  it('assigns sequential order_index values', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    const indices = result.provisions.map(p => p.order_index);
    expect(indices).toEqual([1, 2, 3]);
  });

  it('sets all provisions to document_index 0', () => {
    const result = parseUslmTitle(xml, 99, 'Sample Title for Testing');
    expect(result.provisions.every(p => p.document_index === 0)).toBe(true);
  });
});
