import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick, type EffectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError, type RateLimitInfo } from '@/api/errors'
import type { SearchReposResponse } from '@/types/github'

// Mock the API surface so the composable is tested in isolation from fetch.
vi.mock('@/api/github', async () => {
  const actual = await vi.importActual<typeof import('@/api/github')>('@/api/github')
  return {
    ...actual,
    searchRepositories: vi.fn(),
    getRepository: vi.fn(),
  }
})

import { searchRepositories } from '@/api/github'
import { useRepoSearch } from '@/composables/useRepoSearch'

const searchMock = vi.mocked(searchRepositories)

interface Deferred {
  params: Parameters<typeof searchRepositories>[0]
  signal: AbortSignal | undefined
  resolve: (value: { data: SearchReposResponse; rateLimit: RateLimitInfo | null }) => void
  reject: (reason: unknown) => void
}

/** Make searchRepositories return controllable, never-auto-resolving promises. */
function deferredMock(): Deferred[] {
  const calls: Deferred[] = []
  searchMock.mockImplementation(
    (params) =>
      new Promise((resolve, reject) => {
        calls.push({ params, signal: params.signal, resolve, reject })
      }),
  )
  return calls
}

function response(
  overrides: Partial<SearchReposResponse> = {},
): { data: SearchReposResponse; rateLimit: RateLimitInfo | null } {
  return {
    data: { total_count: 0, incomplete_results: false, items: [], ...overrides },
    rateLimit: null,
  }
}

const DEBOUNCE = 300
let scope: EffectScope

function mountSearch() {
  scope = effectScope()
  return scope.run(() => useRepoSearch({ debounceMs: DEBOUNCE }))!
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  setActivePinia(createPinia())
  searchMock.mockReset()
})

afterEach(() => {
  scope?.stop()
  vi.useRealTimers()
})

describe('useRepoSearch', () => {
  it('does not search for an empty/whitespace query', async () => {
    deferredMock()
    const s = mountSearch()
    s.query.value = '   '
    await nextTick()
    await vi.advanceTimersByTimeAsync(DEBOUNCE)
    expect(searchMock).not.toHaveBeenCalled()
    expect(s.items.value).toEqual([])
  })

  it('debounces rapid typing into a single request', async () => {
    const calls = deferredMock()
    const s = mountSearch()

    s.query.value = 'v'
    await nextTick()
    s.query.value = 'vu'
    await nextTick()
    s.query.value = 'vue'
    await nextTick()

    // Before the debounce window elapses, nothing has fired.
    await vi.advanceTimersByTimeAsync(DEBOUNCE - 1)
    expect(searchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(searchMock).toHaveBeenCalledTimes(1)
    expect(calls[0]!.params.query).toBe('vue')
    expect(s.loading.value).toBe(true)
  })

  it('enters the loading state immediately, before the debounce fires', async () => {
    deferredMock()
    const s = mountSearch()

    s.query.value = 'vue'
    await nextTick()

    // The request hasn't been sent yet, but we're already "loading" so the
    // empty-results message can't flash during the debounce window.
    expect(searchMock).not.toHaveBeenCalled()
    expect(s.loading.value).toBe(true)
    expect(s.isEmpty.value).toBe(false)
  })

  it('aborts an in-flight request when superseded by pagination', async () => {
    const calls = deferredMock()
    const s = mountSearch()

    s.query.value = 'vue'
    await nextTick()
    await vi.advanceTimersByTimeAsync(DEBOUNCE)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.signal?.aborted).toBe(false)

    // Change page -> immediate re-run that must cancel the first request.
    s.page.value = 2
    await nextTick()
    expect(calls[0]!.signal?.aborted).toBe(true)
    expect(calls).toHaveLength(2)
    expect(calls[1]!.params.page).toBe(2)

    // Resolving the newest request updates state; the stale one is ignored.
    calls[1]!.resolve(response({ total_count: 3, items: [] }))
    await vi.advanceTimersByTimeAsync(0)
    expect(s.totalCount.value).toBe(3)
  })

  it('resets to page 1 when the query changes', async () => {
    const calls = deferredMock()
    const s = mountSearch()

    s.query.value = 'vue'
    await nextTick()
    await vi.advanceTimersByTimeAsync(DEBOUNCE)
    s.page.value = 3
    await nextTick()
    expect(s.page.value).toBe(3)

    s.query.value = 'react'
    await nextTick()
    expect(s.page.value).toBe(1) // reset synchronously
    await vi.advanceTimersByTimeAsync(DEBOUNCE)

    const last = calls.at(-1)!
    expect(last.params.query).toBe('react')
    expect(last.params.page).toBe(1)
  })

  it('exposes totalPages bounded by 1000 results', async () => {
    const calls = deferredMock()
    const s = mountSearch()
    s.query.value = 'vue'
    await nextTick()
    await vi.advanceTimersByTimeAsync(DEBOUNCE)
    calls[0]!.resolve(response({ total_count: 999999, items: [] }))
    await vi.advanceTimersByTimeAsync(0)
    expect(s.totalPages.value).toBe(50)
    expect(s.loading.value).toBe(false)
  })

  it('surfaces ApiError and clears results', async () => {
    const calls = deferredMock()
    const s = mountSearch()
    s.query.value = 'vue'
    await nextTick()
    await vi.advanceTimersByTimeAsync(DEBOUNCE)
    calls[0]!.reject(new ApiError('validation', 'bad query', { status: 422 }))
    await vi.advanceTimersByTimeAsync(0)

    expect(s.error.value).toBeInstanceOf(ApiError)
    expect(s.error.value?.kind).toBe('validation')
    expect(s.items.value).toEqual([])
    expect(s.loading.value).toBe(false)
    // An error is a distinct state from "searched but empty".
    expect(s.isEmpty.value).toBe(false)
  })
})
