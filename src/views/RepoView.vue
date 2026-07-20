<script setup lang="ts">
defineOptions({ name: 'RepoView' })
defineProps<{ owner: string; name: string }>()
</script>

<template>
  <section>
    <router-link to="/" class="text-secondary text-body-2 text-decoration-none">
      &larr; Back to search
    </router-link>
    <h1 class="text-h5 font-weight-bold mt-2">{{ owner }}/{{ name }}</h1>
    <p class="text-body-2 text-medium-emphasis">Repository detail coming in Stage 6.</p>
  </section>
</template>
