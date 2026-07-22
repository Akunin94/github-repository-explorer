import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import ErrorState from '@/components/ErrorState.vue'
import { ApiError } from '@/api/errors'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { mountWithApp } from './helpers/mount'

function rateLimitError(): ApiError {
  return new ApiError('rate-limit', 'GitHub API rate limit exceeded.', {
    status: 403,
    // Reset well in the future so the relative time is deterministic.
    rateLimit: { limit: 60, remaining: 0, reset: 4102444800 },
  })
}

function findButton(wrapper: ReturnType<typeof mountWithApp>, label: string) {
  return wrapper.findAll('button').find((b) => b.text().includes(label))
}

describe('ErrorState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('prompts to add a token when rate-limited without one', () => {
    const wrapper = mountWithApp(ErrorState, { props: { error: rateLimitError() } })
    expect(wrapper.text()).toContain('Rate limit reached')
    // Endpoint-agnostic wording — no hardcoded per-hour/per-minute number.
    expect(wrapper.text()).toContain('unauthenticated requests')
    expect(wrapper.text()).not.toMatch(/\d+\s*\/\s*hour/i)
    expect(findButton(wrapper, 'Add token')).toBeDefined()
  })

  it('opens the token dialog when Add token is clicked', async () => {
    const wrapper = mountWithApp(ErrorState, { props: { error: rateLimitError() } })
    const ui = useUiStore()
    expect(ui.tokenDialogOpen).toBe(false)
    await findButton(wrapper, 'Add token')!.trigger('click')
    expect(ui.tokenDialogOpen).toBe(true)
  })

  it('hides Add token and shows reset time when a token exists', async () => {
    const wrapper = mountWithApp(ErrorState, { props: { error: rateLimitError() } })
    const settings = useSettingsStore()
    settings.setToken('ghp_abc')
    await nextTick()
    expect(findButton(wrapper, 'Add token')).toBeUndefined()
    expect(wrapper.text()).toContain('resets')
  })

  it('shows the raw message for non-rate-limit errors', () => {
    const wrapper = mountWithApp(ErrorState, {
      props: {
        error: new ApiError('network', 'Network error — please check your connection.'),
      },
    })
    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.text()).toContain('Network error')
    expect(findButton(wrapper, 'Add token')).toBeUndefined()
  })

  it('emits retry when Try again is clicked', async () => {
    const wrapper = mountWithApp(ErrorState, { props: { error: rateLimitError() } })
    await findButton(wrapper, 'Try again')!.trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('auto-retries once a token is added while rate-limited', async () => {
    const wrapper = mountWithApp(ErrorState, { props: { error: rateLimitError() } })
    useSettingsStore().setToken('ghp_new')
    await nextTick()
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('does not auto-retry on token add for a non-rate-limit error', async () => {
    const wrapper = mountWithApp(ErrorState, {
      props: { error: new ApiError('network', 'Network error') },
    })
    useSettingsStore().setToken('ghp_new')
    await nextTick()
    expect(wrapper.emitted('retry')).toBeUndefined()
  })

  it('offers to update a rejected (expired) token', () => {
    const wrapper = mountWithApp(ErrorState, {
      props: {
        error: new ApiError('unauthorized', 'The provided token is invalid or expired.', {
          status: 401,
        }),
      },
    })
    expect(wrapper.text()).toContain('Token rejected')
    expect(findButton(wrapper, 'Update token')).toBeDefined()
  })

  it('auto-retries when the token changes after a rejection', async () => {
    const wrapper = mountWithApp(ErrorState, {
      props: { error: new ApiError('unauthorized', 'invalid', { status: 401 }) },
    })
    useSettingsStore().setToken('ghp_new')
    await nextTick()
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
