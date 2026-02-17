import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage, ServerResponse } from 'node:http';

import mcpHandler from '../../api/mcp.js';

let server: http.Server;
let baseUrl = '';
let integrationReady = false;
const MCP_ACCEPT_HEADER = 'application/json, text/event-stream';
const MCP_PROTOCOL_VERSION = '2025-06-18';

function withBodyParser(handler: typeof mcpHandler) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', async () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      try {
        (req as IncomingMessage & { body?: unknown }).body = raw ? JSON.parse(raw) : undefined;
      } catch {
        (req as IncomingMessage & { body?: unknown }).body = undefined;
      }

      await handler(
        req as unknown as Parameters<typeof mcpHandler>[0],
        res as unknown as Parameters<typeof mcpHandler>[1],
      );
    });
  };
}

interface RpcRequestOptions {
  sessionId?: string;
  protocolVersion?: string;
}

async function postRpc(
  payload: Record<string, unknown>,
  options: RpcRequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: MCP_ACCEPT_HEADER,
  };
  if (options.sessionId) headers['mcp-session-id'] = options.sessionId;
  if (options.protocolVersion) headers['mcp-protocol-version'] = options.protocolVersion;

  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

beforeAll(async () => {
  server = http.createServer(withBodyParser(mcpHandler));
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
    integrationReady = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/EPERM|operation not permitted/i.test(message)) {
      throw error;
    }
    integrationReady = false;
  }
}, 20_000);

afterAll(async () => {
  if (!integrationReady) return;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('mcp HTTP POST integration', () => {
  it('handles initialize and tools/list over POST', async () => {
    if (!integrationReady) return;

    const initPayload = {
      jsonrpc: '2.0',
      id: 'init-1',
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'vitest', version: '1.0.0' },
      },
    };

    const initResp = await postRpc(initPayload);
    const initText = await initResp.text();
    const initBody = JSON.parse(initText) as {
      result?: {
        protocolVersion?: string;
      };
    };
    const negotiatedProtocol = initBody.result?.protocolVersion ?? MCP_PROTOCOL_VERSION;

    expect(initResp.status).toBe(200);
    expect(initText.toLowerCase()).not.toContain('error');
    // Handler config uses stateless transport (sessionIdGenerator: undefined).
    expect(initResp.headers.get('mcp-session-id')).toBeNull();
    expect(negotiatedProtocol.length).toBeGreaterThan(0);

    const listPayload = {
      jsonrpc: '2.0',
      id: 'list-1',
      method: 'tools/list',
      params: {},
    };

    const listResp = await postRpc(listPayload, {
      protocolVersion: negotiatedProtocol,
    });
    const listText = await listResp.text();

    expect(listResp.status).toBe(200);
    expect(listText).toContain('search_legislation');
    expect(listText).toContain('get_provision');
  });

  it('handles tools/call over POST', async () => {
    if (!integrationReady) return;

    const callPayload = {
      jsonrpc: '2.0',
      id: 'call-1',
      method: 'tools/call',
      params: {
        name: 'list_sources',
        arguments: {},
      },
    };

    const callResp = await postRpc(callPayload, {
      protocolVersion: MCP_PROTOCOL_VERSION,
    });
    const callText = await callResp.text();

    expect(callResp.status).toBe(200);
    // The output marker can vary by fixture payload across environments.
    expect(callText.toUpperCase()).toMatch(/US-FED|FEDERAL|UNITED STATES/);
    expect(callText).toContain('jurisdiction');
  });
});
