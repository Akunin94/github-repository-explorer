import { describe, it, expect } from 'vitest'
import { router } from '@/router'

// Smoke test: proves the Vitest harness runs and the router is wired with the
// hash history and a resolvable home route.
describe('router', () => {
  it('resolves "/" to the search route', () => {
    const resolved = router.resolve('/')
    expect(resolved.name).toBe('search')
  })

  it('redirects unknown paths to the search route', async () => {
    // resolve() does not follow redirects, so navigate to observe the fallback.
    await router.push('/does/not/exist')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('search')
  })
})
