import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { validateJurisdiction, validateNonEmptyString } from '../utils/validate.js';

export interface ValidateCitationInput {
  citation: string;
  jurisdiction?: string;
}

export interface ValidateCitationResult {
  valid: boolean;
  citation: string;
  match_quality: 'section_exact' | 'section_fuzzy' | 'document_only' | 'none';
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
  validateNonEmptyString(citation, 'citation');
  validateJurisdiction(jurisdiction, false);
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
      results: { valid: false, citation: trimmed, match_quality: 'none', matched_document: null, matched_provision: null },
      _metadata: generateResponseMetadata(db),
    };
  }

  // Try to match a provision section_number within the matched document
  // Strategy 1: direct LIKE match on citation
  let provRow: { section_number: string | null; title: string | null } | undefined;
  let matchQuality: 'section_exact' | 'section_fuzzy' | 'document_only' = 'document_only';
  const provBaseSql = `
    SELECT p.section_number, p.title
    FROM legal_provisions AS p
    JOIN legal_documents AS d ON p.document_id = d.id
    WHERE (d.identifier = ? OR d.short_name = ?)
  `;
  const docId = docRow.identifier ?? '';
  const docShort = docRow.short_name ?? '';

  provRow = db.prepare(provBaseSql + ` AND p.section_number LIKE ? ESCAPE '\\' LIMIT 1`).get(
    docId, docShort, likePattern,
  ) as typeof provRow;
  if (provRow) matchQuality = 'section_exact';

  // Strategy 2: extract section number from citation (e.g. "18 USC 1030" → "%1030%")
  if (!provRow) {
    const sectionMatch = trimmed.match(/§?\s*(\d[\w.-]*(?:\([a-zA-Z0-9]+\))*)/);
    if (sectionMatch?.[1]) {
      const sectionRef = sectionMatch[1].replace(/[%_]/g, '\\$&');
      provRow = db.prepare(provBaseSql + ` AND p.section_number LIKE ? ESCAPE '\\' LIMIT 1`).get(
        docId, docShort, `%${sectionRef}%`,
      ) as typeof provRow;
      if (provRow) matchQuality = 'section_fuzzy';
    }
  }

  // Strategy 3: return first provision of the matched document as fallback
  // match_quality remains 'document_only' — the provision is representative, not an exact match
  if (!provRow) {
    provRow = db.prepare(provBaseSql + ` ORDER BY p.order_index LIMIT 1`).get(
      docId, docShort,
    ) as typeof provRow;
  }

  return {
    results: {
      valid: true,
      citation: trimmed,
      match_quality: matchQuality,
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
