<script setup lang="ts">
import { mdiSourceFork, mdiStar, mdiCircle } from '@mdi/js'
import type { GitHubRepo } from '@/types/github'
import { formatCount, formatRelativeDate, languageColor } from '@/utils/format'

defineProps<{ repo: GitHubRepo }>()
</script>

<template>
  <v-card border flat class="pa-4">
    <div class="d-flex flex-column ga-2">
      <div class="d-flex align-center ga-2 flex-wrap">
        <router-link
          :to="{ name: 'repo', params: { owner: repo.owner.login, name: repo.name } }"
          class="repo-name text-secondary text-subtitle-1 font-weight-bold text-decoration-none"
        >
          {{ repo.full_name }}
        </router-link>
        <v-chip v-if="repo.archived" size="x-small" color="warning" variant="tonal" label>
          Archived
        </v-chip>
      </div>

      <p v-if="repo.description" class="repo-description text-body-2 text-medium-emphasis mb-0">
        {{ repo.description }}
      </p>

      <div
        v-if="repo.topics?.length"
        class="d-flex ga-1 flex-wrap"
      >
        <v-chip
          v-for="topic in repo.topics.slice(0, 5)"
          :key="topic"
          size="x-small"
          color="secondary"
          variant="tonal"
          label
        >
          {{ topic }}
        </v-chip>
      </div>

      <div class="d-flex align-center ga-4 flex-wrap text-caption text-medium-emphasis">
        <span v-if="repo.language" class="d-flex align-center ga-1">
          <v-icon :icon="mdiCircle" :color="languageColor(repo.language)" size="10" />
          {{ repo.language }}
        </span>
        <span class="d-flex align-center ga-1">
          <v-icon :icon="mdiStar" size="x-small" />
          {{ formatCount(repo.stargazers_count) }}
        </span>
        <span class="d-flex align-center ga-1">
          <v-icon :icon="mdiSourceFork" size="x-small" />
          {{ formatCount(repo.forks_count) }}
        </span>
        <span>Updated {{ formatRelativeDate(repo.updated_at) }}</span>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
// Long repo slugs (e.g. deeply-nested-org/very-long-name) shouldn't force
// horizontal scroll on narrow screens.
.repo-name {
  overflow-wrap: anywhere;
}

// Clamp long descriptions to two lines so cards stay a predictable height.
.repo-description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
