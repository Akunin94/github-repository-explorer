<script setup lang="ts">
import { computed } from 'vue'
import { mdiMagnify, mdiSourceRepositoryMultiple } from '@mdi/js'
import { useRepoSearch } from '@/composables/useRepoSearch'
import RepoListItem from '@/components/RepoListItem.vue'
import StateMessage from '@/components/StateMessage.vue'
import ErrorState from '@/components/ErrorState.vue'
import { MAX_SEARCH_RESULTS } from '@/api/github'
import { formatNumber } from '@/utils/format'
import type { SortOption } from '@/types/github'

defineOptions({ name: 'SearchView' })

const { query, sort, page, items, totalCount, totalPages, loading, error, isEmpty, retry } =
  useRepoSearch()

const sortOptions: { title: string; value: SortOption }[] = [
  { title: 'Best match', value: 'best-match' },
  { title: 'Most stars', value: 'stars' },
  { title: 'Most forks', value: 'forks' },
  { title: 'Recently updated', value: 'updated' },
]

// `clearable` emits null when cleared; coerce back to an empty string so the
// composable only ever sees a string.
const queryModel = computed<string>({
  get: () => query.value,
  set: (value) => {
    query.value = value ?? ''
  },
})

const idle = computed(() => query.value.trim() === '')
const capped = computed(() => totalCount.value > MAX_SEARCH_RESULTS)

// Pagination changes `page` without a route change, so the router's
// scroll-to-top doesn't fire. Bring the user back to the top of the results
// (and the pager) when they jump to another page.
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <section>
    <h1 class="text-h5 font-weight-bold mb-1">Search GitHub repositories</h1>
    <p class="text-body-2 text-medium-emphasis mb-5">
      Find repositories by name, topic, or keyword.
    </p>

    <div class="d-flex ga-3 flex-column flex-sm-row">
      <v-text-field
        v-model="queryModel"
        :prepend-inner-icon="mdiMagnify"
        placeholder="e.g. vue router, tensorflow, machine learning"
        label="Search"
        clearable
        hide-details
        autofocus
        class="flex-grow-1"
      />
      <v-select
        v-model="sort"
        :items="sortOptions"
        label="Sort by"
        hide-details
        variant="outlined"
        density="comfortable"
        class="sort-select"
      />
    </div>

    <!-- Result meta -->
    <div
      v-if="!idle && !loading && !error && items.length"
      class="text-body-2 text-medium-emphasis mt-4"
    >
      {{ formatNumber(totalCount) }} repositories found
      <span v-if="capped">— showing the first {{ formatNumber(MAX_SEARCH_RESULTS) }}</span>
    </div>

    <div class="mt-4">
      <!-- Loading -->
      <template v-if="loading">
        <v-skeleton-loader
          v-for="n in 5"
          :key="n"
          type="article"
          class="mb-3 rounded-lg border"
        />
      </template>

      <!-- Error -->
      <ErrorState v-else-if="error" :error="error" @retry="retry" />

      <!-- Idle -->
      <StateMessage
        v-else-if="idle"
        :icon="mdiSourceRepositoryMultiple"
        title="Start typing to search"
        text="Results appear as you type."
      />

      <!-- Empty -->
      <StateMessage
        v-else-if="isEmpty"
        :icon="mdiMagnify"
        title="No repositories found"
        :text="`Nothing matched “${query.trim()}”. Try different keywords.`"
      />

      <!-- Results -->
      <template v-else>
        <div class="d-flex flex-column ga-3">
          <RepoListItem v-for="repo in items" :key="repo.id" :repo="repo" />
        </div>

        <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
          <v-pagination
            v-model="page"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
            rounded="lg"
            @update:model-value="scrollToTop"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
@media (min-width: 600px) {
  .sort-select {
    flex: 0 0 210px;
  }
}
</style>
