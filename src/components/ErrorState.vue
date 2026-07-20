<script setup lang="ts">
import { computed } from 'vue'
import { mdiAlertCircleOutline, mdiKeyOutline, mdiRefresh } from '@mdi/js'
import type { ApiError } from '@/api/errors'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { formatRelativeDate } from '@/utils/format'
import StateMessage from './StateMessage.vue'

const props = defineProps<{ error: ApiError }>()
const emit = defineEmits<{ retry: [] }>()

const settings = useSettingsStore()
const ui = useUiStore()

const isRateLimit = computed(() => props.error.kind === 'rate-limit')
const canAddToken = computed(() => isRateLimit.value && !settings.hasToken)

const resetText = computed(() => {
  const r = props.error.rateLimit
  return r ? formatRelativeDate(new Date(r.reset * 1000).toISOString()) : ''
})

const title = computed(() =>
  isRateLimit.value ? 'Rate limit reached' : 'Something went wrong',
)

const text = computed(() => {
  if (!isRateLimit.value) return props.error.message
  if (!settings.hasToken) {
    return "You've hit GitHub's 60 requests/hour limit for unauthenticated use. Add a personal access token to raise it to 5,000/hour."
  }
  return resetText.value
    ? `Your requests are used up for now — the limit resets ${resetText.value}.`
    : 'Your requests are used up for now. Please try again shortly.'
})
</script>

<template>
  <StateMessage :icon="mdiAlertCircleOutline" :title="title" :text="text">
    <div class="d-flex ga-2 justify-center flex-wrap">
      <v-btn
        v-if="canAddToken"
        color="secondary"
        variant="flat"
        :prepend-icon="mdiKeyOutline"
        @click="ui.openTokenDialog()"
      >
        Add token
      </v-btn>
      <v-btn variant="outlined" :prepend-icon="mdiRefresh" @click="emit('retry')">
        Try again
      </v-btn>
    </div>
  </StateMessage>
</template>
