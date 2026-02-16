#!/usr/bin/env tsx
import Database from '@ansvar/mcp-sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'database.db');
const SEED_FILE = path.resolve(__dirname, '..', '..', 'data', 'seed', 'classifications.json');

interface RequirementSeed {
  jurisdiction: string;
  category: string;
  subcategory: string;
  law_short_name: string;
  section_number: string;
  summary_text: string;
  notification_days: number | null;
  notification_target: string | null;
  applies_to: string;
  penalty_max: string;
  private_right_of_action: number;
}

interface ClassificationData {
  requirements: RequirementSeed[];
}

function main(): void {
  console.log('=== US Law MCP — Classification Ingestion ===');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}. Run 'npm run build:db' first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(SEED_FILE, 'utf-8');
  const seed = JSON.parse(raw) as ClassificationData;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  const findCategory = db.prepare(
    'SELECT id FROM requirement_categories WHERE category = ? AND subcategory = ?'
  );

  const findDocument = db.prepare(
    'SELECT id FROM legal_documents WHERE short_name = ?'
  );

  const findDocumentFuzzy = db.prepare(
    'SELECT id FROM legal_documents WHERE short_name LIKE ? || \'%\' OR ? LIKE short_name || \'%\' LIMIT 1'
  );

  const findProvision = db.prepare(
    'SELECT id FROM legal_provisions WHERE document_id = ? AND section_number = ?'
  );

  const insertReq = db.prepare(`
    INSERT INTO state_requirements (jurisdiction, category_id, document_id, provision_id, summary_text, notification_days, notification_target, applies_to, penalty_max, private_right_of_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let skipped = 0;

  const ingestAll = db.transaction(() => {
    for (const req of seed.requirements) {
      // Look up category
      const cat = findCategory.get(req.category, req.subcategory) as { id: number } | undefined;
      if (!cat) {
        console.error(`  WARNING: Category not found: ${req.category}/${req.subcategory} — skipping`);
        skipped++;
        continue;
      }

      // Look up document — try exact match first, then fuzzy (LIKE) match
      let doc = findDocument.get(req.law_short_name) as { id: number } | undefined;
      if (!doc) {
        doc = findDocumentFuzzy.get(req.law_short_name, req.law_short_name) as { id: number } | undefined;
      }
      if (!doc) {
        console.error(`  WARNING: Document not found: ${req.law_short_name} — skipping`);
        skipped++;
        continue;
      }

      // Look up provision (optional — may not match if section_number differs)
      const prov = findProvision.get(doc.id, req.section_number) as { id: number } | undefined;

      insertReq.run(
        req.jurisdiction,
        cat.id,
        doc.id,
        prov?.id ?? null,
        req.summary_text,
        req.notification_days,
        req.notification_target,
        req.applies_to,
        req.penalty_max,
        req.private_right_of_action
      );
      inserted++;
    }
  });

  ingestAll();

  console.log(`  Inserted: ${inserted} state requirements`);
  if (skipped > 0) {
    console.log(`  Skipped: ${skipped} (missing category or document)`);
  }

  db.close();
  console.log('Done.');
}

main();
