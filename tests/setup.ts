import { vi } from 'vitest'

// jsdom does not implement scrollTo; the router's scrollBehavior calls it during
// navigation. Stub it so tests don't emit "Not implemented" noise.
vi.stubGlobal('scrollTo', vi.fn())
