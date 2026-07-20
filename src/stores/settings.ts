import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TOKEN_KEY = 'gh-explorer:token'

/**
 * localStorage can throw (private mode, disabled storage, SSR). We never want a
 * storage hiccup to break the app, so reads/writes are wrapped and degrade to
 * an in-memory-only token for the session.
 */
function readStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistToken(value: string): void {
  try {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // ignore — token still lives in reactive state for this session
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const token = ref<string>(readStoredToken())

  const hasToken = computed(() => token.value.trim().length > 0)

  function setToken(value: string): void {
    token.value = value.trim()
    persistToken(token.value)
  }

  function clearToken(): void {
    token.value = ''
    persistToken('')
  }

  return {
    token,
    hasToken,
    setToken,
    clearToken,
  }
})
