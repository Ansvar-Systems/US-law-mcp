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

export async function getProvision(
  db: Database,
  input: GetProvisionInput,
): Promise<ToolResponse<GetProvisionResult[]>> {
  const { jurisdiction, section_number } = input;

  if (!input.law_identifier && !input.short_name) {
    return { results: [], _metadata: generateResponseMetadata(db) };
  }

  // Build query
  let sql: string;
  if (section_number) {
    sql = `
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
        ${input.law_identifier ? 'AND d.identifier = ?' : ''}
        ${input.short_name && !input.law_identifier ? 'AND d.short_name = ?' : ''}
      ORDER BY p.order_index
    `;
    const queryParams: string[] = [jurisdiction, section_number];
    if (input.law_identifier) queryParams.push(input.law_identifier);
    else if (input.short_name) queryParams.push(input.short_name);

    const results = db.prepare(sql).all(...queryParams) as GetProvisionResult[];
    return { results, _metadata: generateResponseMetadata(db) };
  } else {
    sql = `
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
        ${input.law_identifier ? 'AND d.identifier = ?' : ''}
        ${input.short_name && !input.law_identifier ? 'AND d.short_name = ?' : ''}
      ORDER BY p.order_index
    `;
    const queryParams: string[] = [jurisdiction];
    if (input.law_identifier) queryParams.push(input.law_identifier);
    else if (input.short_name) queryParams.push(input.short_name);

    const results = db.prepare(sql).all(...queryParams) as GetProvisionResult[];
    return { results, _metadata: generateResponseMetadata(db) };
  }
}
