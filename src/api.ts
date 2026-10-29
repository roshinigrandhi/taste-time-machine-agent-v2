import type { DiscoveryResult, TasteInput } from '@/types';
import { generateDemoResult } from '@/demoData';

// The live Qloo API is called through a Supabase Edge Function so the
// QLOO_API_KEY is never exposed to the browser. The function reads the key
// from the server environment and proxies the request.
//
// Until the Qloo API key is configured AND the endpoint has been tested
// successfully, we fall back to clearly-labeled demo data. The UI must
// never present demo data as real Qloo output.

const EDGE_FUNCTION_PATH = 'qloo-discover';

function getFunctionUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL is not configured.');
  return `${url.replace(/\/$/, '')}/functions/v1/${EDGE_FUNCTION_PATH}`;
}

function getAuthHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Supabase anon key is not configured.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
}

export interface DiscoverResponse {
  result: DiscoveryResult;
  source: 'qloo' | 'demo';
  qlooConnected: boolean;
}

export async function discoverTaste(input: TasteInput): Promise<DiscoverResponse> {
  const response = await fetch(getFunctionUrl(), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`The discovery service returned an error${text ? `: ${text}` : '.'}`);
  }

  const data = (await response.json()) as Partial<DiscoverResponse>;

  // Validate the shape before binding into the UI.
  if (!data || !data.result || !data.result.era || !data.result.city) {
    throw new Error('The discovery service returned an unexpected response.');
  }

  return {
    result: data.result,
    source: data.source === 'qloo' ? 'qloo' : 'demo',
    qlooConnected: Boolean(data.qlooConnected),
  };
}

// Synchronous helper for the no-network demo path (used only when the user
// explicitly wants to preview the experience without calling the server).
export function demoDiscover(input: TasteInput): DiscoverResponse {
  return {
    result: generateDemoResult(input),
    source: 'demo',
    qlooConnected: false,
  };
}
