import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import TokenDialog from '@/components/TokenDialog.vue'
import { useSettingsStore } from '@/stores/settings'
import { mountWithApp } from './helpers/mount'

// Stub VDialog so its content renders inline (Vuetify normally teleports it to
// <body>), letting us query the field and buttons directly.
const stubs = { VDialog: { template: '<div><slot /></div>' } }

function findButton(wrapper: ReturnType<typeof mountWithApp>, label: string) {
  return wrapper.findAll('button').find((b) => b.text().includes(label))
}

describe('TokenDialog', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves a typed token to the store', async () => {
    const wrapper = mountWithApp(TokenDialog, {
      props: { modelValue: true },
      global: { stubs },
    })

    await wrapper.find('input').setValue('ghp_secret')
    await findButton(wrapper, 'Save')!.trigger('click')

    expect(useSettingsStore().token).toBe('ghp_secret')
    expect(localStorage.getItem('gh-explorer:token')).toBe('ghp_secret')
  })

  it('shows Remove only when a token exists and clears it', async () => {
    const wrapper = mountWithApp(TokenDialog, {
      props: { modelValue: true },
      global: { stubs },
    })
    const settings = useSettingsStore()

    // No token yet -> no Remove button.
    expect(findButton(wrapper, 'Remove')).toBeUndefined()

    settings.setToken('ghp_existing')
    await nextTick()

    const remove = findButton(wrapper, 'Remove')
    expect(remove).toBeDefined()
    await remove!.trigger('click')

    expect(settings.token).toBe('')
    expect(localStorage.getItem('gh-explorer:token')).toBeNull()
  })
})
