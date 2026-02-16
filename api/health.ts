import type { VercelRequest, VercelResponse } from '@vercel/node';

const SERVER_NAME = 'us-law-mcp';
const SERVER_VERSION = '0.1.0';
const REPO_URL = 'https://github.com/Ansvar-Systems/US-law-mcp';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', `https://${req.headers.host}`);

  if (url.pathname === '/version' || url.searchParams.has('version')) {
    res.status(200).json({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      node_version: process.version,
      transport: ['stdio', 'streamable-http'],
      capabilities: ['statutes', 'cross_state_comparison'],
      tier: 'professional',
      source_schema_version: '1.0',
      repo_url: REPO_URL,
      report_issue_url: `${REPO_URL}/issues/new`,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    server: SERVER_NAME,
    version: SERVER_VERSION,
    uptime_seconds: Math.floor(process.uptime()),
    capabilities: ['statutes', 'cross_state_comparison'],
    tier: 'professional',
  });
}
