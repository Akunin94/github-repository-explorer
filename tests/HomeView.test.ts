import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ref } from 'vue'
import HomeView from '@/views/HomeView.vue'
import ErrorState from '@/components/ErrorState.vue'
import { ApiError } from '@/api/errors'
import type { GitHubRepo, SortOption } from '@/types/github'
import { mountWithApp } from './helpers/mount'
import { makeRepo } from './helpers/fixtures'

// Mock the search composable so we can render each UI state deterministically.
vi.mock('@/composables/useRepoSearch', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')
  const state = {
    query: ref(''),
    sort: ref<SortOption>('best-match'),
    page: ref(1),
    items: ref<GitHubRepo[]>([]),
    totalCount: ref(0),
    incompleteResults: ref(false),
    totalPages: ref(1),
    loading: ref(false),
    error: ref<ApiError | null>(null),
    isEmpty: ref(false),
    retry: vi.fn(),
  }
  return { useRepoSearch: () => state, _state: state }
})

import * as searchModule from '@/composables/useRepoSearch'
const s = (
  searchModule as unknown as {
    _state: {
      query: Ref<string>
      items: Ref<GitHubRepo[]>
      totalCount: Ref<number>
      incompleteResults: Ref<boolean>
      totalPages: Ref<number>
      loading: Ref<boolean>
      error: Ref<ApiError | null>
      isEmpty: Ref<boolean>
    }
  }
)._state

beforeEach(() => {
  s.query.value = ''
  s.items.value = []
  s.totalCount.value = 0
  s.incompleteResults.value = false
  s.totalPages.value = 1
  s.loading.value = false
  s.error.value = null
  s.isEmpty.value = false
})

describe('HomeView', () => {
  it('has a polite aria-live status region', () => {
    const wrapper = mountWithApp(HomeView)
    const status = wrapper.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.attributes('aria-live')).toBe('polite')
  })

  it('shows the idle prompt with no query', () => {
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.text()).toContain('Start typing to search')
    expect(wrapper.find('.repo-list').exists()).toBe(false)
  })

  it('shows skeletons while loading', () => {
    s.query.value = 'vue'
    s.loading.value = true
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.findAll('.v-skeleton-loader').length).toBe(5)
  })

  it('renders ErrorState on error', () => {
    s.query.value = 'vue'
    s.error.value = new ApiError('network', 'Network error')
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.findComponent(ErrorState).exists()).toBe(true)
  })

  it('shows the empty state when a search has no matches', () => {
    s.query.value = 'zzzznotarealrepo'
    s.isEmpty.value = true
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.text()).toContain('No repositories found')
  })

  it('renders results as a semantic list with a count', () => {
    s.query.value = 'vue'
    s.items.value = [makeRepo({ id: 1 }), makeRepo({ id: 2, full_name: 'nuxt/nuxt' })]
    s.totalCount.value = 2
    const wrapper = mountWithApp(HomeView)

    const list = wrapper.find('ul.repo-list')
    expect(list.attributes('role')).toBe('list')
    expect(list.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('2 repositories found')
  })

  it('surfaces the incomplete-results notice', () => {
    s.query.value = 'vue'
    s.items.value = [makeRepo()]
    s.totalCount.value = 1
    s.incompleteResults.value = true
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.text()).toContain('results may be incomplete')
  })
})
