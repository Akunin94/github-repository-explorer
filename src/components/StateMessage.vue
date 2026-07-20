<script setup lang="ts">
defineProps<{ icon: string; title: string; text?: string }>()
</script>

<template>
  <div class="text-center py-12">
    <v-icon :icon="icon" size="48" class="text-disabled mb-3" />
    <p class="text-subtitle-1 mb-1">{{ title }}</p>
    <p v-if="text" class="text-body-2 text-medium-emphasis mb-4">{{ text }}</p>
    <slot />
  </div>
</template>
