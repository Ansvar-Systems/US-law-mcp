import type { Database } from '@ansvar/mcp-sqlite';
import { buildFtsQueryVariants } from '../utils/fts-query.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { validateJurisdiction, validateNonEmptyString } from '../utils/validate.js';

export interface SearchLegislationInput {
  query: string;
  jurisdiction?: string;
  limit?: number;
}

export interface SearchLegislationResult {
  jurisdiction: string;
  document_title: string;
  short_name: string | null;
  section_number: string | null;
  title: string | null;
  snippet: string;
  relevance: number;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

function clampLimit(limit: number | undefined): number {
  if (limit == null) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(limit, MAX_LIMIT));
}

function runFtsSearch(
  db: Database,
  ftsQuery: string,
  jurisdiction: string | undefined,
  limit: number,
): SearchLegislationResult[] {
  const conditions: string[] = ['provisions_fts MATCH ?'];
  const params: (string | number)[] = [ftsQuery];

  if (jurisdiction) {
    conditions.push('p.jurisdiction = ?');
    params.push(jurisdiction);
  }

  const sql = `
    SELECT
      p.jurisdiction,
      d.title AS document_title,
      d.short_name,
      p.section_number,
      p.title,
      snippet(provisions_fts, 2, '**', '**', '...', 32) AS snippet,
      bm25(provisions_fts) AS relevance
    FROM provisions_fts
    JOIN legal_provisions AS p ON provisions_fts.rowid = p.id
    JOIN legal_documents AS d ON p.document_id = d.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY bm25(provisions_fts)
    LIMIT ?
  `;
  params.push(limit);

  return db.prepare(sql).all(...params) as SearchLegislationResult[];
}

export async function searchLegislation(
  db: Database,
  input: SearchLegislationInput,
): Promise<ToolResponse<SearchLegislationResult[]>> {
  const query = validateNonEmptyString(input.query, 'query');
  const { jurisdiction } = input;
  validateJurisdiction(jurisdiction, false);
  const limit = clampLimit(input.limit);

  const variants = buildFtsQueryVariants(query);
  if (!variants.primary) {
    return { results: [], _metadata: generateResponseMetadata(db) };
  }

  let results = runFtsSearch(db, variants.primary, jurisdiction, limit);

  if (results.length === 0 && variants.fallback) {
    results = runFtsSearch(db, variants.fallback, jurisdiction, limit);
  }

  return { results, _metadata: generateResponseMetadata(db) };
}
