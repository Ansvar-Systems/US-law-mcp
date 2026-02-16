/**
 * parsers/index.ts — Parser registry for state legislative HTML pages
 *
 * Each parser module calls registerParser() at import time.
 * Consumers call getParser(name) to retrieve a registered parser function.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface ParsedProvision {
  sectionNumber: string;  // e.g. "§ 1798.82"
  title: string;          // section heading
  text: string;           // full text content
}

export type ParserFn = (html: string, url: string) => ParsedProvision[];

// ── Registry ───────────────────────────────────────────────────────

const registry = new Map<string, ParserFn>();

export function registerParser(name: string, fn: ParserFn): void {
  registry.set(name, fn);
}

export function getParser(name: string): ParserFn {
  const fn = registry.get(name);
  if (!fn) {
    throw new Error(`Unknown parser: "${name}". Available: ${[...registry.keys()].join(', ')}`);
  }
  return fn;
}

export function listParsers(): string[] {
  return [...registry.keys()];
}

// ── Import all parser modules to trigger registration ──────────────

import './leginfo.js';
import './legislature.js';
import './simple-html.js';
