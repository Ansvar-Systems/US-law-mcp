import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  extractReleaseLinks,
  computeReleaseDigest,
  runReleaseCheck,
  type CliArgs,
} from '../../scripts/check-uscode-updates.js';

const SAMPLE_HTML = `
  <html><body>
    <a href="/download/releasepoints/us/pl/120/xml_120.zip">120 XML</a>
    <a href="https://uscode.house.gov/download/releasepoints/us/pl/119/xml_119.zip">119 XML</a>
    <a href="/download/releasepoints/us/pl/120/xml_120.zip#fragment">120 XML duplicate</a>
    <a href="/download/other/path.zip">ignore</a>
  </body></html>
`;

describe('check-uscode-updates', () => {
  it('extracts and normalizes release-point links', () => {
    const links = extractReleaseLinks(SAMPLE_HTML, 'https://uscode.house.gov/download/releasepoints/us/pl/index.html');

    expect(links).toEqual([
      'https://uscode.house.gov/download/releasepoints/us/pl/119/xml_119.zip',
      'https://uscode.house.gov/download/releasepoints/us/pl/120/xml_120.zip',
    ]);
  });

  it('computes stable digest from normalized links', () => {
    const linksA = extractReleaseLinks(SAMPLE_HTML);
    const linksB = extractReleaseLinks(`\n${SAMPLE_HTML}\n`);

    const digestA = computeReleaseDigest(linksA, SAMPLE_HTML);
    const digestB = computeReleaseDigest(linksB, `\n${SAMPLE_HTML}\n`);

    expect(digestA).toBe(digestB);
    expect(digestA).toMatch(/^[a-f0-9]{64}$/);
  });

  it('runs release check from local fixture file', async () => {
    const tempPath = path.join(os.tmpdir(), `uscode-releasepoints-${Date.now()}.html`);
    fs.writeFileSync(tempPath, SAMPLE_HTML, 'utf-8');

    const args: CliArgs = {
      url: 'https://uscode.house.gov/download/releasepoints/us/pl/index.html',
      fromFile: tempPath,
      githubOutput: false,
    };

    const result = await runReleaseCheck(args);

    expect(result.status).toBe('ok');
    expect(result.http_status).toBe(200);
    expect(result.release_links_count).toBe(2);
    expect(result.latest_release_link).toContain('/120/xml_120.zip');
    expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
