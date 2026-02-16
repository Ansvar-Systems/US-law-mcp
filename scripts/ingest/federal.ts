#!/usr/bin/env tsx
import Database from '@ansvar/mcp-sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'database.db');
const SEED_DIR = path.resolve(__dirname, '..', '..', 'data', 'seed', 'federal');

interface DocumentSeed {
  jurisdiction: string;
  title: string;
  identifier: string;
  short_name: string;
  document_type: string;
  status: string;
  effective_date: string;
  last_amended: string;
  source_url: string;
}

interface ProvisionSeed {
  document_index: number;
  jurisdiction: string;
  section_number: string;
  title: string;
  text: string;
  order_index: number;
}

interface SeedData {
  documents: DocumentSeed[];
  provisions: ProvisionSeed[];
}

function main(): void {
  console.log('=== US Law MCP — Federal Statute Ingestion ===');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}. Run 'npm run build:db' first.`);
    process.exit(1);
  }

  const seedFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json')).sort();
  if (seedFiles.length === 0) {
    console.error(`No JSON files found in ${SEED_DIR}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  const insertDoc = db.prepare(`
    INSERT OR IGNORE INTO legal_documents (jurisdiction, title, identifier, short_name, document_type, status, effective_date, last_amended, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProv = db.prepare(`
    INSERT INTO legal_provisions (document_id, jurisdiction, section_number, title, text, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalDocs = 0;
  let totalProvs = 0;

  const ingestAll = db.transaction(() => {
    for (const file of seedFiles) {
      const filePath = path.join(SEED_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const seed = JSON.parse(raw) as SeedData;
      const label = path.basename(file, '.json');

      console.log(`  Processing ${label} (${file})...`);

      // Insert documents, track IDs
      const docIds: number[] = [];
      for (const doc of seed.documents) {
        const info = insertDoc.run(doc.jurisdiction, doc.title, doc.identifier, doc.short_name, doc.document_type, doc.status, doc.effective_date, doc.last_amended, doc.source_url);
        // Get the ID (either just inserted or existing)
        if (info.changes > 0) {
          docIds.push(Number(info.lastInsertRowid));
        } else {
          const existing = db.prepare('SELECT id FROM legal_documents WHERE identifier = ? AND jurisdiction = ?').get(doc.identifier, doc.jurisdiction) as { id: number };
          docIds.push(existing.id);
        }
      }

      totalDocs += seed.documents.length;

      // Insert provisions
      for (const prov of seed.provisions) {
        const docId = docIds[prov.document_index];
        if (docId === undefined) {
          console.error(`    WARNING: No document at index ${prov.document_index} for provision ${prov.section_number}`);
          continue;
        }
        insertProv.run(docId, prov.jurisdiction, prov.section_number, prov.title, prov.text, prov.order_index);
        totalProvs++;
      }
    }
  });

  ingestAll();

  console.log(`  Total: ${totalDocs} documents, ${totalProvs} provisions across ${seedFiles.length} files`);

  // Rebuild FTS index
  console.log('  Rebuilding FTS index...');
  db.exec("INSERT INTO provisions_fts(provisions_fts) VALUES('rebuild')");

  db.close();
  console.log('Done.');
}

main();
