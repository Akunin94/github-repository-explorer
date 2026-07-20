import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'search',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    // owner/name are captured as params and passed to the detail view as props.
    path: '/repo/:owner/:name',
    name: 'repo',
    component: () => import('@/views/RepoView.vue'),
    props: true,
  },
  // Unknown paths fall back to the search screen rather than a blank page.
  // Redirect to the path (not the named route) so the captured `pathMatch`
  // param isn't carried into a route that doesn't declare it (which warns).
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// Hash history is intentional: GitHub Pages is a static host with no server-side
// rewrites, so HTML5 history mode would 404 on refresh / direct deep links.
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
