/**
 * A normalized error model so the UI reacts to *kinds* of failures rather than
 * parsing HTTP status codes in components. Every failure the API layer produces
 * maps to exactly one of these kinds.
 */
export type ApiErrorKind =
  | 'rate-limit' // 403/429 with remaining requests exhausted
  | 'not-found' // 404
  | 'validation' // 422 (e.g. malformed search query)
  | 'unauthorized' // 401 (bad token)
  | 'network' // fetch threw (offline, DNS, CORS)
  | 'unknown' // anything else

export interface RateLimitInfo {
  limit: number
  remaining: number
  /** Epoch seconds when the primary rate limit resets. */
  reset: number
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly rateLimit: RateLimitInfo | null

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number | null; rateLimit?: RateLimitInfo | null } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.rateLimit = options.rateLimit ?? null
  }
}

/** A request the caller aborted (e.g. superseded by a newer keystroke). */
export class AbortedError extends Error {
  constructor() {
    super('Request aborted')
    this.name = 'AbortedError'
  }
}
