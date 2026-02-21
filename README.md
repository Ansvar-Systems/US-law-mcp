# US Law MCP Server

**The US Code alternative for the AI age.**

[![CI](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/check-updates.yml)
[![npm version](https://badge.fury.io/js/@ansvar%2Fus-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/us-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/US-law-mcp?style=social)](https://github.com/Ansvar-Systems/US-law-mcp)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Ansvar-Systems/US-law-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/Ansvar-Systems/US-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-484-blue)](#whats-included)

Query **93 US federal and state statutes** across **all 50 states + DC + key US territories** -- from CFAA and HIPAA to California's CCPA/CPRA, New York's SHIELD Act, and Texas TDPSA -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing US cybersecurity/privacy research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

US cybersecurity and privacy law is fragmented across 50+ jurisdictions. Whether you're:
- A **compliance officer** comparing breach notification timelines across states
- A **privacy engineer** checking which states require encryption of personal data
- A **legal tech developer** building multi-state compliance tools
- A **CISO** mapping state requirements to your incident response plan

...you shouldn't need to navigate dozens of state legislature websites and manually cross-reference PDFs. Ask Claude. Get the exact provision. Compare across states.

This MCP server makes US cybersecurity, privacy, and breach notification law **searchable, comparable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://us-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add us-law --transport http https://us-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "us-law": {
      "type": "url",
      "url": "https://us-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "us-law": {
      "type": "http",
      "url": "https://us-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/us-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "us-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/us-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"What does 18 U.S.C. § 1030 say about protected computers?"*
- *"Compare breach notification timelines across California, New York, and Texas"*
- *"What are Florida's breach notification requirements?"*
- *"Is HIPAA currently in force?"*
- *"Find provisions about encryption of personal information"*
- *"What privacy rights does California's CCPA/CPRA grant?"*
- *"Validate the citation CFAA"*
- *"Which states require notification within 30 days of a breach?"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Federal Statutes** | 15 laws | CFAA, HIPAA, ECPA, GLBA, COPPA, FISMA, CISA, FTC Act, and more |
| **State Statutes** | 78 laws | All 50 states + DC + Guam/Puerto Rico/US Virgin Islands: breach notification, privacy, cybersecurity |
| **Provisions** | 484 sections | Full-text searchable with FTS5 |
| **State Requirements** | 145 classified | Breach notification, privacy rights, cybersecurity obligations |
| **Requirement Categories** | 20 types | Timeline, scope, penalties, rights, obligations |
| **Jurisdictions** | 55 | Federal + 50 states + DC + Guam/Puerto Rico/US Virgin Islands |
| **Database Size** | ~3 MB | Optimized SQLite, portable |
| **Weekly Updates** | Automated | Freshness checks against uscode.house.gov |

**No LLM-generated statute text** -- provisions are fetched from published legal sources and stored verbatim for retrieval/search.

---

## Available Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 search across all federal and state provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by jurisdiction, law identifier, or section number |
| `list_sources` | List all available jurisdictions with document and provision counts |
| `compare_requirements` | Compare requirements across states by category and subcategory |
| `get_state_requirements` | Get classified requirements for a specific state (breach notification, privacy rights, etc.) |
| `validate_citation` | Validate a legal citation against the database (zero-hallucination check) |
| `check_currency` | Check if a statute is currently in force, amended, repealed, or superseded |
| `build_legal_stance` | Aggregate statute search + state requirements for comprehensive legal research |

### Cross-State Comparison

The killer feature. `compare_requirements` lets you instantly compare how different states handle the same legal requirement:

```
compare_requirements(category: "breach_notification", subcategory: "timeline", jurisdictions: ["US-CA", "US-NY", "US-TX"])
```

Returns structured data with notification deadlines, scope, and penalties for each state -- the kind of research that normally takes hours of manual cross-referencing.

---

## Jurisdictions

**55 jurisdictions**: US Federal + all 50 states + DC + Guam/Puerto Rico/US Virgin Islands

`US-FED` `US-AL` `US-AK` `US-AZ` `US-AR` `US-CA` `US-CO` `US-CT` `US-DE` `US-DC` `US-FL` `US-GA` `US-GU` `US-HI` `US-ID` `US-IL` `US-IN` `US-IA` `US-KS` `US-KY` `US-LA` `US-ME` `US-MD` `US-MA` `US-MI` `US-MN` `US-MS` `US-MO` `US-MT` `US-NE` `US-NV` `US-NH` `US-NJ` `US-NM` `US-NY` `US-NC` `US-ND` `US-OH` `US-OK` `US-OR` `US-PA` `US-PR` `US-RI` `US-SC` `US-SD` `US-TN` `US-TX` `US-UT` `US-VT` `US-VA` `US-VI` `US-WA` `US-WV` `US-WI` `US-WY`

---

## Data Sources & Freshness

All content is sourced from authoritative legal publications:

- **[US Code (USLM)](https://uscode.house.gov/)** -- Office of the Law Revision Counsel, official XML
- **[State Legislative Portals](https://www.congress.gov/state-legislature-websites)** -- individual state legislature publications and state-source captures

### Automated Freshness Checks (Weekly)

A [weekly GitHub Actions workflow](.github/workflows/check-updates.yml) monitors US Code release points, refreshes federal data, rebuilds the database, runs tests, and opens a PR when changes are detected.

| Source | Check | Method |
|--------|-------|--------|
| **US Code releases** | uscode.house.gov release points | Release-link digest change detection |
| **Public laws** | congress.gov/public-laws | Manual review triggered |
| **State amendments** | State legislature portals | Periodic manual review |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Weekly |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official/legal publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **State law coverage focuses on cybersecurity, privacy, and breach notification** -- it does not cover all areas of law
> - **Verify critical citations** against primary sources for court filings
> - **State laws change frequently** -- always confirm currency against official state sources

---

## Development

### Branching Strategy

This repository uses a `dev` integration branch. **Do not push directly to `main`.**

```
feature-branch → PR to dev → verify on dev → PR to main → deploy
```

- `main` is production-ready. Only receives merges from `dev` via PR.
- `dev` is the integration branch. All changes land here first.
- Feature branches are created from `dev`.

### Setup

```bash
git clone https://github.com/Ansvar-Systems/US-law-mcp
cd US-law-mcp
npm install
npm run build:db && npm run ingest:all
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server (stdio)
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `US_LAW_DB_PATH` | `data/database.db` (relative to dist) | Custom path to the SQLite database file |

### Data Management

```bash
npm run fetch:federal          # Fetch federal statutes from uscode.house.gov
npm run fetch:states           # Fetch state statutes
npm run build:db               # Rebuild SQLite database
npm run ingest:all             # Ingest all seed data (federal + states + classify)
npm run build:db:free          # Build free-tier database (no case law/regulatory guidance)
npm test                       # Run unit tests
npm run test:contract          # Run golden contract tests
npm run validate               # Lint + test + contract tests
```

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal compliance frameworks** -- HIPAA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/swedish-law-mcp](https://github.com/Ansvar-Systems/swedish-law-mcp)
**Query 717 Swedish statutes directly from Claude** -- DSL, BrB, ABL, MB, and more. Full provision text with EU cross-references. `npx @ansvar/swedish-law-mcp`

### [@ansvar/automotive-cybersecurity-mcp](https://github.com/Ansvar-Systems/Automotive-MCP)
**Query UNECE R155/R156 and ISO 21434** -- Automotive cybersecurity compliance. `npx @ansvar/automotive-cybersecurity-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

---

## Contributing

Contributions welcome! Priority areas:
- Expanding state law coverage beyond cybersecurity/privacy
- Adding case law references
- Historical statute versions and amendment tracking
- Regulatory guidance cross-references

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **US Code:** Public domain (Office of the Law Revision Counsel)
- **State Statutes:** Public domain (individual state legislatures)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools. This MCP server started because comparing breach notification requirements across 50 states shouldn't require a week of manual research.

So we're open-sourcing it. Multi-state compliance shouldn't be this hard.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
