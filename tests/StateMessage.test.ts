import { describe, it, expect } from 'vitest'
import { mdiMagnify } from '@mdi/js'
import StateMessage from '@/components/StateMessage.vue'
import { mountWithApp } from './helpers/mount'

describe('StateMessage', () => {
  it('renders title and text', () => {
    const wrapper = mountWithApp(StateMessage, {
      props: { icon: mdiMagnify, title: 'No results', text: 'Try again' },
    })
    expect(wrapper.text()).toContain('No results')
    expect(wrapper.text()).toContain('Try again')
  })

  it('omits the text paragraph when text is absent', () => {
    const wrapper = mountWithApp(StateMessage, {
      props: { icon: mdiMagnify, title: 'Idle' },
    })
    expect(wrapper.findAll('p')).toHaveLength(1)
  })

  it('renders slotted actions', () => {
    const wrapper = mountWithApp(StateMessage, {
      props: { icon: mdiMagnify, title: 'Error' },
      slots: { default: '<button class="act">Retry</button>' },
    })
    expect(wrapper.find('button.act').exists()).toBe(true)
  })
})
