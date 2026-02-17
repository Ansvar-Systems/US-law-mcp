#!/usr/bin/env tsx
/**
 * Check US Code release-point page for content drift.
 *
 * This script fetches the release-point index page, extracts release links,
 * computes a stable digest, and prints structured JSON for workflow use.
 *
 * Usage:
 *   npm run check:updates
 *   npm run check:updates -- --github-output
 *   npm run check:updates -- --from-file ./fixtures/releasepoints.html
 */

import * as fs from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const RELEASE_POINTS_URL = 'https://uscode.house.gov/download/releasepoints/us/pl/index.html';
const REQUEST_TIMEOUT_MS = 30_000;

export interface ReleaseCheckResult {
  status: 'ok' | 'error';
  source_url: string;
  fetched_at: string;
  http_status: number;
  release_links_count: number;
  release_links: string[];
  latest_release_link: string | null;
  digest: string;
  error: string | null;
}

export interface CliArgs {
  url: string;
  fromFile: string | null;
  githubOutput: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const parsed: CliArgs = {
    url: RELEASE_POINTS_URL,
    fromFile: null,
    githubOutput: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--github-output') {
      parsed.githubOutput = true;
      continue;
    }
    if (arg === '--url') {
      const value = args[i + 1];
      if (!value) throw new Error('--url requires a value');
      parsed.url = value;
      i++;
      continue;
    }
    if (arg === '--from-file') {
      const value = args[i + 1];
      if (!value) throw new Error('--from-file requires a value');
      parsed.fromFile = value;
      i++;
      continue;
    }
  }

  return parsed;
}

function normalizeLink(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;

  let absolute: URL;
  try {
    absolute = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }

  const pathname = absolute.pathname.toLowerCase();
  if (!pathname.includes('/download/releasepoints/us/pl/')) return null;

  absolute.hash = '';
  absolute.search = '';
  return absolute.toString();
}

export function extractReleaseLinks(html: string, baseUrl: string = RELEASE_POINTS_URL): string[] {
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  const links = new Set<string>();
  let match: RegExpExecArray | null = hrefRegex.exec(html);

  while (match) {
    const href = match[1];
    if (href) {
      const normalized = normalizeLink(href, baseUrl);
      if (normalized) links.add(normalized);
    }
    match = hrefRegex.exec(html);
  }

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  return Array.from(links).sort((a, b) => collator.compare(a, b));
}

export function computeReleaseDigest(links: string[], html: string): string {
  const canonical = links.length > 0
    ? links.join('\n')
    : html.replace(/\s+/g, ' ').trim();

  return createHash('sha256').update(canonical).digest('hex');
}

async function fetchReleasePage(url: string): Promise<{ status: number; html: string }> {
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'User-Agent': 'Ansvar-US-Law-MCP/update-checker',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html = await resp.text();
  return { status: resp.status, html };
}

function toErrorResult(url: string, message: string): ReleaseCheckResult {
  return {
    status: 'error',
    source_url: url,
    fetched_at: new Date().toISOString(),
    http_status: 0,
    release_links_count: 0,
    release_links: [],
    latest_release_link: null,
    digest: '',
    error: message,
  };
}

function writeGithubOutput(result: ReleaseCheckResult): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  const lines = [
    `status=${result.status}`,
    `http_status=${result.http_status}`,
    `release_links_count=${result.release_links_count}`,
    `digest=${result.digest}`,
    `latest_release_link=${result.latest_release_link ?? ''}`,
    `error=${result.error ?? ''}`,
  ];

  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
}

export async function runReleaseCheck(args: CliArgs): Promise<ReleaseCheckResult> {
  try {
    let status = 200;
    let html: string;

    if (args.fromFile) {
      const filePath = path.resolve(args.fromFile);
      html = fs.readFileSync(filePath, 'utf-8');
    } else {
      const fetched = await fetchReleasePage(args.url);
      status = fetched.status;
      html = fetched.html;
      if (status < 200 || status >= 300) {
        return {
          status: 'error',
          source_url: args.url,
          fetched_at: new Date().toISOString(),
          http_status: status,
          release_links_count: 0,
          release_links: [],
          latest_release_link: null,
          digest: '',
          error: `HTTP ${status}`,
        };
      }
    }

    const releaseLinks = extractReleaseLinks(html, args.url);
    const digest = computeReleaseDigest(releaseLinks, html);

    return {
      status: 'ok',
      source_url: args.url,
      fetched_at: new Date().toISOString(),
      http_status: status,
      release_links_count: releaseLinks.length,
      release_links: releaseLinks,
      latest_release_link: releaseLinks.at(-1) ?? null,
      digest,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return toErrorResult(args.url, message);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const result = await runReleaseCheck(args);

  if (args.githubOutput) {
    writeGithubOutput(result);
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'ok') {
    process.exitCode = 1;
  }
}

const thisFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryFile === thisFile) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const fallback = toErrorResult(RELEASE_POINTS_URL, message);
    console.log(JSON.stringify(fallback, null, 2));
    process.exit(1);
  });
}
