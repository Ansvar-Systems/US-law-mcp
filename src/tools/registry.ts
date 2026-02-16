/**
 * Tool registry for US Law MCP Server.
 * Shared between stdio (index.ts) and HTTP (api/mcp.ts) entry points.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type { Database } from '@ansvar/mcp-sqlite';

import { searchLegislation, type SearchLegislationInput } from './search-legislation.js';
import { getProvision, type GetProvisionInput } from './get-provision.js';
import { listSources } from './list-sources.js';
import { compareRequirements, type CompareRequirementsInput } from './compare-requirements.js';
import { getStateRequirements, type GetStateRequirementsInput } from './get-state-requirements.js';
import { validateCitation, type ValidateCitationInput } from './validate-citation.js';
import { checkCurrency, type CheckCurrencyInput } from './check-currency.js';

export const TOOLS: Tool[] = [
  {
    name: 'search_legislation',
    description: 'Search US federal and state statutes by keyword. Searches FTS-indexed provisions from uscode.house.gov and state legislative portals. Use jurisdiction to filter by state (e.g. "US-CA", "US-NY") or "US-FED" for federal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search terms' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g. "US-FED", "US-CA", "US-NY"). Omit for all jurisdictions.' },
        limit: { type: 'number', description: 'Max results (1-50, default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_provision',
    description: 'Retrieve a specific provision from a US statute. Use law_identifier (e.g. "18 USC 1030") or short_name (e.g. "CFAA", "CCPA") with jurisdiction.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        law_identifier: { type: 'string', description: 'Statute identifier (e.g. "18 USC 1030", "Cal. Civ. Code § 1798.100")' },
        short_name: { type: 'string', description: 'Short name (e.g. "CFAA", "CCPA", "SHIELD Act")' },
        section_number: { type: 'string', description: 'Specific section to retrieve (e.g. "§ 1030(a)")' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g. "US-FED", "US-CA")' },
      },
      required: ['jurisdiction'],
    },
  },
  {
    name: 'list_sources',
    description: 'List all jurisdictions available in the US Law database with document and provision counts.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'compare_requirements',
    description: 'Compare cybersecurity/privacy requirements across US states. Categories: breach_notification, privacy_rights, cybersecurity, sector_specific. Example: compare breach notification timelines across CA, NY, TX.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'Category: breach_notification, privacy_rights, cybersecurity, sector_specific' },
        subcategory: { type: 'string', description: 'Subcategory (e.g. "timeline", "penalties", "right_to_delete")' },
        jurisdictions: {
          description: 'Array of jurisdiction codes (e.g. ["US-CA", "US-NY", "US-TX"]) or "all" for all states',
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string', enum: ['all'] },
          ],
        },
      },
      required: ['category', 'jurisdictions'],
    },
  },
  {
    name: 'get_state_requirements',
    description: 'Get all classified cybersecurity/privacy requirements for a specific US state. Returns structured data for breach notification, privacy rights, and cybersecurity requirements.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g. "US-CA", "US-NY")' },
        category: { type: 'string', description: 'Filter by category: breach_notification, privacy_rights, cybersecurity, sector_specific' },
      },
      required: ['jurisdiction'],
    },
  },
  {
    name: 'validate_citation',
    description: 'Validate a US legal citation. Checks if the cited statute/provision exists in the database.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        citation: { type: 'string', description: 'Citation to validate (e.g. "18 USC 1030", "CCPA", "Cal. Civ. Code § 1798.100")' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code to narrow search' },
      },
      required: ['citation'],
    },
  },
  {
    name: 'check_currency',
    description: 'Check if a US statute is currently in force. Returns status, effective date, and last amendment date.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        law_identifier: { type: 'string', description: 'Statute identifier' },
        short_name: { type: 'string', description: 'Short name (e.g. "CFAA")' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code' },
      },
      required: ['jurisdiction'],
    },
  },
];

export function registerTools(
  server: Server,
  db: Database,
): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'search_legislation':
          result = await searchLegislation(db, args as unknown as SearchLegislationInput);
          break;
        case 'get_provision':
          result = await getProvision(db, args as unknown as GetProvisionInput);
          break;
        case 'list_sources':
          result = await listSources(db);
          break;
        case 'compare_requirements':
          result = await compareRequirements(db, args as unknown as CompareRequirementsInput);
          break;
        case 'get_state_requirements':
          result = await getStateRequirements(db, args as unknown as GetStateRequirementsInput);
          break;
        case 'validate_citation':
          result = await validateCitation(db, args as unknown as ValidateCitationInput);
          break;
        case 'check_currency':
          result = await checkCurrency(db, args as unknown as CheckCurrencyInput);
          break;
        default:
          return {
            content: [{ type: 'text' as const, text: `Error: Unknown tool "${name}".` }],
            isError: true,
          };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error executing ${name}: ${message}` }],
        isError: true,
      };
    }
  });
}
