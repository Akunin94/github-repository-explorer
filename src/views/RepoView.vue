<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  mdiAlertCircleOutline,
  mdiArrowLeft,
  mdiCircle,
  mdiOpenInNew,
  mdiScaleBalance,
  mdiSourceBranch,
  mdiSourceFork,
  mdiStar,
  mdiWeb,
  mdiEyeOutline,
} from '@mdi/js'
import { useRepoDetails } from '@/composables/useRepoDetails'
import StateMessage from '@/components/StateMessage.vue'
import ErrorState from '@/components/ErrorState.vue'
import { formatNumber, formatRelativeDate, languageColor } from '@/utils/format'

defineOptions({ name: 'RepoView' })

const props = defineProps<{ owner: string; name: string }>()

const router = useRouter()

// Prefer a real history "back" so the kept-alive search page restores its query,
// pagination and scroll. Fall back to a plain push when the detail page was
// opened directly (deep link / refresh), where there's nothing to go back to.
function goBack(): void {
  if (router.options.history.state.back) {
    router.back()
  } else {
    void router.push({ name: 'search' })
  }
}

const { repo, loading, error, load } = useRepoDetails()

// Reload whenever the route params change (navigating between repos).
watch(
  () => [props.owner, props.name] as const,
  ([owner, name]) => void load(owner, name),
  { immediate: true },
)

const stats = computed(() => {
  const r = repo.value
  if (!r) return []
  return [
    { icon: mdiStar, label: 'Stars', value: formatNumber(r.stargazers_count) },
    { icon: mdiSourceFork, label: 'Forks', value: formatNumber(r.forks_count) },
    // `subscribers_count` is the real watcher count; `watchers_count` is just a
    // stars alias (GitHub legacy). Fall back only if the field is ever absent.
    {
      icon: mdiEyeOutline,
      label: 'Watchers',
      value: formatNumber(r.subscribers_count ?? r.watchers_count),
    },
    { icon: mdiAlertCircleOutline, label: 'Open issues', value: formatNumber(r.open_issues_count) },
  ]
})

const isNotFound = computed(() => error.value?.kind === 'not-found')
</script>

<template>
  <section>
    <a
      class="back-link d-inline-flex align-center ga-1 text-secondary text-body-2 text-decoration-none mb-4"
      role="button"
      tabindex="0"
      @click="goBack"
      @keydown.enter="goBack"
    >
      <v-icon :icon="mdiArrowLeft" size="small" />
      Back to search
    </a>

    <!-- Loading -->
    <template v-if="loading">
      <v-skeleton-loader type="article, list-item-three-line" class="border rounded-lg" />
    </template>

    <!-- Not found -->
    <StateMessage
      v-else-if="isNotFound"
      :icon="mdiAlertCircleOutline"
      title="Repository not found"
      :text="`${props.owner}/${props.name} doesn't exist or is private.`"
    >
      <v-btn color="secondary" variant="flat" @click="goBack">Back to search</v-btn>
    </StateMessage>

    <!-- Other errors (rate limit, network, …) -->
    <ErrorState v-else-if="error" :error="error" @retry="load(props.owner, props.name)" />

    <!-- Loaded -->
    <template v-else-if="repo">
      <div class="d-flex ga-4 align-start flex-wrap">
        <v-avatar size="56" rounded="lg">
          <v-img :src="repo.owner.avatar_url" :alt="repo.owner.login" />
        </v-avatar>

        <div class="flex-grow-1" style="min-width: 240px">
          <div class="d-flex align-center ga-2 flex-wrap">
            <h1 class="wrap-anywhere text-h5 font-weight-bold">
              <a
                :href="repo.owner.html_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-medium-emphasis text-decoration-none"
              >{{ repo.owner.login }}</a>
              <span class="text-medium-emphasis">/</span>
              <span>{{ repo.name }}</span>
            </h1>
            <v-chip v-if="repo.fork" size="small" variant="tonal" label>Fork</v-chip>
            <v-chip v-if="repo.archived" size="small" color="warning" variant="tonal" label>
              Archived
            </v-chip>
          </div>

          <p v-if="repo.description" class="wrap-anywhere text-body-1 text-medium-emphasis mt-2 mb-0">
            {{ repo.description }}
          </p>

          <div class="d-flex ga-2 flex-wrap mt-4">
            <v-btn
              :href="repo.html_url"
              target="_blank"
              rel="noopener noreferrer"
              color="secondary"
              variant="flat"
              :append-icon="mdiOpenInNew"
            >
              View on GitHub
            </v-btn>
            <v-btn
              v-if="repo.homepage"
              :href="repo.homepage"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              :prepend-icon="mdiWeb"
            >
              Homepage
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <v-row class="mt-2">
        <v-col v-for="stat in stats" :key="stat.label" cols="6" sm="3">
          <v-card border flat class="pa-3 text-center h-100">
            <v-icon :icon="stat.icon" class="text-medium-emphasis mb-1" />
            <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Meta -->
      <v-card border flat class="pa-4 mt-4">
        <div class="d-flex flex-column ga-3">
          <div class="d-flex align-center ga-6 flex-wrap text-body-2">
            <span v-if="repo.language" class="d-flex align-center ga-2">
              <v-icon :icon="mdiCircle" :color="languageColor(repo.language)" size="12" />
              {{ repo.language }}
            </span>
            <span v-if="repo.license" class="d-flex align-center ga-2 text-medium-emphasis">
              <v-icon :icon="mdiScaleBalance" size="small" />
              {{ repo.license.name }}
            </span>
            <span class="d-flex align-center ga-2 text-medium-emphasis">
              <v-icon :icon="mdiSourceBranch" size="small" />
              {{ repo.default_branch }}
            </span>
          </div>

          <div class="text-caption text-medium-emphasis">
            Created {{ formatRelativeDate(repo.created_at) }} ·
            Updated {{ formatRelativeDate(repo.updated_at) }} ·
            Last push {{ formatRelativeDate(repo.pushed_at) }}
          </div>

          <div v-if="repo.topics?.length" class="d-flex ga-1 flex-wrap">
            <v-chip
              v-for="topic in repo.topics"
              :key="topic"
              size="small"
              color="secondary"
              variant="tonal"
              label
            >
              {{ topic }}
            </v-chip>
          </div>
        </div>
      </v-card>
    </template>
  </section>
</template>

<style scoped lang="scss">
// Guard against long names/descriptions forcing horizontal scroll on mobile.
.wrap-anywhere {
  overflow-wrap: anywhere;
}

.back-link {
  cursor: pointer;
}
</style>
