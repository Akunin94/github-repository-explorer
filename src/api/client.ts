import { ApiError, AbortedError, type ApiErrorKind } from './errors'
import { parseRateLimit, isRateLimited } from './rateLimit'
import type { RateLimitInfo } from './errors'

const BASE_URL = 'https://api.github.com'

export interface RequestOptions {
  /** Query string parameters; undefined/empty values are skipped. */
  params?: Record<string, string | number | undefined>
  /** Optional PAT. When present, raises the rate limit from 60 to 5000/hour. */
  token?: string | null
  /** Abort signal so stale requests can be cancelled. */
  signal?: AbortSignal
}

export interface ApiResult<T> {
  data: T
  rateLimit: RateLimitInfo | null
}

export function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

function messageForKind(kind: ApiErrorKind, apiMessage?: string): string {
  switch (kind) {
    case 'rate-limit':
      return 'GitHub API rate limit exceeded.'
    case 'not-found':
      return 'The requested resource was not found.'
    case 'validation':
      return apiMessage ?? 'The search query is invalid.'
    case 'unauthorized':
      return 'The provided token is invalid or expired.'
    case 'network':
      return 'Network error — please check your connection.'
    default:
      return apiMessage ?? 'Something went wrong while contacting GitHub.'
  }
}

function kindForStatus(status: number, rateLimit: RateLimitInfo | null): ApiErrorKind {
  if (isRateLimited(status, rateLimit)) return 'rate-limit'
  if (status === 404) return 'not-found'
  if (status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  return 'unknown'
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { params, token, signal } = options

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), { headers, signal: signal ?? null })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AbortedError()
    }
    throw new ApiError('network', messageForKind('network'))
  }

  const rateLimit = parseRateLimit(response.headers)

  if (!response.ok) {
    let apiMessage: string | undefined
    try {
      const body = (await response.json()) as { message?: string }
      apiMessage = body.message
    } catch {
      // body was not JSON; fall back to the generic message
    }

    const kind = kindForStatus(response.status, rateLimit)
    throw new ApiError(kind, messageForKind(kind, apiMessage), {
      status: response.status,
      rateLimit,
    })
  }

  // The body can still be read mid-flight when a caller aborts (superseded
  // search/detail requests) — surface that as an AbortedError like a pre-body
  // abort, and treat any other parse failure as a handled error rather than an
  // uncaught rejection that would break the UI.
  try {
    const data = (await response.json()) as T
    return { data, rateLimit }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AbortedError()
    }
    throw new ApiError('unknown', 'Received a malformed response from GitHub.', {
      status: response.status,
      rateLimit,
    })
  }
}
