import type { ApiResult } from './client'

/** Cached responses go stale after this; GitHub data (stars, etc.) drifts. */
export const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
/** LRU bound so a long browsing session can't grow the cache without limit. */
export const MAX_ENTRIES = 50

interface Entry {
  value: ApiResult<unknown>
  expiresAt: number
}

const store = new Map<string, Entry>()

function evictOverflow(): void {
  // Map iterates in insertion order, so the first key is the least-recently
  // used (reads re-insert to the end — see the hit branch below).
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest === undefined) break
    store.delete(oldest)
  }
}

/**
 * Serve identical requests from an in-memory cache within `ttlMs` instead of
 * re-hitting the network — GitHub's search API allows only ~10 requests/minute
 * unauthenticated, so re-running the same query shouldn't burn the budget.
 *
 * Only successful responses are cached: an aborted or failed request throws and
 * falls through, so it's retried next time rather than caching an error.
 */
export async function withCache<T>(
  key: string,
  fetcher: (signal?: AbortSignal) => Promise<ApiResult<T>>,
  options: { signal?: AbortSignal; ttlMs?: number } = {},
): Promise<ApiResult<T>> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const now = Date.now()

  const hit = store.get(key)
  if (hit && hit.expiresAt > now) {
    // Mark as most-recently-used by re-inserting at the end of the Map.
    store.delete(key)
    store.set(key, hit)
    return hit.value as ApiResult<T>
  }
  if (hit) store.delete(key) // expired — drop it

  // The signal is passed through, so a superseded request is still cancelled at
  // the network layer; because it throws, it simply isn't cached.
  const result = await fetcher(options.signal)
  store.set(key, { value: result, expiresAt: Date.now() + ttlMs })
  evictOverflow()
  return result
}

/** Empty the cache (used by tests and available for a future manual refresh). */
export function clearCache(): void {
  store.clear()
}
