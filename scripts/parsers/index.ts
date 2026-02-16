/**
 * parsers/index.ts — Parser registry for state legislative HTML pages
 *
 * Re-exports types and functions from registry.ts, then imports all parser
 * modules to trigger their self-registration. Consumers should import from
 * this file (or from registry.ts if they only need types).
 */

// Re-export everything from the registry module
export { registerParser, getParser, listParsers } from './registry.js';
export type { ParsedProvision, ParserFn } from './registry.js';

// ── Import all parser modules to trigger registration ──────────────

import './leginfo.js';
import './legislature.js';
import './simple-html.js';
