#!/usr/bin/env tsx
/**
 * Drift detection for US Law MCP.
 *
 * Checks if upstream govinfo.gov content has changed since last ingestion.
 * Uses the golden-hashes.json fixture to verify content integrity.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hashesPath = join(__dirname, '../fixtures/golden-hashes.json');

interface GoldenHash {
  id: string;
  description: string;
  upstream_url: string;
  expected_sha256: string;
  expected_snippet: string;
}

interface HashFixture {
  version: string;
  provisions: GoldenHash[];
}

async function main(): Promise<void> {
  console.log('US Law MCP — Drift Detection');
  console.log('=====================================\n');

  const fixture: HashFixture = JSON.parse(readFileSync(hashesPath, 'utf-8'));
  console.log(`Checking ${fixture.provisions.length} provisions...\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const hash of fixture.provisions) {
    if (hash.expected_sha256 === 'COMPUTE_ON_FIRST_INGEST') {
      console.log(`  SKIP ${hash.id}: Not yet ingested`);
      skipped++;
      continue;
    }

    try {
      const response = await fetch(hash.upstream_url, {
        headers: { 'User-Agent': 'US-Law-MCP/1.0 drift-detect' },
      });

      if (response.status !== 200) {
        console.log(`  WARN ${hash.id}: HTTP ${response.status}`);
        failed++;
        continue;
      }

      const body = await response.text();

      if (hash.expected_snippet && body.toLowerCase().includes(hash.expected_snippet.toLowerCase())) {
        console.log(`  OK   ${hash.id}: Snippet found`);
        passed++;
      } else {
        console.log(`  DRIFT ${hash.id}: Expected snippet "${hash.expected_snippet}" not found`);
        failed++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR ${hash.id}: ${msg}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.log('\nDrift detected! Data may need re-ingestion.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
