import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'search',
    component: () => import('@/views/HomeView.vue'),
  },
  // Unknown paths fall back to the search screen rather than a blank page.
  { path: '/:pathMatch(.*)*', redirect: { name: 'search' } },
]

// Hash history is intentional: GitHub Pages is a static host with no server-side
// rewrites, so HTML5 history mode would 404 on refresh / direct deep links.
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
