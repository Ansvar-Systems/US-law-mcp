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
import { buildLegalStance, type BuildLegalStanceInput } from './build-legal-stance.js';
import { ValidationError } from '../utils/validate.js';
import {
  getProvisionHistory,
  diffProvision,
  getRecentChanges,
  type GetProvisionHistoryInput,
  type DiffProvisionInput,
  type GetRecentChangesInput,
} from './version-tracking.js';

export const TOOLS: Tool[] = [
  {
    name: 'search_legislation',
    description:
      'Full-text search across US federal and state cybersecurity/privacy statutes. ' +
      'Returns BM25-ranked results with highlighted snippets from 55 jurisdictions (federal + 50 states + DC + territories). ' +
      'Covers breach notification, data privacy, cybersecurity, and sector-specific laws. ' +
      'Use this tool when you need to find provisions by keyword or topic. ' +
      'Do NOT use this when you already know the exact law and section — use get_provision instead. ' +
      'Multi-word queries use AND by default with OR fallback if no results found. ' +
      'To get full text of a result, pass its short_name and jurisdiction to get_provision.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search terms (e.g. "breach notification", "encryption personal information", "right to delete"). Supports FTS5 syntax: AND, OR, NOT, "exact phrase", prefix*.',
        },
        jurisdiction: {
          type: 'string',
          description: 'Filter to a single jurisdiction. Format: "US-FED" for federal, "US-XX" for states (e.g. "US-CA", "US-NY", "US-TX"). Omit to search all jurisdictions. Use list_sources to see available jurisdictions.',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (1-50, default 10). Lower values are faster and use fewer tokens.',
          minimum: 1,
          maximum: 50,
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_provision',
    description:
      'Retrieve the full text of a specific US statute provision. ' +
      'Use this when you know which law you want — by short name (e.g. "CFAA", "CCPA/CPRA", "SHIELD Act") or identifier (e.g. "18 USC 1030"). ' +
      'Returns all provisions for the law, or a specific section if section_number is provided. ' +
      'Supports partial short_name matching (e.g. "CCPA" matches "CCPA/CPRA"). ' +
      'If no results are found, returns hints listing available laws in the jurisdiction. ' +
      'Do NOT use this for keyword search — use search_legislation instead.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        law_identifier: {
          type: 'string',
          description: 'Formal statute identifier (e.g. "18 USC 1030", "Cal. Civ. Code § 1798.100"). Use either this or short_name, not both.',
        },
        short_name: {
          type: 'string',
          description: 'Common short name of the law (e.g. "CFAA", "CCPA/CPRA", "SHIELD Act", "HIPAA", "GLBA", "COPPA", "TX Breach"). Supports partial matching. Use either this or law_identifier.',
        },
        section_number: {
          type: 'string',
          description: 'Specific section to retrieve (e.g. "§ 1030", "§ 1798.100", "§ 899-aa"). Omit to get all provisions of the law. Supports parent/child matching.',
        },
        jurisdiction: {
          type: 'string',
          description: 'Required. Jurisdiction code: "US-FED" for federal, "US-XX" for states (e.g. "US-CA", "US-NY"). Use list_sources to see available jurisdictions.',
        },
      },
      required: ['jurisdiction'],
    },
  },
  {
    name: 'list_sources',
    description:
      'List all jurisdictions available in the US Law database with document and provision counts per jurisdiction. ' +
      'Use this tool first when you need to discover available data or verify which states are covered. ' +
      'Returns jurisdiction codes (e.g. "US-FED", "US-CA"), human-readable names, and counts. ' +
      'Currently covers 55 jurisdictions: Federal + 50 states + DC + Guam + Puerto Rico + US Virgin Islands.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'compare_requirements',
    description:
      'Compare cybersecurity/privacy legal requirements across multiple US states side by side. ' +
      'This is the key cross-state analysis tool — use it when comparing how different states handle the same requirement. ' +
      'Returns structured data including notification timelines, penalty maximums, scope, and applicability for each state. ' +
      'Example: compare breach notification timelines across CA, NY, TX to see that TX requires 60-day notification. ' +
      'Do NOT use this for single-state lookup — use get_state_requirements instead.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Requirement category to compare.',
          enum: ['breach_notification', 'privacy_rights', 'cybersecurity', 'sector_specific'],
        },
        subcategory: {
          type: 'string',
          description:
            'Optional subcategory filter. ' +
            'For breach_notification: timeline, definition, scope, notification_target, exemptions, penalties. ' +
            'For privacy_rights: right_to_know, right_to_delete, right_to_opt_out, right_to_correct, right_to_portability. ' +
            'For cybersecurity: security_requirements, risk_assessment, incident_response, encryption, vendor_management. ' +
            'For sector_specific: financial, healthcare, education, insurance.',
        },
        jurisdictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of jurisdiction codes to compare (e.g. ["US-CA", "US-NY", "US-TX"]). Use ["all"] for all states with data for this category.',
        },
      },
      required: ['category', 'jurisdictions'],
    },
  },
  {
    name: 'get_state_requirements',
    description:
      'Get all classified cybersecurity/privacy requirements for a single US state. ' +
      'Returns structured data: breach notification timelines, privacy rights, cybersecurity obligations, and sector-specific rules. ' +
      'Each requirement includes summary, notification days, penalty maximum, private right of action, and linked law. ' +
      'Use this for single-state deep dive. For multi-state comparison, use compare_requirements instead.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        jurisdiction: {
          type: 'string',
          description: 'Required. State jurisdiction code (e.g. "US-CA", "US-NY", "US-TX"). Must be a state code, not "US-FED".',
        },
        category: {
          type: 'string',
          description: 'Filter to a specific category. Omit for all categories.',
          enum: ['breach_notification', 'privacy_rights', 'cybersecurity', 'sector_specific'],
        },
      },
      required: ['jurisdiction'],
    },
  },
  {
    name: 'validate_citation',
    description:
      'Validate whether a US legal citation exists in the database. ' +
      'Checks short names (e.g. "CFAA", "HIPAA"), identifiers (e.g. "18 USC 1030"), and provision section numbers. ' +
      'Returns the matched document and provision if found. Use this as a zero-hallucination check before citing a law. ' +
      'Returns valid=false with match_quality="none" if the citation is not found. ' +
      'match_quality indicates confidence: "section_exact" (section matched directly), "section_fuzzy" (section matched via number extraction), or "document_only" (law found but specific section not confirmed — matched_provision is a representative first section).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        citation: {
          type: 'string',
          description: 'Citation to validate. Accepts short names ("CFAA", "HIPAA"), identifiers ("18 USC 1030"), section references ("§ 1798.100"), or partial matches.',
        },
        jurisdiction: {
          type: 'string',
          description: 'Optional jurisdiction code to narrow the search (e.g. "US-FED", "US-CA").',
        },
      },
      required: ['citation'],
    },
  },
  {
    name: 'check_currency',
    description:
      'Check whether a US statute is currently in force, repealed, or superseded. ' +
      'Returns status (in_force, amended, repealed, superseded, not_found), effective date, and last amendment date. ' +
      'is_current is true for both "in_force" and "amended" statuses (an amended law is still current). ' +
      'Use this to verify that a law is still valid before relying on it. ' +
      'Provide either law_identifier or short_name (required, not both).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        law_identifier: {
          type: 'string',
          description: 'Formal statute identifier (e.g. "18 USC 1030"). Use either this or short_name.',
        },
        short_name: {
          type: 'string',
          description: 'Common short name (e.g. "CFAA", "HIPAA", "CCPA/CPRA"). Use either this or law_identifier.',
        },
        jurisdiction: {
          type: 'string',
          description: 'Required. Jurisdiction code (e.g. "US-FED", "US-CA").',
        },
      },
      required: ['jurisdiction'],
    },
  },
  {
    name: 'build_legal_stance',
    description:
      'Build a comprehensive legal research summary for a US cybersecurity/privacy question. ' +
      'Searches statutes and state requirements simultaneously to aggregate relevant citations. ' +
      'Use this for broad legal research questions like "What are the breach notification requirements for companies operating in multiple states?" ' +
      'Returns statute matches, classified requirements, and metadata. ' +
      'For targeted single-tool queries, use the specific tools instead. ' +
      'To drill into a specific result, pass its short_name and jurisdiction to get_provision for full text, or use compare_requirements for cross-state analysis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Legal question or topic to research (e.g. "breach notification requirements for financial institutions", "encryption requirements across states").',
        },
        jurisdictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional. Jurisdictions to include (e.g. ["US-CA", "US-NY"]). Omit to search all.',
        },
        limit: {
          type: 'number',
          description: 'Max results per category (default 5, max 20).',
          minimum: 1,
          maximum: 20,
          default: 5,
        },
      },
      required: ['query'],
    },
  },
  // --- Premium tools: version tracking ---
  {
    name: 'get_provision_history',
    description:
      'Get the full version timeline for a specific US statute provision, showing all amendments with dates and change summaries. ' +
      'Premium feature — requires Ansvar Intelligence Portal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        short_name: {
          type: 'string',
          description: 'Short name of the law (e.g. "CFAA", "CCPA/CPRA", "HIPAA").',
        },
        jurisdiction: {
          type: 'string',
          description: 'Jurisdiction code (e.g. "US-FED", "US-CA").',
        },
        section_number: {
          type: 'string',
          description: 'Specific section (e.g. "§ 1030"). Omit for law-level history.',
        },
      },
      required: ['short_name', 'jurisdiction'],
    },
  },
  {
    name: 'diff_provision',
    description:
      'Show what changed in a US statute provision between two dates, including a unified diff and change summary. ' +
      'Premium feature — requires Ansvar Intelligence Portal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        short_name: {
          type: 'string',
          description: 'Short name of the law (e.g. "CFAA", "CCPA/CPRA").',
        },
        jurisdiction: {
          type: 'string',
          description: 'Jurisdiction code (e.g. "US-FED", "US-CA").',
        },
        section_number: {
          type: 'string',
          description: 'Specific section (e.g. "§ 1030"). Omit for law-level diff.',
        },
        from_date: {
          type: 'string',
          description: 'ISO date to diff from (e.g. "2024-01-01").',
        },
        to_date: {
          type: 'string',
          description: 'ISO date to diff to (defaults to current).',
        },
      },
      required: ['short_name', 'jurisdiction', 'from_date'],
    },
  },
  {
    name: 'get_recent_changes',
    description:
      'List all US statute provisions that changed since a given date, with change summaries. Optionally filter to a specific jurisdiction. ' +
      'Premium feature — requires Ansvar Intelligence Portal.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        since: {
          type: 'string',
          description: 'ISO date (e.g. "2024-06-01").',
        },
        jurisdiction: {
          type: 'string',
          description: 'Filter to a specific jurisdiction (e.g. "US-CA"). Omit for all.',
        },
        limit: {
          type: 'number',
          description: 'Maximum changes to return. Default: 50, max: 200.',
          minimum: 1,
          maximum: 200,
        },
      },
      required: ['since'],
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
        case 'build_legal_stance':
          result = await buildLegalStance(db, args as unknown as BuildLegalStanceInput);
          break;
        case 'get_provision_history':
          result = await getProvisionHistory(db, args as unknown as GetProvisionHistoryInput);
          break;
        case 'diff_provision':
          result = await diffProvision(db, args as unknown as DiffProvisionInput);
          break;
        case 'get_recent_changes':
          result = await getRecentChanges(db, args as unknown as GetRecentChangesInput);
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
      const isValidation = error instanceof ValidationError;
      return {
        content: [{
          type: 'text' as const,
          text: isValidation
            ? `Validation error: ${message}`
            : `Error executing ${name}: ${message}`,
        }],
        isError: true,
      };
    }
  });
}
