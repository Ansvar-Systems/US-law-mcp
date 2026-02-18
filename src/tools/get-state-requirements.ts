import type { Database } from '@ansvar/mcp-sqlite';
import { JURISDICTIONS } from '../types/index.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { validateJurisdiction } from '../utils/validate.js';

export interface GetStateRequirementsInput {
  jurisdiction: string;
  category?: string;
}

export interface GetStateRequirementsResult {
  jurisdiction: string;
  jurisdiction_name: string;
  category: string;
  subcategory: string;
  summary: string;
  notification_days: number | null;
  notification_target: string | null;
  applies_to: string | null;
  threshold: string | null;
  penalty_max: string | null;
  private_right_of_action: boolean;
  law_title: string | null;
  law_short_name: string | null;
  section_number: string | null;
  effective_date: string | null;
  notes: string | null;
}

export async function getStateRequirements(
  db: Database,
  input: GetStateRequirementsInput,
): Promise<ToolResponse<GetStateRequirementsResult[]>> {
  validateJurisdiction(input.jurisdiction, true);

  const conditions: string[] = ['sr.jurisdiction = ?'];
  const params: string[] = [input.jurisdiction];

  if (input.category) {
    conditions.push('rc.category = ?');
    params.push(input.category);
  }

  const sql = `
    SELECT
      sr.jurisdiction,
      rc.category,
      rc.subcategory,
      sr.summary_text AS summary,
      sr.notification_days,
      sr.notification_target,
      sr.applies_to,
      sr.threshold,
      sr.penalty_max,
      sr.private_right_of_action,
      d.title AS law_title,
      d.short_name AS law_short_name,
      p.section_number,
      sr.effective_date,
      sr.notes
    FROM state_requirements AS sr
    JOIN requirement_categories AS rc ON sr.category_id = rc.id
    LEFT JOIN legal_documents AS d ON sr.document_id = d.id
    LEFT JOIN legal_provisions AS p ON sr.provision_id = p.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY rc.category, rc.subcategory
    LIMIT 100
  `;

  const rows = db.prepare(sql).all(...params) as Array<{
    jurisdiction: string;
    category: string;
    subcategory: string;
    summary: string;
    notification_days: number | null;
    notification_target: string | null;
    applies_to: string | null;
    threshold: string | null;
    penalty_max: string | null;
    private_right_of_action: number | null;
    law_title: string | null;
    law_short_name: string | null;
    section_number: string | null;
    effective_date: string | null;
    notes: string | null;
  }>;

  const results: GetStateRequirementsResult[] = rows.map(row => ({
    jurisdiction: row.jurisdiction,
    jurisdiction_name: JURISDICTIONS[row.jurisdiction] ?? row.jurisdiction,
    category: row.category,
    subcategory: row.subcategory,
    summary: row.summary,
    notification_days: row.notification_days,
    notification_target: row.notification_target,
    applies_to: row.applies_to,
    threshold: row.threshold,
    penalty_max: row.penalty_max,
    private_right_of_action: Boolean(row.private_right_of_action),
    law_title: row.law_title,
    law_short_name: row.law_short_name,
    section_number: row.section_number,
    effective_date: row.effective_date,
    notes: row.notes,
  }));

  return { results, _metadata: generateResponseMetadata(db) };
}
