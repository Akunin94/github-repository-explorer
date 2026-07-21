import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { request, buildUrl } from '@/api/client'
import { ApiError, AbortedError } from '@/api/errors'

const RL_HEADERS = {
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': '59',
  'x-ratelimit-reset': '1700000000',
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = RL_HEADERS,
): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildUrl', () => {
  it('appends params and skips undefined/empty values', () => {
    const url = buildUrl('/search/repositories', {
      q: 'vue',
      page: 2,
      sort: undefined,
      order: '',
    })
    expect(url).toBe('https://api.github.com/search/repositories?q=vue&page=2')
  })
})

describe('request', () => {
  it('returns data and rate-limit info on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hello: 'world' }))
    const result = await request<{ hello: string }>('/x')
    expect(result.data).toEqual({ hello: 'world' })
    expect(result.rateLimit).toEqual({ limit: 60, remaining: 59, reset: 1700000000 })
  })

  it('sends the Authorization header only when a token is given', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))
    await request('/x', { token: 'abc123' })
    const headers = fetchMock.mock.calls[0]![1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer abc123')

    fetchMock.mockResolvedValue(jsonResponse({}))
    await request('/x')
    const noAuth = fetchMock.mock.calls[1]![1].headers as Record<string, string>
    expect(noAuth.Authorization).toBeUndefined()
  })

  it('maps 404 to a not-found ApiError', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404))
    await expect(request('/x')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'not-found',
      status: 404,
    })
  })

  it('maps 403 with zero remaining to a rate-limit ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'rate limited' }, 403, {
        ...RL_HEADERS,
        'x-ratelimit-remaining': '0',
      }),
    )
    const error = await request('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).kind).toBe('rate-limit')
    expect((error as ApiError).rateLimit?.remaining).toBe(0)
  })

  it('maps 422 to a validation ApiError and keeps the API message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Validation Failed' }, 422),
    )
    await expect(request('/x')).rejects.toMatchObject({
      kind: 'validation',
      message: 'Validation Failed',
    })
  })

  it('wraps a thrown fetch as a network ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(request('/x')).rejects.toMatchObject({ kind: 'network' })
  })

  it('translates an aborted fetch into AbortedError', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(request('/x')).rejects.toBeInstanceOf(AbortedError)
  })

  it('translates an abort during body read into AbortedError', async () => {
    // fetch resolves, but reading the body is interrupted by an abort.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(RL_HEADERS),
      json: () => Promise.reject(new DOMException('aborted', 'AbortError')),
    })
    await expect(request('/x')).rejects.toBeInstanceOf(AbortedError)
  })

  it('maps a malformed success body to an unknown ApiError', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(RL_HEADERS),
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    })
    await expect(request('/x')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'unknown',
    })
  })
})
