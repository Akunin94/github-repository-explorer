import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts empty when nothing is stored', () => {
    const store = useSettingsStore()
    expect(store.token).toBe('')
    expect(store.hasToken).toBe(false)
    expect(store.rateLimit).toBeNull()
  })

  it('hydrates the token from localStorage', () => {
    localStorage.setItem('gh-explorer:token', 'ghp_stored')
    const store = useSettingsStore()
    expect(store.token).toBe('ghp_stored')
    expect(store.hasToken).toBe(true)
  })

  it('trims and persists the token on set', () => {
    const store = useSettingsStore()
    store.setToken('  ghp_abc  ')
    expect(store.token).toBe('ghp_abc')
    expect(localStorage.getItem('gh-explorer:token')).toBe('ghp_abc')
  })

  it('clears the token from state and storage', () => {
    const store = useSettingsStore()
    store.setToken('ghp_abc')
    store.clearToken()
    expect(store.token).toBe('')
    expect(store.hasToken).toBe(false)
    expect(localStorage.getItem('gh-explorer:token')).toBeNull()
  })

  it('stores rate-limit snapshots but ignores null', () => {
    const store = useSettingsStore()
    store.setRateLimit({ limit: 60, remaining: 10, reset: 123 })
    expect(store.rateLimit).toEqual({ limit: 60, remaining: 10, reset: 123 })
    store.setRateLimit(null)
    expect(store.rateLimit).toEqual({ limit: 60, remaining: 10, reset: 123 })
  })

  it('flags exhaustion via isRateLimited', () => {
    const store = useSettingsStore()
    store.setRateLimit({ limit: 60, remaining: 5, reset: 123 })
    expect(store.isRateLimited).toBe(false)
    store.setRateLimit({ limit: 60, remaining: 0, reset: 123 })
    expect(store.isRateLimited).toBe(true)
  })

  it('survives localStorage throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const store = useSettingsStore()
    expect(() => store.setToken('ghp_abc')).not.toThrow()
    expect(store.token).toBe('ghp_abc') // still in memory for the session
    spy.mockRestore()
  })
})
