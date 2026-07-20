import { onScopeDispose, ref } from 'vue'
import { getRepository } from '@/api/github'
import { AbortedError, ApiError } from '@/api/errors'
import type { GitHubRepo } from '@/types/github'
import { useSettingsStore } from '@/stores/settings'

/**
 * Loads a single repository for the detail page. Each `load` cancels any
 * previous in-flight request so navigating quickly between repos never lands
 * stale data.
 */
export function useRepoDetails() {
  const settings = useSettingsStore()

  const repo = ref<GitHubRepo | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  let controller: AbortController | null = null

  async function load(owner: string, name: string): Promise<void> {
    if (controller) controller.abort()
    const local = new AbortController()
    controller = local
    loading.value = true
    error.value = null
    repo.value = null

    try {
      const { data, rateLimit } = await getRepository({
        owner,
        repo: name,
        token: settings.token || null,
        signal: local.signal,
      })
      if (local !== controller) return
      repo.value = data
      settings.setRateLimit(rateLimit)
    } catch (err) {
      if (err instanceof AbortedError) return
      if (local !== controller) return
      if (err instanceof ApiError) {
        error.value = err
        settings.setRateLimit(err.rateLimit)
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

  onScopeDispose(() => {
    if (controller) controller.abort()
  })

  return { repo, loading, error, load }
}
