import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalWindow = globalThis.window

beforeEach(() => {
  vi.resetModules()
  delete globalThis.window
})

afterEach(() => {
  globalThis.window = originalWindow
})

describe('query client helpers', () => {
  it('creates isolated query clients per call', async () => {
    const { createQueryClient } = await import('../src/query-client')

    expect(createQueryClient()).not.toBe(createQueryClient())
  })

  it('reuses a singleton browser query client', async () => {
    globalThis.window = {} as Window & typeof globalThis
    const { getBrowserQueryClient } = await import('../src/query-client')

    expect(getBrowserQueryClient()).toBe(getBrowserQueryClient())
  })

  it('serializes dehydrated query state safely for inline scripts', async () => {
    const { serializeDehydratedQueryState } = await import('../src/query-client')

    expect(
      serializeDehydratedQueryState({
        queries: [],
        mutations: [],
        meta: { tag: '</script><script>alert(1)</script>' },
      } as never),
    ).not.toContain('</script>')
  })

  it('reads and clears browser dehydrated state', async () => {
    globalThis.window = {
      __VIEWER_DEHYDRATED_STATE__: { queries: [{ queryKey: ['x'] }], mutations: [] },
    } as Window & typeof globalThis

    const { readDehydratedQueryState } = await import('../src/query-client')

    expect(readDehydratedQueryState()).toEqual({
      queries: [{ queryKey: ['x'] }],
      mutations: [],
    })
    expect(window.__VIEWER_DEHYDRATED_STATE__).toBeUndefined()
  })

  it('seeds browser dehydrated state for the first client render', async () => {
    globalThis.window = {} as Window & typeof globalThis

    const {
      getBrowserDehydratedStateForRender,
      setBrowserDehydratedStateForRender,
    } = await import('../src/query-client')

    const state = { queries: [{ queryKey: ['x'] }], mutations: [] }
    setBrowserDehydratedStateForRender(state)

    expect(getBrowserDehydratedStateForRender()).toBe(state)
  })
})
