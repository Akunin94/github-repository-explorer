import { computed, onScopeDispose, ref, watch } from 'vue'
import { MAX_SEARCH_RESULTS, PER_PAGE, searchRepositories } from '@/api/github'
import { AbortedError, ApiError } from '@/api/errors'
import type { GitHubRepo, SortOption } from '@/types/github'
import { useSettingsStore } from '@/stores/settings'

const DEFAULT_DEBOUNCE_MS = 400

export interface UseRepoSearchOptions {
  /** Debounce applied to query typing. Set to 0 in tests for determinism. */
  debounceMs?: number
}

/**
 * Owns the search lifecycle for the results page: debounced query input,
 * cancellation of superseded requests, and pagination bounded by GitHub's
 * 1000-result search window. Sort and page changes fire immediately (they are
 * deliberate clicks); only free-text typing is debounced.
 */
export function useRepoSearch(options: UseRepoSearchOptions = {}) {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const settings = useSettingsStore()

  const query = ref('')
  const sort = ref<SortOption>('best-match')
  const page = ref(1)

  const items = ref<GitHubRepo[]>([])
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null
  /** Set when we programmatically reset page, so the page watcher skips it. */
  let suppressPageWatch = false

  const trimmedQuery = computed(() => query.value.trim())

  /** GitHub only serves the first 1000 results, so cap the page count there. */
  const totalPages = computed(() => {
    const reachable = Math.min(totalCount.value, MAX_SEARCH_RESULTS)
    return Math.max(1, Math.ceil(reachable / PER_PAGE))
  })

  const hasResults = computed(() => items.value.length > 0)
  const isEmpty = computed(
    () =>
      !loading.value &&
      error.value === null &&
      trimmedQuery.value !== '' &&
      items.value.length === 0,
  )

  function cancelInflight(): void {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  function clearResults(): void {
    items.value = []
    totalCount.value = 0
  }

  async function run(): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }

    if (trimmedQuery.value === '') {
      cancelInflight()
      clearResults()
      error.value = null
      loading.value = false
      return
    }

    cancelInflight()
    const local = new AbortController()
    controller = local
    loading.value = true
    error.value = null

    try {
      const { data, rateLimit } = await searchRepositories({
        query: trimmedQuery.value,
        sort: sort.value,
        page: page.value,
        token: settings.token || null,
        signal: local.signal,
      })
      if (local !== controller) return // superseded while awaiting
      items.value = data.items
      totalCount.value = data.total_count
      settings.setRateLimit(rateLimit)
    } catch (err) {
      if (err instanceof AbortedError) return
      if (local !== controller) return
      if (err instanceof ApiError) {
        error.value = err
        settings.setRateLimit(err.rateLimit)
        clearResults()
      } else {
        throw err
      }
    } finally {
      if (local === controller) {
        loading.value = false
        controller = null
      }
    }
  }

  function scheduleRun(): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      void run()
    }, debounceMs)
  }

  function resetPage(): void {
    if (page.value !== 1) {
      suppressPageWatch = true
      page.value = 1
    }
  }

  // Typing: reset to page 1 and debounce the request. Enter the loading state
  // immediately so the "no results" message can't flash during the debounce
  // window (before the request has even been sent).
  watch(trimmedQuery, (q) => {
    resetPage()
    if (q === '') {
      void run() // empty query: clear synchronously, no spinner
      return
    }
    loading.value = true
    error.value = null
    scheduleRun()
  })

  // Sort: deliberate action — reset page and fetch immediately.
  watch(sort, () => {
    resetPage()
    void run()
  })

  // Pagination: fetch immediately, unless the change came from a reset above.
  watch(page, () => {
    if (suppressPageWatch) {
      suppressPageWatch = false
      return
    }
    void run()
  })

  /** Re-run the current search (e.g. a "Retry" button after an error). */
  function retry(): void {
    void run()
  }

  onScopeDispose(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    cancelInflight()
  })

  return {
    // inputs
    query,
    sort,
    page,
    // outputs
    items,
    totalCount,
    loading,
    error,
    totalPages,
    hasResults,
    isEmpty,
    // actions
    retry,
  }
}
