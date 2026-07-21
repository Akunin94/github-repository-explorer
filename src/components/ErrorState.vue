<script setup lang="ts">
import { computed, watch } from 'vue'
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

// Adding a token is the fix for a rate limit, so retry automatically the moment
// one is saved (from this screen's "Add token" or the header) — no second click.
watch(
  () => settings.hasToken,
  (hasToken, hadToken) => {
    if (hasToken && !hadToken && isRateLimit.value) emit('retry')
  },
)
const canAddToken = computed(() => isRateLimit.value && !settings.hasToken)

const resetText = computed(() => {
  const r = props.error.rateLimit
  return r ? formatRelativeDate(new Date(r.reset * 1000).toISOString()) : ''
})

const title = computed(() =>
  isRateLimit.value ? 'Rate limit reached' : 'Something went wrong',
)

// GitHub's unauthenticated limits differ per endpoint (search is ~10/min, the
// core API is 60/hour), so we avoid quoting a specific number here — it would be
// wrong on one of the two screens. We point at the fix (a token) and the reset
// time from the response instead.
const text = computed(() => {
  if (!isRateLimit.value) return props.error.message

  const resets = resetText.value ? ` The limit resets ${resetText.value}.` : ''
  if (!settings.hasToken) {
    return `You've hit GitHub's rate limit for unauthenticated requests. Add a personal access token for a much higher limit.${resets}`
  }
  return `Your requests are used up for now.${resets || ' Please try again shortly.'}`
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
