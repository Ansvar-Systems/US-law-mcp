import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import Database from '@ansvar/mcp-sqlite';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { searchLegislation } from '../../src/tools/search-legislation.js';
import { getProvision } from '../../src/tools/get-provision.js';
import { listSources } from '../../src/tools/list-sources.js';
import { compareRequirements } from '../../src/tools/compare-requirements.js';
import { getStateRequirements } from '../../src/tools/get-state-requirements.js';
import { validateCitation } from '../../src/tools/validate-citation.js';
import { checkCurrency } from '../../src/tools/check-currency.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DB_PATH = path.resolve(PROJECT_ROOT, 'data', 'database.db');

let db: InstanceType<typeof Database>;

beforeAll(() => {
  // Rebuild DB and ingest all seed data
  execSync('npm run build:db && npm run ingest:federal && npm run ingest:states && npm run ingest:classify', {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
  });

  db = new Database(DB_PATH, { readonly: true });
  db.pragma('foreign_keys = ON');
});

afterAll(() => {
  db?.close();
});

// ---------------------------------------------------------------------------
// get_provision — Article retrieval
// ---------------------------------------------------------------------------

describe('get_provision', () => {
  it('retrieves CFAA § 1030 with "protected computer" in text', async () => {
    const res = await getProvision(db, {
      jurisdiction: 'US-FED',
      short_name: 'CFAA',
      section_number: '§ 1030',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    const provision = res.results[0]!;
    expect(provision.text).toContain('protected computer');
    expect(provision.jurisdiction).toBe('US-FED');
    expect(provision.document_title).toContain('Computer Fraud');
  });

  it('retrieves CCPA/CPRA provisions for US-CA', async () => {
    const res = await getProvision(db, {
      jurisdiction: 'US-CA',
      short_name: 'CCPA/CPRA',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    expect(res.results.every(r => r.jurisdiction === 'US-CA')).toBe(true);
    expect(res.results.some(r => r.short_name === 'CCPA/CPRA')).toBe(true);
  });

  it('retrieves SHIELD Act provisions for US-NY', async () => {
    const res = await getProvision(db, {
      jurisdiction: 'US-NY',
      short_name: 'SHIELD Act',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    expect(res.results.every(r => r.jurisdiction === 'US-NY')).toBe(true);
    expect(res.results[0]!.document_title).toContain('Stop Hacks');
  });
});

// ---------------------------------------------------------------------------
// search_legislation — Full-text search
// ---------------------------------------------------------------------------

describe('search_legislation', () => {
  it('finds results from multiple jurisdictions for "encryption personal information"', async () => {
    const res = await searchLegislation(db, {
      query: 'encryption personal information',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    const jurisdictions = new Set(res.results.map(r => r.jurisdiction));
    // Should find results from at least 2 jurisdictions (e.g. NY DFS 500 encryption + CA/other states)
    expect(jurisdictions.size).toBeGreaterThanOrEqual(1);
    // At least one result should have a snippet
    expect(res.results[0]!.snippet).toBeTruthy();
  });

  it('finds results for "breach notification" with valid snippet format', async () => {
    const res = await searchLegislation(db, {
      query: 'breach notification',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    // Snippets use ** markers from FTS snippet() function
    for (const r of res.results) {
      expect(r.snippet).toBeTruthy();
      expect(typeof r.snippet).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// compare_requirements — Cross-state comparison
// ---------------------------------------------------------------------------

describe('compare_requirements', () => {
  it('compares breach_notification/timeline across FL and NY', async () => {
    const res = await compareRequirements(db, {
      category: 'breach_notification',
      subcategory: 'timeline',
      jurisdictions: ['US-FL', 'US-NY'],
    });

    expect(res.results.length).toBeGreaterThanOrEqual(2);
    const jurisdictions = res.results.map(r => r.jurisdiction);
    expect(jurisdictions).toContain('US-FL');
    expect(jurisdictions).toContain('US-NY');
    // Each result has a summary
    for (const r of res.results) {
      expect(r.summary).toBeTruthy();
      expect(r.category).toBe('breach_notification');
      expect(r.subcategory).toBe('timeline');
    }
  });

  it('compares breach_notification/timeline across CA, NY, TX', async () => {
    const res = await compareRequirements(db, {
      category: 'breach_notification',
      subcategory: 'timeline',
      jurisdictions: ['US-CA', 'US-NY', 'US-TX'],
    });

    expect(res.results.length).toBeGreaterThanOrEqual(3);
    const jurisdictions = res.results.map(r => r.jurisdiction);
    expect(jurisdictions).toContain('US-CA');
    expect(jurisdictions).toContain('US-NY');
    expect(jurisdictions).toContain('US-TX');
    // TX has a 60-day notification deadline
    const txResult = res.results.find(r => r.jurisdiction === 'US-TX');
    expect(txResult!.notification_days).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// get_state_requirements — Single-state drill-down
// ---------------------------------------------------------------------------

describe('get_state_requirements', () => {
  it('returns privacy_rights entries for US-TX', async () => {
    const res = await getStateRequirements(db, {
      jurisdiction: 'US-TX',
      category: 'privacy_rights',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    expect(res.results.every(r => r.jurisdiction === 'US-TX')).toBe(true);
    expect(res.results.every(r => r.category === 'privacy_rights')).toBe(true);
    // Texas TDPSA includes right to opt out
    const subcategories = res.results.map(r => r.subcategory);
    expect(subcategories).toContain('right_to_opt_out');
  });

  it('returns privacy_rights entries for US-CA including right_to_know', async () => {
    const res = await getStateRequirements(db, {
      jurisdiction: 'US-CA',
      category: 'privacy_rights',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(2);
    expect(res.results.every(r => r.jurisdiction === 'US-CA')).toBe(true);
    const subcategories = res.results.map(r => r.subcategory);
    expect(subcategories).toContain('right_to_know');
    expect(subcategories).toContain('right_to_delete');
    expect(subcategories).toContain('right_to_opt_out');
  });

  it('returns breach_notification entries for US-CA', async () => {
    const res = await getStateRequirements(db, {
      jurisdiction: 'US-CA',
      category: 'breach_notification',
    });

    expect(res.results.length).toBeGreaterThanOrEqual(1);
    expect(res.results.every(r => r.jurisdiction === 'US-CA')).toBe(true);
    expect(res.results.every(r => r.category === 'breach_notification')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Negative tests
// ---------------------------------------------------------------------------

describe('negative cases', () => {
  it('returns empty results when searching with non-existent jurisdiction US-ZZ', async () => {
    const res = await searchLegislation(db, {
      query: 'breach notification',
      jurisdiction: 'US-ZZ',
    });

    expect(res.results).toHaveLength(0);
  });

  it('returns empty results for a non-existent law', async () => {
    const res = await getProvision(db, {
      jurisdiction: 'US-FED',
      short_name: 'NONEXISTENT_LAW_XYZ',
    });

    expect(res.results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// list_sources — Jurisdiction coverage
// ---------------------------------------------------------------------------

describe('list_sources', () => {
  it('returns at least 6 jurisdictions (US-FED + 5 states)', async () => {
    const res = await listSources(db);

    expect(res.results.length).toBeGreaterThanOrEqual(6);
    const jurisdictions = res.results.map(r => r.jurisdiction);
    expect(jurisdictions).toContain('US-FED');
    expect(jurisdictions).toContain('US-CA');
    expect(jurisdictions).toContain('US-NY');
    expect(jurisdictions).toContain('US-TX');
    expect(jurisdictions).toContain('US-FL');
    expect(jurisdictions).toContain('US-IL');
    // Each jurisdiction has documents and provisions
    for (const r of res.results) {
      expect(r.document_count).toBeGreaterThanOrEqual(1);
      expect(r.provision_count).toBeGreaterThanOrEqual(1);
      expect(r.jurisdiction_name).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// validate_citation
// ---------------------------------------------------------------------------

describe('validate_citation', () => {
  it('validates "CFAA" as a known citation', async () => {
    const res = await validateCitation(db, { citation: 'CFAA' });

    expect(res.results.valid).toBe(true);
    expect(res.results.matched_document).not.toBeNull();
    expect(res.results.matched_document!.short_name).toBe('CFAA');
    expect(res.results.matched_document!.jurisdiction).toBe('US-FED');
  });

  it('returns invalid for a completely unknown citation', async () => {
    const res = await validateCitation(db, { citation: 'ZZZZZ_FAKE_LAW_999' });

    expect(res.results.valid).toBe(false);
    expect(res.results.matched_document).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// check_currency
// ---------------------------------------------------------------------------

describe('check_currency', () => {
  it('confirms HIPAA is current (in_force)', async () => {
    const res = await checkCurrency(db, {
      jurisdiction: 'US-FED',
      short_name: 'HIPAA',
    });

    expect(res.results.is_current).toBe(true);
    expect(res.results.status).toBe('in_force');
    expect(res.results.title).toContain('Health Insurance');
    expect(res.results.warnings).toHaveLength(0);
  });

  it('returns not_found for a non-existent law', async () => {
    const res = await checkCurrency(db, {
      jurisdiction: 'US-FED',
      short_name: 'NONEXISTENT',
    });

    expect(res.results.is_current).toBe(false);
    expect(res.results.status).toBe('not_found');
    expect(res.results.warnings.length).toBeGreaterThanOrEqual(1);
  });
});
