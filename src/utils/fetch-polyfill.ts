// Polyfill fetch for Node.js < 18
// Node 18+ has native fetch, older versions need node-fetch

export async function getFetch(): Promise<typeof fetch> {
  // Check if native fetch exists (Node 18+)
  if (typeof globalThis.fetch !== 'undefined') {
    return globalThis.fetch;
  }

  // Fall back to node-fetch for Node < 18
  const nodeFetch = await import('node-fetch');
  return nodeFetch.default as unknown as typeof fetch;
}
