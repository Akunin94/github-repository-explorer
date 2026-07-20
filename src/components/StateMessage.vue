<script setup lang="ts">
defineProps<{ icon: string; title: string; text?: string }>()
</script>

<template>
  <div class="state-message text-center py-12 mx-auto">
    <v-icon :icon="icon" size="48" class="text-disabled mb-3" />
    <p class="text-subtitle-1 mb-1">{{ title }}</p>
    <p v-if="text" class="text-body-2 text-medium-emphasis mb-4">{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.state-message {
  max-width: 420px;
  // A long echoed value (e.g. the search query) must wrap, not overflow.
  overflow-wrap: anywhere;
}
</style>
