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
  fetchLimit: number,
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
  params.push(fetchLimit);

  return db.prepare(sql).all(...params) as SearchLegislationResult[];
}

/**
 * Deduplicate search results by document_title + section_number.
 * Duplicate document IDs (numeric vs slug) cause the same provision to appear twice.
 * Keeps the first (highest-ranked) occurrence.
 */
function deduplicateResults(
  rows: SearchLegislationResult[],
  limit: number,
): SearchLegislationResult[] {
  const seen = new Set<string>();
  const deduped: SearchLegislationResult[] = [];
  for (const row of rows) {
    const key = `${row.document_title}::${row.section_number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
    if (deduped.length >= limit) break;
  }
  return deduped;
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

  // Fetch extra rows to account for deduplication
  const fetchLimit = limit * 2;
  let results = runFtsSearch(db, variants.primary, jurisdiction, fetchLimit);
  let queryStrategy: string | undefined;

  if (results.length > 0) {
    results = deduplicateResults(results, limit);
  } else if (variants.fallback) {
    results = deduplicateResults(
      runFtsSearch(db, variants.fallback, jurisdiction, fetchLimit),
      limit,
    );
    if (results.length > 0) {
      queryStrategy = 'broadened';
    }
  }

  return {
    results,
    _metadata: {
      ...generateResponseMetadata(db),
      ...(queryStrategy ? { query_strategy: queryStrategy } : {}),
    },
  };
}
