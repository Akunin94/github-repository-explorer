import { describe, it, expect } from 'vitest'
import { parseRateLimit, isRateLimited } from '@/api/rateLimit'

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries)
}

describe('parseRateLimit', () => {
  it('parses valid rate-limit headers', () => {
    const info = parseRateLimit(
      headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '57',
        'x-ratelimit-reset': '1700000000',
      }),
    )
    expect(info).toEqual({ limit: 60, remaining: 57, reset: 1700000000 })
  })

  it('returns null when any header is missing', () => {
    const info = parseRateLimit(
      headers({ 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '57' }),
    )
    expect(info).toBeNull()
  })

  it('returns null when a header is not a number', () => {
    const info = parseRateLimit(
      headers({
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': 'oops',
        'x-ratelimit-reset': '1700000000',
      }),
    )
    expect(info).toBeNull()
  })
})

describe('isRateLimited', () => {
  it('is true for 403 with zero remaining', () => {
    expect(isRateLimited(403, { limit: 60, remaining: 0, reset: 1 })).toBe(true)
  })

  it('is true for 429 with zero remaining', () => {
    expect(isRateLimited(429, { limit: 60, remaining: 0, reset: 1 })).toBe(true)
  })

  it('is false for 403 that still has budget (e.g. secondary limit)', () => {
    expect(isRateLimited(403, { limit: 60, remaining: 12, reset: 1 })).toBe(false)
  })

  it('is false when there is no rate-limit info', () => {
    expect(isRateLimited(403, null)).toBe(false)
  })

  it('is false for unrelated statuses', () => {
    expect(isRateLimited(404, { limit: 60, remaining: 0, reset: 1 })).toBe(false)
  })
})
