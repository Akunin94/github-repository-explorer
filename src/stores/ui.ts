import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Small store for shared UI state that several components need to control. */
export const useUiStore = defineStore('ui', () => {
  const tokenDialogOpen = ref(false)

  function openTokenDialog(): void {
    tokenDialogOpen.value = true
  }

  return { tokenDialogOpen, openTokenDialog }
})
