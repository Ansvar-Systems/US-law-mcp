# US Law MCP Server

**The eCFR and US Code alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fus-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/us-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/US-law-mcp?style=social)](https://github.com/Ansvar-Systems/US-law-mcp)
[![CI](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/US-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/INTERNATIONAL_ALIGNMENT.md)
[![Provisions](https://img.shields.io/badge/provisions-46%2C646-blue)](docs/INTERNATIONAL_ALIGNMENT.md)

Query **130 curated US federal statutes and regulations** -- from HIPAA and CCPA to SOX, GLBA, FERPA, COPPA, FISMA, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing US federal compliance research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

US compliance research means navigating eCFR (ecfr.gov), uscode.house.gov, and agency guidance across dozens of federal departments, reconciling statutes with implementing regulations, and manually checking for amendments in the Federal Register. Whether you're:

- A **compliance officer** checking HIPAA obligations, CCPA requirements, or SOX controls
- A **lawyer** validating citations in a brief or contract
- A **legal tech developer** building tools on US federal compliance law
- A **researcher** mapping US regulatory requirements against international frameworks

...you shouldn't need dozens of browser tabs and manual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes US federal compliance law **searchable, cross-referenceable, and AI-readable**.

> **Coverage note:** The database covers 130 curated statutes and regulations -- a compliance-focused subset of US federal law, not the complete US Code. The selection prioritises data protection, cybersecurity, financial regulation, healthcare, and cross-border compliance topics most relevant for enterprise compliance work.

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

## Example Queries

Once connected, just ask naturally:

- *"What does HIPAA say about protected health information (PHI) in § 164.514?"*
- *"Find CCPA provisions about consumer rights to opt out of sale of personal information"*
- *"What are the breach notification requirements under HIPAA?"*
- *"Is GLBA Section 501 still in force?"*
- *"What does FERPA say about student records and third-party disclosure?"*
- *"Search for cybersecurity requirements across US federal statutes"*
- *"What does FISMA require for federal information systems?"*
- *"Build a legal stance on data breach notification under US federal law"*
- *"Search for GDPR-equivalent requirements in US law: consent, purpose limitation, data subject rights"*
- *"Find COPPA provisions about children's online privacy"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes & Regulations** | 130 instruments | Curated US federal compliance law |
| **Provisions** | 46,646 sections | Full-text searchable with FTS5 |
| **Preparatory Works** | 993,700 documents | Congressional records and Federal Register (Premium) |
| **Database Size** | ~184 MB | Optimized SQLite, portable |
| **Daily Updates** | Automated | Freshness checks against eCFR and US Code |

### Key Laws and Regulations Included

| Law / Regulation | Coverage |
|-----------------|---------|
| HIPAA (45 CFR Parts 160-164) | Privacy Rule, Security Rule, Breach Notification |
| CCPA / CPRA | California Consumer Privacy Act + amendments |
| SOX (Sarbanes-Oxley) | Full text, Sections 302, 404, 906 |
| GLBA (Gramm-Leach-Bliley) | Financial privacy, safeguards rule |
| FERPA | Family Educational Rights and Privacy Act |
| COPPA (16 CFR Part 312) | Children's Online Privacy Protection Rule |
| FISMA | Federal Information Security Modernization Act |
| FCRA | Fair Credit Reporting Act |
| CAN-SPAM | Commercial electronic messaging |
| ECPA | Electronic Communications Privacy Act |

**Verified data only** -- every citation is validated against official sources (ecfr.gov, uscode.house.gov). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from eCFR (ecfr.gov) and US Code (uscode.house.gov) official sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by CFR citation or USC section
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
eCFR API + US Code → Parse → SQLite → FTS5 snippet() → MCP response
                       ↑                      ↑
                Provision parser       Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search eCFR by CFR part | Search by plain English: *"protected health information"* |
| Navigate multi-section regulations manually | Get the exact provision with context |
| Manual cross-referencing between statutes and CFR | `build_legal_stance` aggregates across sources |
| "Is this regulation still in force?" → check manually | `check_currency` tool → answer in seconds |
| Find EU/international counterparts → manual research | `get_eu_basis` → comparative mapping instantly |
| No API, no integration | MCP protocol → AI-native |

**Traditional:** Search eCFR → Navigate 45 CFR → Ctrl+F → Cross-reference with NIST guidance → Repeat

**This MCP:** *"What are the HIPAA Security Rule requirements for access control, and how do they compare to ISO 27001?"* → Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 search on 46,646 provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by CFR citation or USC section |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes and regulations |
| `format_citation` | Format citations per US legal conventions (full/short/pinpoint) |
| `check_currency` | Check if statute or regulation is in force, amended, or superseded |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International & Comparative Law Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU regulatory equivalents for a US statute (comparative, not adequacy) |
| `get_us_implementations` | Find US laws aligning with a specific international framework |
| `search_eu_implementations` | Search international documents with US alignment counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check comparative alignment status against EU frameworks |

---

## International & Comparative Law Alignment

The US has no EU adequacy decision under GDPR for general commercial data transfers (the EU-US Data Privacy Framework covers organisations self-certified under that framework only). However, the comparative law tools allow you to explore regulatory alignment across frameworks.

### Key Comparative Mappings

| US Law | EU Equivalent | Alignment Notes |
|--------|--------------|-----------------|
| HIPAA Privacy Rule | GDPR Article 9 (health data) | Similar sensitivity classification; different consent mechanisms |
| CCPA / CPRA | GDPR (general) | Similar rights (access, deletion, portability); no global adequacy |
| GLBA Safeguards Rule | GDPR Article 32 (security) | Comparable security controls framework |
| CAN-SPAM | ePrivacy Directive | Opt-out vs. opt-in distinction is the primary difference |
| COPPA | GDPR Article 8 (children) | US threshold 13, EU threshold 16 (varies by member state) |
| FISMA NIST 800-53 | ISO 27001 / NIS2 | Extensive control overlap, different certification models |

> **Note on state law:** US legal advice varies by state bar jurisdiction. This database covers federal law only. State-level privacy laws (CPRA, VCDPA, CPA, etc.) require state-specific counsel. CCPA/CPRA is included as it has broad cross-state applicability for organisations with California customers.

> **Note on adequacy:** The EU-US Data Privacy Framework (DPF) is not legislation -- it is a self-certification scheme. This database covers the underlying US statutory frameworks, not DPF compliance procedures.

---

## Data Sources & Freshness

All content is sourced from authoritative US legal databases:

- **[eCFR - Electronic Code of Federal Regulations](https://www.ecfr.gov/)** -- Office of the Federal Register
- **[US Code](https://uscode.house.gov/)** -- Office of the Law Revision Counsel

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Office of the Federal Register / Law Revision Counsel |
| **Retrieval method** | eCFR API + US Code XML |
| **Language** | English |
| **License** | US Government Works (public domain) |
| **Coverage** | 130 federal statutes and regulations (curated) |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks (Daily)

A [daily GitHub Actions workflow](.github/workflows/check-updates.yml) monitors all data sources:

| Source | Check | Method |
|--------|-------|--------|
| **CFR amendments** | eCFR API date comparison | All covered CFR parts checked |
| **US Code updates** | US Code XML date comparison | Covered USC titles checked |
| **New Federal Register rules** | FR API (30-day window) | Relevant agency dockets monitored |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute and regulation text is sourced from official eCFR and US Code publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Coverage is limited** to 130 curated statutes -- not all US federal law is included
> - **State law is not included** -- US legal advice varies by state bar jurisdiction; consult state-qualified counsel
> - **Court case coverage is not included** -- do not rely on this for case law research
> - **Agency guidance** (FDA guidance documents, FTC staff reports, etc.) is in Premium tier only
> - **Verify critical citations** against primary sources (ecfr.gov, uscode.house.gov) for filings
> - **EU cross-references** reflect comparative alignment, not adequacy or legal equivalence

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. See [PRIVACY.md](PRIVACY.md) for American Bar Association (ABA) compliance guidance.

---

## Documentation

- **[International Alignment Guide](docs/INTERNATIONAL_ALIGNMENT.md)** -- EU-US comparative law documentation
- **[Security Policy](SECURITY.md)** -- Vulnerability reporting and scanning details
- **[Disclaimer](DISCLAIMER.md)** -- Legal disclaimers and professional use notices
- **[Privacy](PRIVACY.md)** -- Client confidentiality and data handling

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/US-law-mcp
cd US-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run fetch:federal              # Fetch US Code from uscode.house.gov
npm run fetch:federal:full         # Full US Code fetch
npm run ingest:federal             # Ingest US Code statutes
npm run build:db                   # Rebuild SQLite database
npm run drift:detect               # Run drift detection
npm run check-updates              # Check for amendments
npm run check:updates              # Check eCFR for updated CFR parts
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~184 MB (comprehensive compliance corpus)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### @ansvar/us-law-mcp (This Project)
**Query 130 US federal compliance statutes and regulations directly from Claude** -- HIPAA, CCPA, SOX, GLBA, FERPA, FISMA, and more. `npx @ansvar/us-law-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, NIST 800-53, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/ot-security-mcp](https://github.com/Ansvar-Systems/ot-security-mcp)
**Query IEC 62443, NIST 800-82/53, and MITRE ATT&CK for ICS** -- Specialized for OT/ICS environments. `npx @ansvar/ot-security-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**70+ national law MCPs** covering Austria, Belgium, Brazil, Canada, Denmark, Finland, France, Germany, India, Ireland, Italy, Japan, Netherlands, Norway, Portugal, Singapore, Slovenia, South Korea, Sweden, Switzerland, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Coverage expansion (additional CFR parts and USC titles)
- State privacy law coverage (VCDPA, CPA, CTDPA, etc.)
- Agency guidance documents (FTC, HHS, SEC)
- EU-US comparative law mapping expansion
- Court decision coverage (SCOTUS, circuit courts)

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Corpus ingestion (130 statutes, 46,646 provisions)
- [x] International/comparative law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [x] Daily freshness checks
- [ ] Coverage expansion (additional CFR parts)
- [ ] State privacy law coverage (VCDPA, CPA, CTDPA, MHMDA)
- [ ] Agency guidance documents (FTC, HHS OCR, SEC)
- [ ] Court decision coverage (SCOTUS, key circuit cases)
- [ ] EU-US DPF compliance procedure documentation

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{us_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {US Law MCP Server: Production-Grade Federal Compliance Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/US-law-mcp},
  note = {130 US federal compliance statutes with 46,646 provisions including HIPAA, CCPA, SOX, GLBA, and FERPA}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Regulations:** US Government Works (public domain -- 17 U.S.C. § 105)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server helps organisations navigate US federal compliance law -- whether you're a US-headquartered company handling EU data transfers, or a European company entering the US market.

So we're open-sourcing it. Navigating 46,646 provisions across HIPAA, SOX, GLBA, and FERPA shouldn't require a JD from every state bar.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
