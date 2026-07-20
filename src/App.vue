<script setup lang="ts">
import { mdiGithub, mdiKeyVariant, mdiKeyOutline } from '@mdi/js'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import RateLimitIndicator from '@/components/RateLimitIndicator.vue'
import TokenDialog from '@/components/TokenDialog.vue'

// App shell: a Vuetify layout with a top bar and the routed view. The header
// carries the rate-limit indicator and the optional token dialog. The dialog's
// open state lives in the ui store so error screens can open it too.
const settings = useSettingsStore()
const ui = useUiStore()
</script>

<template>
  <v-app>
    <v-app-bar flat border density="comfortable">
      <v-container class="d-flex align-center ga-2 py-0">
        <router-link
          to="/"
          class="d-flex align-center ga-2 text-decoration-none text-high-emphasis"
        >
          <v-icon :icon="mdiGithub" />
          <span class="text-subtitle-1 font-weight-bold text-no-wrap">Repo Explorer</span>
        </router-link>

        <v-spacer />

        <RateLimitIndicator />

        <v-btn
          :prepend-icon="settings.hasToken ? mdiKeyVariant : mdiKeyOutline"
          :color="settings.hasToken ? 'success' : undefined"
          :aria-label="settings.hasToken ? 'Token added' : 'Add token'"
          variant="text"
          class="text-none token-btn"
          @click="ui.openTokenDialog()"
        >
          <!-- Label collapses to an icon-only button on narrow (xs) screens. -->
          <span class="d-none d-sm-inline">
            {{ settings.hasToken ? 'Token added' : 'Add token' }}
          </span>
        </v-btn>
      </v-container>
    </v-app-bar>

    <TokenDialog v-model="ui.tokenDialogOpen" />

    <v-main>
      <v-container class="page">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped lang="scss">
.page {
  max-width: 960px;
}

// Below Vuetify's `sm` breakpoint the token button label is hidden, so drop the
// icon's trailing gap to keep it a tidy icon-only button.
@media (max-width: 599.98px) {
  .token-btn :deep(.v-btn__prepend) {
    margin-inline-end: 0;
  }
}
</style>
