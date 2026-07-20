import { vi } from 'vitest'

// jsdom does not implement scrollTo; the router's scrollBehavior calls it during
// navigation. Stub it so tests don't emit "Not implemented" noise.
vi.stubGlobal('scrollTo', vi.fn())

// Vuetify's display/overlay utilities probe these browser APIs that jsdom lacks.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}
