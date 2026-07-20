<script setup lang="ts">
import { mdiGithub } from '@mdi/js'
// App shell: a Vuetify layout with a top bar and the routed view. Header actions
// (token dialog, rate-limit indicator) are added in Stage 7.
</script>

<template>
  <v-app>
    <v-app-bar flat border density="comfortable">
      <v-container class="d-flex align-center py-0">
        <router-link
          to="/"
          class="d-flex align-center ga-2 text-decoration-none text-high-emphasis"
        >
          <v-icon :icon="mdiGithub" />
          <span class="text-subtitle-1 font-weight-bold">Repo Explorer</span>
        </router-link>
      </v-container>
    </v-app-bar>

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
</style>
