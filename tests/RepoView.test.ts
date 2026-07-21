import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import RepoView from '@/views/RepoView.vue'
import ErrorState from '@/components/ErrorState.vue'
import type { GitHubRepo } from '@/types/github'
import { ApiError } from '@/api/errors'
import { mountWithApp } from './helpers/mount'
import { makeRepo } from './helpers/fixtures'

// Mock the data composable so we can render RepoView against a fixed repo.
vi.mock('@/composables/useRepoDetails', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')
  const repo = ref<GitHubRepo | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  return {
    useRepoDetails: () => ({ repo, loading, error, load: vi.fn() }),
    _mock: { repo, loading, error },
  }
})

import * as repoDetails from '@/composables/useRepoDetails'
const mock = (
  repoDetails as unknown as {
    _mock: {
      repo: Ref<GitHubRepo | null>
      loading: Ref<boolean>
      error: Ref<ApiError | null>
    }
  }
)._mock

beforeEach(() => {
  mock.repo.value = null
  mock.loading.value = false
  mock.error.value = null
})

describe('RepoView', () => {
  it('shows the real watcher count (subscribers_count), not the stars alias', () => {
    mock.repo.value = makeRepo({
      stargazers_count: 9999,
      watchers_count: 9999, // GitHub's misleading alias of stars
      subscribers_count: 42, // the true watcher count
    })

    const wrapper = mountWithApp(RepoView, { props: { owner: 'vuejs', name: 'vue' } })

    const tiles = wrapper.findAll('.v-card')
    const watchers = tiles.find((c) => c.text().includes('Watchers'))
    expect(watchers?.text()).toContain('42')
    expect(watchers?.text()).not.toContain('9,999')
  })

  it('shows a skeleton while loading', () => {
    mock.loading.value = true
    const wrapper = mountWithApp(RepoView, { props: { owner: 'vuejs', name: 'vue' } })
    expect(wrapper.find('.v-skeleton-loader').exists()).toBe(true)
  })

  it('shows a dedicated not-found state on 404', () => {
    mock.error.value = new ApiError('not-found', 'not found', { status: 404 })
    const wrapper = mountWithApp(RepoView, { props: { owner: 'ghost', name: 'nope' } })
    expect(wrapper.text()).toContain('Repository not found')
    expect(wrapper.text()).toContain('ghost/nope')
  })

  it('renders ErrorState for non-404 errors', () => {
    mock.error.value = new ApiError('network', 'Network error')
    const wrapper = mountWithApp(RepoView, { props: { owner: 'vuejs', name: 'vue' } })
    expect(wrapper.findComponent(ErrorState).exists()).toBe(true)
  })
})
