import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import RateLimitIndicator from '@/components/RateLimitIndicator.vue'
import { useSettingsStore } from '@/stores/settings'
import { mountWithApp } from './helpers/mount'

describe('RateLimitIndicator', () => {
  it('renders nothing until a rate-limit snapshot exists', () => {
    const wrapper = mountWithApp(RateLimitIndicator)
    expect(wrapper.find('.v-chip').exists()).toBe(false)
  })

  it('shows remaining/limit once a snapshot is set', async () => {
    const wrapper = mountWithApp(RateLimitIndicator)
    useSettingsStore().setRateLimit({ limit: 30, remaining: 12, reset: 4102444800 })
    await nextTick()
    expect(wrapper.find('.v-chip').exists()).toBe(true)
    expect(wrapper.text()).toContain('12/30')
  })

  it('uses the error color when the limit is exhausted', async () => {
    const wrapper = mountWithApp(RateLimitIndicator)
    useSettingsStore().setRateLimit({ limit: 60, remaining: 0, reset: 4102444800 })
    await nextTick()
    expect(wrapper.html()).toContain('error')
  })
})
