# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under ABA Model Rules and state bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- ABA Model Rules (particularly Rule 1.6) and state bar rules require reasonable efforts to protect confidential information

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/us-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/us-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://us-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text, provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (United States)

### ABA Model Rules of Professional Conduct

U.S. lawyers are bound by professional conduct rules adopted by their state bar, typically based on the ABA Model Rules.

#### Attorney-Client Privilege and Confidentiality

- **ABA Model Rule 1.6**: A lawyer shall not reveal information relating to the representation of a client unless the client gives informed consent
- **ABA Model Rule 1.6(c)**: A lawyer shall make reasonable efforts to prevent the inadvertent or unauthorized disclosure of, or unauthorized access to, information relating to the representation
- **Work Product Doctrine**: Attorney work product (mental impressions, legal theories) is protected
- All client communications are privileged and must be safeguarded
- Information that could identify clients or matters must not be transmitted to third-party services

#### Competence with Technology

- **ABA Model Rule 1.1, Comment [8]**: Lawyers must stay abreast of changes in technology, including AI tools
- **Duty of Supervision (Rule 5.3)**: Lawyers must supervise AI tool outputs as they would supervise non-lawyer assistants
- Several state bars have issued AI-specific ethics opinions; check your jurisdiction

### State-Specific Data Protection Laws

The United States has no comprehensive federal data protection law, but numerous state laws apply:

- **California (CCPA/CPRA)**: Consumer privacy rights, data processing obligations
- **Virginia (VCDPA)**, **Colorado (CPA)**, **Connecticut (CTDPA)**, **Utah (UCPA)**: State privacy acts with varying requirements
- **State Bar Ethics Opinions**: Many states have issued opinions on cloud computing and AI tool use for lawyers (e.g., ABA Formal Opinion 477R on cloud storage)
- Ensure compliance with applicable state privacy laws when processing client data

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does the Clean Air Act say about emission standards for power plants?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties for securities fraud under the Securities Exchange Act?"
```

- Query pattern may reveal you are working on a securities fraud matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases (Westlaw, LexisNexis, Bloomberg Law) with proper data protection agreements

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Westlaw, LexisNexis, Bloomberg Law)
4. Review your state bar's ethics opinions on AI and cloud computing

### For Large Firms / Corporate Legal (Am Law / BigLaw)

1. Negotiate data protection agreements with AI service providers
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns
4. Develop firm-wide AI use policies compliant with ABA and state bar guidance
5. Consider engagement letter disclosures regarding AI tool use

### For Government / Public Sector

1. Use self-hosted deployment, no external APIs
2. Follow agency-specific information security requirements (FISMA, FedRAMP)
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/US-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **ABA Guidance**: ABA Standing Committee on Ethics and Professional Responsibility
- **State Bar Guidance**: Consult your state bar association's ethics hotline

---

**Last Updated**: 2026-02-22
**Tool Version**: 1.0.0
