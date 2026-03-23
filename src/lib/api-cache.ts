/**
 * Client-side API cache using sessionStorage.
 * Prevents re-scraping when navigating between pages.
 * Cache persists for the browser session (cleared on tab close).
 */

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes — matches server-side cache

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

function getCacheKey(url: string): string {
  return `api_cache:${url}`;
}

function getFromCache(url: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(url));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(getCacheKey(url));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setInCache(url: string, data: unknown): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    sessionStorage.setItem(getCacheKey(url), JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — silently skip
  }
}

/**
 * Cached fetch — returns cached response if fresh, otherwise fetches and caches.
 * Drop-in replacement for `fetch(url).then(r => r.json())`.
 */
export async function cachedFetch<T = unknown>(url: string, opts?: { skipCache?: boolean }): Promise<T> {
  if (!opts?.skipCache) {
    const cached = getFromCache(url);
    if (cached) return cached as T;
  }

  const res = await fetch(url);
  const data = await res.json();

  // Only cache successful responses
  if (res.ok) {
    setInCache(url, data);
  }

  return data as T;
}

/**
 * Invalidate a specific cache entry or all entries matching a prefix.
 */
export function invalidateCache(urlPrefix?: string): void {
  try {
    if (!urlPrefix) {
      // Clear all API cache entries
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('api_cache:')) keys.push(key);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
    } else {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`api_cache:${urlPrefix}`)) keys.push(key);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
    }
  } catch {
    // ignore
  }
}
