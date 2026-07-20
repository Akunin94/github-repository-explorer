<script setup lang="ts">
import { computed } from 'vue'
import { mdiSpeedometer } from '@mdi/js'
import { useSettingsStore } from '@/stores/settings'
import { formatRelativeDate } from '@/utils/format'

const settings = useSettingsStore()
const rateLimit = computed(() => settings.rateLimit)

// Neutral until it gets tight; amber under 15% left; red when exhausted.
const color = computed(() => {
  const r = rateLimit.value
  if (!r) return undefined
  if (r.remaining === 0) return 'error'
  if (r.remaining <= r.limit * 0.15) return 'warning'
  return undefined
})

const resetText = computed(() => {
  const r = rateLimit.value
  if (!r) return ''
  return formatRelativeDate(new Date(r.reset * 1000).toISOString())
})
</script>

<template>
  <v-tooltip v-if="rateLimit" location="bottom" text="">
    <template #activator="{ props }">
      <v-chip
        v-bind="props"
        size="small"
        variant="tonal"
        :color="color"
        :prepend-icon="mdiSpeedometer"
      >
        {{ rateLimit.remaining }}/{{ rateLimit.limit }}
      </v-chip>
    </template>
    <span>API requests left this hour · resets {{ resetText }}</span>
  </v-tooltip>
</template>
