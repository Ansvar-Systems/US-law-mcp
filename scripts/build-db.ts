#!/usr/bin/env tsx
import Database from '@ansvar/mcp-sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DIR = path.resolve(__dirname, '..', 'data', 'seed');
const DB_PATH = path.resolve(__dirname, '..', 'data', 'database.db');

function main(): void {
  // Remove existing DB if present
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing database');
  }

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Open database
  const db = new Database(DB_PATH);

  // WASM SQLite on Vercel requires DELETE journal mode (not WAL)
  db.exec('PRAGMA journal_mode = DELETE');
  db.exec('PRAGMA foreign_keys = ON');

  // Read and execute schema
  const schemaSql = fs.readFileSync(path.join(SEED_DIR, 'schema.sql'), 'utf-8');
  db.exec(schemaSql);
  console.log('Schema created');

  // Read and execute category seeds
  const categoriesSql = fs.readFileSync(path.join(SEED_DIR, 'categories.sql'), 'utf-8');
  db.exec(categoriesSql);
  console.log('Categories seeded');

  // Write db_metadata
  const metaStmt = db.prepare('INSERT INTO db_metadata (key, value) VALUES (?, ?)');
  const metadata: [string, string][] = [
    ['tier', 'professional'],
    ['schema_version', '1.0'],
    ['jurisdiction', 'US'],
    ['built_at', new Date().toISOString()],
  ];
  for (const [key, value] of metadata) {
    metaStmt.run(key, value);
  }
  console.log('Metadata written');

  // Optimize
  db.exec('ANALYZE');
  db.exec('VACUUM');
  console.log('ANALYZE + VACUUM complete');

  // Close
  db.close();

  const stats = fs.statSync(DB_PATH);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`Database built: ${DB_PATH} (${sizeKB} KB)`);
}

main();
