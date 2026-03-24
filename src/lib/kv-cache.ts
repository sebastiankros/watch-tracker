/**
 * Persistent cache layer using Vercel KV (Redis).
 * Falls back to in-memory Map when KV is not configured.
 *
 * To enable: add a KV database in Vercel Dashboard → Storage → KV.
 * It auto-sets KV_REST_API_URL and KV_REST_API_TOKEN env vars.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;

async function getKV() {
  if (kv) return kv;
  try {
    const mod = await import('@vercel/kv');
    if (process.env.KV_REST_API_URL) {
      kv = mod.kv;
      return kv;
    }
  } catch {
    // @vercel/kv not available or not configured
  }
  return null;
}

// In-memory fallback (survives within same function instance, dies on cold start)
const memCache = new Map<string, { data: unknown; expiresAt: number }>();

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const client = await getKV();
  if (client) {
    try {
      const val = await client.get(key);
      return val as T | null;
    } catch {
      // KV error — fall through to memory
    }
  }

  const entry = memCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  if (entry) memCache.delete(key);
  return null;
}

export async function kvSet(key: string, value: unknown, ttlSeconds = 1800): Promise<void> {
  const client = await getKV();
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSeconds });
    } catch {
      // KV error — fall through to memory
    }
  }

  memCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function kvGetAll(prefix: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  memCache.forEach((entry, key) => {
    if (key.startsWith(prefix) && Date.now() < entry.expiresAt) {
      result[key] = entry.data;
    }
  });
  return result;
}
