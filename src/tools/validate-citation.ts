import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface ValidateCitationInput {
  citation: string;
  jurisdiction?: string;
}

export interface ValidateCitationResult {
  valid: boolean;
  citation: string;
  matched_document: {
    jurisdiction: string;
    title: string;
    identifier: string | null;
    short_name: string | null;
    status: string;
  } | null;
  matched_provision: {
    section_number: string | null;
    title: string | null;
  } | null;
}

export async function validateCitation(
  db: Database,
  input: ValidateCitationInput,
): Promise<ToolResponse<ValidateCitationResult>> {
  const { citation, jurisdiction } = input;
  const trimmed = citation.trim();

  // Try matching against document identifier, short_name, or provision section_number
  const jurisdictionClause = jurisdiction ? 'AND d.jurisdiction = ?' : '';
  const baseParams = jurisdiction ? [jurisdiction] : [];

  // Escape LIKE wildcards in user input
  const escaped = trimmed.replace(/[%_]/g, '\\$&');
  const likePattern = `%${escaped}%`;

  // Check document match (identifier or short_name)
  const docSql = `
    SELECT d.jurisdiction, d.title, d.identifier, d.short_name, d.status
    FROM legal_documents AS d
    WHERE (d.identifier LIKE ? ESCAPE '\\' OR d.short_name LIKE ? ESCAPE '\\' OR d.title LIKE ? ESCAPE '\\')
    ${jurisdictionClause}
    LIMIT 1
  `;
  const docRow = db.prepare(docSql).get(likePattern, likePattern, likePattern, ...baseParams) as {
    jurisdiction: string; title: string; identifier: string | null; short_name: string | null; status: string;
  } | undefined;

  if (!docRow) {
    return {
      results: { valid: false, citation: trimmed, matched_document: null, matched_provision: null },
      _metadata: generateResponseMetadata(db),
    };
  }

  // Try to match a provision section_number within the matched document
  const provSql = `
    SELECT p.section_number, p.title
    FROM legal_provisions AS p
    JOIN legal_documents AS d ON p.document_id = d.id
    WHERE (d.identifier = ? OR d.short_name = ?) AND p.section_number LIKE ?
    LIMIT 1
  `;
  const provRow = db.prepare(provSql).get(
    docRow.identifier ?? '', docRow.short_name ?? '', likePattern
  ) as { section_number: string | null; title: string | null } | undefined;

  return {
    results: {
      valid: true,
      citation: trimmed,
      matched_document: {
        jurisdiction: docRow.jurisdiction,
        title: docRow.title,
        identifier: docRow.identifier,
        short_name: docRow.short_name,
        status: docRow.status,
      },
      matched_provision: provRow ?? null,
    },
    _metadata: generateResponseMetadata(db),
  };
}
