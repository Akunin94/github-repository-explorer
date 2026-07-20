import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { vuetify } from '@/plugins/vuetify'
import { router } from '@/router'

/**
 * Mount a component with the app's Vuetify instance, a fresh (active) Pinia, and
 * the real router so `router-link` resolves. Returns the wrapper; tests can read
 * or seed stores via `useXStore()` since the created Pinia is set active.
 */
export function mountWithApp<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(component, {
    ...options,
    global: {
      plugins: [vuetify, pinia, router],
      ...(options.global ?? {}),
    },
  })
}
