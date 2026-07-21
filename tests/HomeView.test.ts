import { describe, it, expect } from 'vitest'
import HomeView from '@/views/HomeView.vue'
import { mountWithApp } from './helpers/mount'

describe('HomeView', () => {
  it('renders a polite aria-live status region for screen readers', () => {
    const wrapper = mountWithApp(HomeView)
    const status = wrapper.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.attributes('aria-live')).toBe('polite')
    // Idle: nothing to announce yet.
    expect(status.text()).toBe('')
  })

  it('starts idle with no result list rendered', () => {
    const wrapper = mountWithApp(HomeView)
    expect(wrapper.find('.repo-list').exists()).toBe(false)
    expect(wrapper.text()).toContain('Start typing to search')
  })
})
