import { describe, it, expect } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import healthHandler from '../../api/health.js';
import mcpHandler from '../../api/mcp.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../../src/server-metadata.js';

interface MockResponse extends VercelResponse {
  statusCode: number;
  body: unknown;
  headersMap: Record<string, string | string[]>;
}

function createRequest(overrides: Partial<VercelRequest>): VercelRequest {
  return {
    method: 'GET',
    url: '/',
    headers: { host: 'localhost' },
    body: undefined,
    ...overrides,
  } as unknown as VercelRequest;
}

function createResponse(): MockResponse {
  const headersMap: Record<string, string | string[]> = {};
  let sent = false;

  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headersMap,
    get headersSent() {
      return sent;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      headersMap[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name: string) {
      return headersMap[name.toLowerCase()];
    },
    json(payload: unknown) {
      sent = true;
      this.body = payload;
      headersMap['content-type'] = 'application/json';
      return this;
    },
    end(payload?: unknown) {
      sent = true;
      this.body = payload;
      return this;
    },
  };

  return res as unknown as MockResponse;
}

describe('API handlers', () => {
  it('returns health payload from /health', () => {
    const req = createRequest({ method: 'GET', url: '/health', headers: { host: 'localhost' } });
    const res = createResponse();

    healthHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      server: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    });
  });

  it('returns version payload from /version', () => {
    const req = createRequest({ method: 'GET', url: '/version', headers: { host: 'localhost' } });
    const res = createResponse();

    healthHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      transport: ['stdio', 'streamable-http'],
    });
  });

  it('returns MCP metadata on GET /mcp', async () => {
    const req = createRequest({ method: 'GET', url: '/mcp', headers: { host: 'localhost' } });
    const res = createResponse();

    await mcpHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      protocol: 'mcp-streamable-http',
    });
    expect(res.headersMap['access-control-allow-origin']).toBe('*');
  });

  it('handles CORS preflight on /mcp', async () => {
    const req = createRequest({ method: 'OPTIONS', url: '/mcp', headers: { host: 'localhost' } });
    const res = createResponse();

    await mcpHandler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.headersMap['access-control-allow-methods']).toContain('OPTIONS');
    expect(res.headersMap['access-control-expose-headers']).toContain('mcp-session-id');
  });
});
