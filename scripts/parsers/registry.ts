/**
 * parsers/registry.ts — Shared parser registry (no circular imports)
 *
 * This module holds the registry Map and types. Parser modules import from
 * here to register themselves. The index module re-exports everything and
 * triggers parser loading.
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
