import type { Database } from '@ansvar/mcp-sqlite';
import { buildFtsQueryVariants } from '../utils/fts-query.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { validateJurisdiction, validateNonEmptyString } from '../utils/validate.js';

export interface BuildLegalStanceInput {
  query: string;
  jurisdictions?: string[];
  limit?: number;
}

interface StatuteMatch {
  jurisdiction: string;
  document_title: string;
  short_name: string | null;
  section_number: string | null;
  title: string | null;
  snippet: string;
  relevance: number;
}

interface RequirementMatch {
  jurisdiction: string;
  category: string;
  subcategory: string;
  summary: string;
  law_short_name: string | null;
  notification_days: number | null;
  penalty_max: string | null;
  private_right_of_action: boolean;
}

export interface BuildLegalStanceResult {
  query: string;
  statute_matches: StatuteMatch[];
  requirement_matches: RequirementMatch[];
  jurisdictions_covered: string[];
  total_results: number;
}

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;

function clampLimit(limit: number | undefined): number {
  if (limit == null) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(limit, MAX_LIMIT));
}

export async function buildLegalStance(
  db: Database,
  input: BuildLegalStanceInput,
): Promise<ToolResponse<BuildLegalStanceResult>> {
  const query = validateNonEmptyString(input.query, 'query');
  const limit = clampLimit(input.limit);
  const jurisdictions = input.jurisdictions;

  if (jurisdictions) {
    for (const j of jurisdictions) {
      validateJurisdiction(j, true);
    }
  }

  const variants = buildFtsQueryVariants(query);
  if (!variants.primary) {
    return {
      results: {
        query,
        statute_matches: [],
        requirement_matches: [],
        jurisdictions_covered: [],
        total_results: 0,
      },
      _metadata: generateResponseMetadata(db),
    };
  }

  // 1. Search statutes via FTS
  const ftsConditions: string[] = ['provisions_fts MATCH ?'];
  const ftsParams: (string | number)[] = [variants.primary];

  if (jurisdictions && jurisdictions.length > 0 && jurisdictions[0] !== 'all') {
    const placeholders = jurisdictions.map(() => '?').join(', ');
    ftsConditions.push(`p.jurisdiction IN (${placeholders})`);
    ftsParams.push(...jurisdictions);
  }

  const ftsSql = `
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
    WHERE ${ftsConditions.join(' AND ')}
    ORDER BY bm25(provisions_fts)
    LIMIT ?
  `;
  ftsParams.push(limit);

  let statuteMatches = db.prepare(ftsSql).all(...ftsParams) as StatuteMatch[];

  // Fallback to OR query
  if (statuteMatches.length === 0 && variants.fallback) {
    ftsParams[0] = variants.fallback;
    statuteMatches = db.prepare(ftsSql).all(...ftsParams) as StatuteMatch[];
  }

  // 2. Search requirements via LIKE on summary_text
  const reqConditions: string[] = [];
  const reqParams: (string | number)[] = [];

  // Use the raw tokens for a simple LIKE search
  const tokens = query.normalize('NFC').match(/[\p{L}\p{N}_]+/gu) ?? [];
  if (tokens.length > 0) {
    const likeConditions = tokens.map(() => 'sr.summary_text LIKE ?');
    reqConditions.push(`(${likeConditions.join(' OR ')})`);
    for (const token of tokens) {
      reqParams.push(`%${token.replace(/[%_]/g, '\\$&')}%`);
    }
  }

  if (jurisdictions && jurisdictions.length > 0 && jurisdictions[0] !== 'all') {
    const placeholders = jurisdictions.map(() => '?').join(', ');
    reqConditions.push(`sr.jurisdiction IN (${placeholders})`);
    reqParams.push(...jurisdictions);
  }

  let requirementMatches: RequirementMatch[] = [];
  if (reqConditions.length > 0) {
    const reqSql = `
      SELECT
        sr.jurisdiction,
        rc.category,
        rc.subcategory,
        sr.summary_text AS summary,
        d.short_name AS law_short_name,
        sr.notification_days,
        sr.penalty_max,
        sr.private_right_of_action
      FROM state_requirements AS sr
      JOIN requirement_categories AS rc ON sr.category_id = rc.id
      LEFT JOIN legal_documents AS d ON sr.document_id = d.id
      WHERE ${reqConditions.join(' AND ')}
      ORDER BY sr.jurisdiction
      LIMIT ?
    `;
    reqParams.push(limit * 2);

    const rows = db.prepare(reqSql).all(...reqParams) as Array<{
      jurisdiction: string;
      category: string;
      subcategory: string;
      summary: string;
      law_short_name: string | null;
      notification_days: number | null;
      penalty_max: string | null;
      private_right_of_action: number | null;
    }>;

    requirementMatches = rows.map(row => ({
      jurisdiction: row.jurisdiction,
      category: row.category,
      subcategory: row.subcategory,
      summary: row.summary,
      law_short_name: row.law_short_name,
      notification_days: row.notification_days,
      penalty_max: row.penalty_max,
      private_right_of_action: Boolean(row.private_right_of_action),
    }));
  }

  // Collect all jurisdictions
  const allJurisdictions = new Set<string>();
  for (const m of statuteMatches) allJurisdictions.add(m.jurisdiction);
  for (const m of requirementMatches) allJurisdictions.add(m.jurisdiction);

  return {
    results: {
      query,
      statute_matches: statuteMatches,
      requirement_matches: requirementMatches,
      jurisdictions_covered: [...allJurisdictions].sort(),
      total_results: statuteMatches.length + requirementMatches.length,
    },
    _metadata: generateResponseMetadata(db),
  };
}
