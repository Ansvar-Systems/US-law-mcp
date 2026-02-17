import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface GetProvisionInput {
  law_identifier?: string;
  short_name?: string;
  section_number?: string;
  jurisdiction: string;
}

export interface GetProvisionResult {
  jurisdiction: string;
  document_title: string;
  identifier: string | null;
  short_name: string | null;
  section_number: string | null;
  title: string | null;
  text: string;
  order_index: number | null;
}

export interface GetProvisionResponse extends ToolResponse<GetProvisionResult[]> {
  hints?: string[];
}

interface DocumentFilter {
  clause: string;
  params: string[];
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function buildShortNameFilter(shortName: string): DocumentFilter {
  const escaped = escapeLike(shortName.trim());

  return {
    clause: `
      AND (
        d.short_name = ? COLLATE NOCASE
        OR d.short_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR LOWER(?) LIKE LOWER(d.short_name) || '%'
        OR (length(?) >= 4 AND d.short_name LIKE ? ESCAPE '\\' COLLATE NOCASE)
      )
    `,
    params: [
      shortName,
      `${escaped}%`,
      shortName,
      shortName,
      `%${escaped}%`,
    ],
  };
}

function buildDocumentFilter(input: GetProvisionInput): DocumentFilter {
  if (input.law_identifier) {
    return { clause: 'AND d.identifier = ?', params: [input.law_identifier] };
  }
  if (input.short_name) {
    return buildShortNameFilter(input.short_name);
  }
  return { clause: '', params: [] };
}

function buildNoResultHints(db: Database, input: GetProvisionInput): string[] {
  const criteria: string[] = [];
  if (input.law_identifier) criteria.push(`law_identifier "${input.law_identifier}"`);
  if (input.short_name) criteria.push(`short_name "${input.short_name}"`);
  if (input.section_number) criteria.push(`section_number "${input.section_number}"`);

  const hints: string[] = [
    `No provisions found for jurisdiction "${input.jurisdiction}" with ${criteria.join(', ')}.`,
  ];

  const rows = db.prepare(`
    SELECT short_name, identifier
    FROM legal_documents
    WHERE jurisdiction = ?
    ORDER BY short_name
    LIMIT 8
  `).all(input.jurisdiction) as Array<{ short_name: string | null; identifier: string | null }>;

  const options = rows
    .map((row) => {
      if (row.short_name && row.identifier) return `${row.short_name} (${row.identifier})`;
      return row.short_name ?? row.identifier;
    })
    .filter((value): value is string => Boolean(value));

  if (options.length > 0) {
    hints.push(`Available laws in ${input.jurisdiction}: ${options.join('; ')}`);
  }

  if (input.section_number) {
    hints.push('Try a nearby section prefix (for example "§ 1798.1") when exact section lookup returns no matches.');
  } else {
    hints.push('Add section_number (for example "§ 1798.100") for section-level retrieval.');
  }

  return hints;
}

export async function getProvision(
  db: Database,
  input: GetProvisionInput,
): Promise<GetProvisionResponse> {
  const { jurisdiction, section_number } = input;

  if (!input.law_identifier && !input.short_name) {
    return {
      results: [],
      hints: ['Provide either law_identifier or short_name.'],
      _metadata: generateResponseMetadata(db),
    };
  }

  const docFilter = buildDocumentFilter(input);
  let results: GetProvisionResult[] = [];

  if (section_number) {
    // Try exact match first
    const sql = `
      SELECT
        p.jurisdiction,
        d.title AS document_title,
        d.identifier,
        d.short_name,
        p.section_number,
        p.title,
        p.text,
        p.order_index
      FROM legal_provisions AS p
      JOIN legal_documents AS d ON p.document_id = d.id
      WHERE d.jurisdiction = ? AND p.section_number = ?
        ${docFilter.clause}
      ORDER BY p.order_index
    `;
    const queryParams: string[] = [jurisdiction, section_number, ...docFilter.params];

    results = db.prepare(sql).all(...queryParams) as GetProvisionResult[];

    // Fallback: subsection query → find parent section, or section query → find children
    if (results.length === 0) {
      const escapedSection = section_number.replace(/[%_]/g, '\\$&');
      const fallbackSql = `
        SELECT
          p.jurisdiction,
          d.title AS document_title,
          d.identifier,
          d.short_name,
          p.section_number,
          p.title,
          p.text,
          p.order_index
        FROM legal_provisions AS p
        JOIN legal_documents AS d ON p.document_id = d.id
        WHERE d.jurisdiction = ?
          AND (? LIKE p.section_number || '%' ESCAPE '\\' OR p.section_number LIKE ? || '%' ESCAPE '\\')
          ${docFilter.clause}
        ORDER BY p.order_index
      `;
      const fallbackParams: string[] = [
        jurisdiction,
        section_number,
        escapedSection,
        ...docFilter.params,
      ];

      results = db.prepare(fallbackSql).all(...fallbackParams) as GetProvisionResult[];
    }
  } else {
    const sql = `
      SELECT
        p.jurisdiction,
        d.title AS document_title,
        d.identifier,
        d.short_name,
        p.section_number,
        p.title,
        p.text,
        p.order_index
      FROM legal_provisions AS p
      JOIN legal_documents AS d ON p.document_id = d.id
      WHERE d.jurisdiction = ?
        ${docFilter.clause}
      ORDER BY p.order_index
    `;
    const queryParams: string[] = [jurisdiction, ...docFilter.params];

    results = db.prepare(sql).all(...queryParams) as GetProvisionResult[];
  }

  if (results.length === 0) {
    return {
      results,
      hints: buildNoResultHints(db, input),
      _metadata: generateResponseMetadata(db),
    };
  }

  return { results, _metadata: generateResponseMetadata(db) };
}
