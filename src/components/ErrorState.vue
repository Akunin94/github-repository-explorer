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
// An expired or revoked token comes back as 401.
const isUnauthorized = computed(() => props.error.kind === 'unauthorized')

// Changing the token is the fix for both cases — adding one clears a rate limit,
// replacing/removing one clears a rejected token — so retry automatically the
// moment the token value changes (from this screen or the header), no extra click.
watch(
  () => settings.token,
  (token, previous) => {
    if (token !== previous && (isRateLimit.value || isUnauthorized.value)) {
      emit('retry')
    }
  },
)

// Which token action (if any) to offer, and how to label it.
const tokenAction = computed(() => {
  if (isUnauthorized.value) return 'Update token'
  if (isRateLimit.value && !settings.hasToken) return 'Add token'
  return null
})

const resetText = computed(() => {
  const r = props.error.rateLimit
  return r ? formatRelativeDate(new Date(r.reset * 1000).toISOString()) : ''
})

const title = computed(() => {
  if (isRateLimit.value) return 'Rate limit reached'
  if (isUnauthorized.value) return 'Token rejected'
  return 'Something went wrong'
})

// GitHub's unauthenticated limits differ per endpoint (search is ~10/min, the
// core API is 60/hour), so we avoid quoting a specific number here — it would be
// wrong on one of the two screens. We point at the fix (a token) and the reset
// time from the response instead.
const text = computed(() => {
  if (isUnauthorized.value) {
    return `${props.error.message} Update or remove it to continue.`
  }
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
        v-if="tokenAction"
        color="secondary"
        variant="flat"
        :prepend-icon="mdiKeyOutline"
        @click="ui.openTokenDialog()"
      >
        {{ tokenAction }}
      </v-btn>
      <v-btn variant="outlined" :prepend-icon="mdiRefresh" @click="emit('retry')">
        Try again
      </v-btn>
    </div>
  </StateMessage>
</template>
