# US Law MCP

US federal and state cybersecurity/privacy law MCP server providing full-text search across federal statutes (USC) and state-level breach notification, privacy rights, and cybersecurity requirements with cross-state comparison.

[![CI](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ansvar/us-law-mcp)](https://www.npmjs.com/package/@ansvar/us-law-mcp)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Ansvar-Systems/US-law-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/Ansvar-Systems/US-law-mcp)

## Features

- **Federal statutes** from uscode.house.gov -- Titles 6, 15, 18, 42, 44, 47
- **All 50 states + DC** -- comprehensive breach notification, privacy, and cybersecurity statutes
- **Cross-state comparison** for breach notification, privacy rights, and cybersecurity requirements
- **Full-text search** with BM25 ranking
- **Citation validation** -- verify that a legal citation exists in the database
- **Currency checking** -- determine whether a statute is currently in force, repealed, or superseded

## Data Sources

| Source | Authority | Coverage | License |
|--------|-----------|----------|---------|
| US Code (USLM) | Office of the Law Revision Counsel | Titles 6, 15, 18, 42, 44, 47 | Public Domain |
| State Legislative Portals | Individual state legislatures | All 50 states + DC: cybersecurity, privacy, breach notification | Public Domain |

## Available Tools

| Tool | Description |
|------|-------------|
| `search_legislation` | Full-text search across federal and state statutes |
| `get_provision` | Retrieve specific provision by identifier or short name |
| `list_sources` | List available jurisdictions with document counts |
| `compare_requirements` | Compare requirements across states by category |
| `get_state_requirements` | Get classified requirements for a specific state |
| `validate_citation` | Check if a legal citation exists in the database |
| `check_currency` | Check if a statute is currently in force |

## Quick Start

```bash
# Via npx (stdio transport)
npx @ansvar/us-law-mcp

# Via Vercel (Streamable HTTP)
# Endpoint: https://us-law-mcp.vercel.app/mcp
```

## Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "us-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/us-law-mcp"]
    }
  }
}
```

## Development

```bash
npm install
npm run build:db && npm run ingest:all
npm run dev        # stdio mode
npm test           # run tests
npm run validate   # lint + test + contract tests
```

## Jurisdictions

**53 jurisdictions**: US Federal + all 50 states + DC

`US-FED` `US-AL` `US-AK` `US-AZ` `US-AR` `US-CA` `US-CO` `US-CT` `US-DE` `US-DC` `US-FL` `US-GA` `US-HI` `US-ID` `US-IL` `US-IN` `US-IA` `US-KS` `US-KY` `US-LA` `US-ME` `US-MD` `US-MA` `US-MI` `US-MN` `US-MS` `US-MO` `US-MT` `US-NE` `US-NV` `US-NH` `US-NJ` `US-NM` `US-NY` `US-NC` `US-ND` `US-OH` `US-OK` `US-OR` `US-PA` `US-RI` `US-SC` `US-SD` `US-TN` `US-TX` `US-UT` `US-VT` `US-VA` `US-WA` `US-WV` `US-WI` `US-WY`

## License

[Apache-2.0](LICENSE)

## Links

- [Repository](https://github.com/Ansvar-Systems/US-law-mcp)
- [Issues](https://github.com/Ansvar-Systems/US-law-mcp/issues)
- [Ansvar Systems](https://ansvar.eu)
