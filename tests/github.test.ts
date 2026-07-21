import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchRepositories, getRepository, PER_PAGE } from '@/api/github'
import { clearCache } from '@/api/cache'

const fetchMock = vi.fn()

function okResponse(): Response {
  return new Response(JSON.stringify({ total_count: 0, items: [] }), {
    status: 200,
  })
}

/** The URL fetch was called with, as a parsed URL. */
function calledUrl(): URL {
  return new URL(fetchMock.mock.calls[0]![0] as string)
}

beforeEach(() => {
  clearCache() // isolate tests from the module-level response cache
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(okResponse())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchRepositories', () => {
  it('builds a best-match query without sort/order', async () => {
    await searchRepositories({ query: 'vue' })
    const url = calledUrl()
    expect(url.pathname).toBe('/search/repositories')
    expect(url.searchParams.get('q')).toBe('vue')
    expect(url.searchParams.get('per_page')).toBe(String(PER_PAGE))
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.get('sort')).toBeNull()
    expect(url.searchParams.get('order')).toBeNull()
  })

  it('includes sort and order for an explicit sort', async () => {
    await searchRepositories({ query: 'vue', sort: 'stars', page: 3 })
    const url = calledUrl()
    expect(url.searchParams.get('sort')).toBe('stars')
    expect(url.searchParams.get('order')).toBe('desc')
    expect(url.searchParams.get('page')).toBe('3')
  })

  it('encodes special characters in the query', async () => {
    await searchRepositories({ query: 'c++ user:foo' })
    // The raw query string must carry an encoded value, not a literal space/plus.
    expect(fetchMock.mock.calls[0]![0]).toContain('q=c%2B%2B+user%3Afoo')
  })
})

describe('getRepository', () => {
  it('encodes owner and repo in the path', async () => {
    await getRepository({ owner: 'foo bar', repo: 'a/b' })
    expect(calledUrl().pathname).toBe('/repos/foo%20bar/a%2Fb')
  })
})
