import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { validateJurisdiction, ValidationError } from '../utils/validate.js';

export interface CheckCurrencyInput {
  law_identifier?: string;
  short_name?: string;
  jurisdiction: string;
}

export interface CheckCurrencyResult {
  jurisdiction: string;
  title: string;
  identifier: string | null;
  short_name: string | null;
  status: string;
  is_current: boolean;
  effective_date: string | null;
  last_amended: string | null;
  warnings: string[];
}

export async function checkCurrency(
  db: Database,
  input: CheckCurrencyInput,
): Promise<ToolResponse<CheckCurrencyResult>> {
  const { jurisdiction } = input;
  validateJurisdiction(jurisdiction, true);

  let docSql: string;
  let docParams: string[];

  if (input.law_identifier) {
    docSql = 'SELECT jurisdiction, title, identifier, short_name, status, effective_date, last_amended FROM legal_documents WHERE jurisdiction = ? AND identifier = ?';
    docParams = [jurisdiction, input.law_identifier];
  } else if (input.short_name) {
    docSql = 'SELECT jurisdiction, title, identifier, short_name, status, effective_date, last_amended FROM legal_documents WHERE jurisdiction = ? AND short_name = ?';
    docParams = [jurisdiction, input.short_name];
  } else {
    throw new ValidationError(
      'Provide either law_identifier (e.g. "18 USC 1030") or short_name (e.g. "CFAA", "HIPAA"). ' +
      'Use list_sources to discover available laws.',
    );
  }

  const row = db.prepare(docSql).get(...docParams) as {
    jurisdiction: string; title: string; identifier: string | null;
    short_name: string | null; status: string; effective_date: string | null;
    last_amended: string | null;
  } | undefined;

  if (!row) {
    return {
      results: {
        jurisdiction, title: '', identifier: input.law_identifier ?? null,
        short_name: input.short_name ?? null, status: 'not_found',
        is_current: false, effective_date: null, last_amended: null,
        warnings: ['Document not found in database'],
      },
      _metadata: generateResponseMetadata(db),
    };
  }

  const isCurrent = row.status === 'in_force' || row.status === 'amended';
  const warnings: string[] = [];

  if (row.status === 'repealed') warnings.push(`"${row.title}" has been repealed`);
  if (row.status === 'superseded') warnings.push(`"${row.title}" has been superseded`);

  return {
    results: {
      jurisdiction: row.jurisdiction,
      title: row.title,
      identifier: row.identifier,
      short_name: row.short_name,
      status: row.status,
      is_current: isCurrent,
      effective_date: row.effective_date,
      last_amended: row.last_amended,
      warnings,
    },
    _metadata: generateResponseMetadata(db),
  };
}
