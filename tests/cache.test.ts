import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { withCache, clearCache, MAX_ENTRIES } from '@/api/cache'

function ok<T>(data: T) {
  return { data, rateLimit: null }
}

beforeEach(() => {
  clearCache()
})

describe('withCache', () => {
  it('serves a second identical call from cache without refetching', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok('result'))

    const first = await withCache('k', fetcher)
    const second = await withCache('k', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(second).toBe(first) // same cached reference
  })

  it('passes the caller signal through to the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(1))
    const controller = new AbortController()

    await withCache('k', fetcher, { signal: controller.signal })

    expect(fetcher).toHaveBeenCalledWith(controller.signal)
  })

  it('refetches once the entry is older than its TTL', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue(ok(1))

    await withCache('k', fetcher, { ttlMs: 1000 })
    vi.advanceTimersByTime(1001)
    await withCache('k', fetcher, { ttlMs: 1000 })

    expect(fetcher).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('does not cache a failed request', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(ok('ok'))

    await expect(withCache('k', fetcher)).rejects.toThrow('boom')
    const retried = await withCache('k', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(retried.data).toBe('ok')
  })

  it('evicts the least-recently-used entry beyond the size bound', async () => {
    for (let i = 0; i < MAX_ENTRIES; i++) {
      await withCache(`k${i}`, vi.fn().mockResolvedValue(ok(i)))
    }
    // One more entry pushes the oldest ("k0") out.
    await withCache('overflow', vi.fn().mockResolvedValue(ok('new')))

    const refetch = vi.fn().mockResolvedValue(ok('again'))
    await withCache('k0', refetch)
    expect(refetch).toHaveBeenCalledTimes(1) // was evicted, so it refetched
  })

  it('clearCache drops everything', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok(1))
    await withCache('k', fetcher)
    clearCache()
    await withCache('k', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

afterEach(() => {
  vi.useRealTimers()
})
