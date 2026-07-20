import type { RateLimitInfo } from './errors'

/**
 * Parse the X-RateLimit-* headers GitHub attaches to every response. Returns
 * null when the headers are absent or malformed (some proxy/error responses
 * omit them).
 */
export function parseRateLimit(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('x-ratelimit-limit')
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')

  if (limit === null || remaining === null || reset === null) {
    return null
  }

  const info: RateLimitInfo = {
    limit: Number(limit),
    remaining: Number(remaining),
    reset: Number(reset),
  }

  if (
    Number.isNaN(info.limit) ||
    Number.isNaN(info.remaining) ||
    Number.isNaN(info.reset)
  ) {
    return null
  }

  return info
}

/**
 * A 403/429 is only a *rate-limit* failure when remaining hits zero. GitHub also
 * returns 403 for other reasons (secondary limits, blocked content), so we check
 * the header instead of trusting the status alone.
 */
export function isRateLimited(
  status: number,
  rateLimit: RateLimitInfo | null,
): boolean {
  if (status !== 403 && status !== 429) return false
  return rateLimit !== null && rateLimit.remaining === 0
}
