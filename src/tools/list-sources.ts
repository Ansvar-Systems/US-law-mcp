import type { Database } from '@ansvar/mcp-sqlite';
import { JURISDICTIONS } from '../types/index.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface ListSourcesResult {
  jurisdiction: string;
  jurisdiction_name: string;
  document_count: number;
  provision_count: number;
}

export async function listSources(
  db: Database,
): Promise<ToolResponse<ListSourcesResult[]>> {
  const sql = `
    SELECT
      d.jurisdiction,
      COUNT(DISTINCT d.id) AS document_count,
      COUNT(p.id) AS provision_count
    FROM legal_documents AS d
    LEFT JOIN legal_provisions AS p ON p.document_id = d.id
    GROUP BY d.jurisdiction
    ORDER BY d.jurisdiction
  `;

  const rows = db.prepare(sql).all() as { jurisdiction: string; document_count: number; provision_count: number }[];

  const results: ListSourcesResult[] = rows.map(row => ({
    jurisdiction: row.jurisdiction,
    jurisdiction_name: JURISDICTIONS[row.jurisdiction] ?? row.jurisdiction,
    document_count: row.document_count,
    provision_count: row.provision_count,
  }));

  return { results, _metadata: generateResponseMetadata(db) };
}
