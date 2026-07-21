import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError, AbortedError } from '@/api/errors'
import type { GitHubRepo } from '@/types/github'
import { makeRepo } from './helpers/fixtures'

vi.mock('@/api/github', async () => {
  const actual = await vi.importActual<typeof import('@/api/github')>('@/api/github')
  return { ...actual, getRepository: vi.fn(), searchRepositories: vi.fn() }
})

import { getRepository } from '@/api/github'
import { useRepoDetails } from '@/composables/useRepoDetails'

const getMock = vi.mocked(getRepository)

interface Deferred {
  signal: AbortSignal | undefined
  resolve: (value: { data: GitHubRepo; rateLimit: null }) => void
  reject: (reason: unknown) => void
}

function deferredMock(): Deferred[] {
  const calls: Deferred[] = []
  getMock.mockImplementation(
    (params) =>
      new Promise((resolve, reject) => {
        calls.push({ signal: params.signal, resolve, reject })
      }),
  )
  return calls
}

let scope: EffectScope
function mountDetails() {
  scope = effectScope()
  return scope.run(() => useRepoDetails())!
}

beforeEach(() => {
  setActivePinia(createPinia())
  getMock.mockReset()
})

afterEach(() => {
  scope?.stop()
})

describe('useRepoDetails', () => {
  it('loads a repository', async () => {
    const calls = deferredMock()
    const d = mountDetails()

    void d.load('vuejs', 'vue')
    expect(d.loading.value).toBe(true)

    calls[0]!.resolve({ data: makeRepo(), rateLimit: null })
    await flushPromises()

    expect(d.repo.value?.full_name).toBe('vuejs/vue')
    expect(d.loading.value).toBe(false)
    expect(d.error.value).toBeNull()
  })

  it('surfaces an ApiError and leaves repo null', async () => {
    const calls = deferredMock()
    const d = mountDetails()

    void d.load('nope', 'nope')
    calls[0]!.reject(new ApiError('not-found', 'not found', { status: 404 }))
    await flushPromises()

    expect(d.error.value?.kind).toBe('not-found')
    expect(d.repo.value).toBeNull()
    expect(d.loading.value).toBe(false)
  })

  it('aborts the previous request when load is called again', async () => {
    const calls = deferredMock()
    const d = mountDetails()

    void d.load('a', 'b')
    void d.load('c', 'd')

    expect(calls).toHaveLength(2)
    expect(calls[0]!.signal?.aborted).toBe(true)

    // Only the newest result lands.
    calls[1]!.resolve({ data: makeRepo({ full_name: 'c/d' }), rateLimit: null })
    await flushPromises()
    expect(d.repo.value?.full_name).toBe('c/d')
  })

  it('ignores an AbortedError without setting error state', async () => {
    const calls = deferredMock()
    const d = mountDetails()

    void d.load('a', 'b')
    calls[0]!.reject(new AbortedError())
    await flushPromises()

    expect(d.error.value).toBeNull()
    expect(d.repo.value).toBeNull()
  })
})
