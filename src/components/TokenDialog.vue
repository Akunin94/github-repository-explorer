<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiEye, mdiEyeOff, mdiOpenInNew } from '@mdi/js'
import { useSettingsStore } from '@/stores/settings'

const open = defineModel<boolean>({ required: true })
const settings = useSettingsStore()

const input = ref('')
const reveal = ref(false)

// Prefill with the stored token (and reset visibility) each time we open.
watch(open, (isOpen) => {
  if (isOpen) {
    input.value = settings.token
    reveal.value = false
  }
})

function save(): void {
  settings.setToken(input.value)
  open.value = false
}

function clear(): void {
  settings.clearToken()
  input.value = ''
  open.value = false
}
</script>

<template>
  <v-dialog v-model="open" max-width="540">
    <v-card rounded="lg">
      <v-card-title class="text-h6 pt-5">GitHub access token</v-card-title>

      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Unauthenticated requests are limited to 60 per hour. Adding a personal
          access token raises that to 5,000 per hour. A token with
          <strong>no scopes</strong> is enough to search public repositories.
        </p>

        <v-text-field
          v-model="input"
          :type="reveal ? 'text' : 'password'"
          :append-inner-icon="reveal ? mdiEyeOff : mdiEye"
          label="Personal access token"
          placeholder="ghp_…"
          autocomplete="off"
          spellcheck="false"
          hide-details
          @click:append-inner="reveal = !reveal"
          @keyup.enter="save"
        />

        <v-alert
          density="compact"
          variant="tonal"
          type="info"
          class="mt-4 text-body-2"
        >
          The token is stored only in this browser (localStorage) and is sent
          directly to GitHub — never to any other server.
        </v-alert>

        <a
          href="https://github.com/settings/tokens/new?description=Repo%20Explorer"
          target="_blank"
          rel="noopener noreferrer"
          class="d-inline-flex align-center ga-1 text-secondary text-body-2 text-decoration-none mt-3"
        >
          Create a token on GitHub
          <v-icon :icon="mdiOpenInNew" size="x-small" />
        </a>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn v-if="settings.hasToken" color="error" variant="text" @click="clear">
          Remove
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancel</v-btn>
        <v-btn color="secondary" variant="flat" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
