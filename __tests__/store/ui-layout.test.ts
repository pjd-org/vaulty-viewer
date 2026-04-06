import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let useUIStore: typeof import('../../src/store/ui').useUIStore;
let DENSITY_STORAGE_KEY: string;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  const mod = await import('../../src/store/ui');
  useUIStore = mod.useUIStore;
  DENSITY_STORAGE_KEY = mod.DENSITY_STORAGE_KEY;
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('layout slice — density', () => {
  it('defaults to "comfortable" when localStorage is empty', () => {
    expect(useUIStore.getState().layout.density).toBe('comfortable');
  });

  it('setDensity("compact") updates state', () => {
    useUIStore.getState().setDensity('compact');
    expect(useUIStore.getState().layout.density).toBe('compact');
  });

  it('setDensity("spacious") updates state', () => {
    useUIStore.getState().setDensity('spacious');
    expect(useUIStore.getState().layout.density).toBe('spacious');
  });

  it('setDensity("comfortable") updates state', () => {
    useUIStore.getState().setDensity('compact');
    useUIStore.getState().setDensity('comfortable');
    expect(useUIStore.getState().layout.density).toBe('comfortable');
  });

  it('setDensity("compact") persists to localStorage under DENSITY_STORAGE_KEY', () => {
    useUIStore.getState().setDensity('compact');
    expect(localStorage.getItem(DENSITY_STORAGE_KEY)).toBe('compact');
  });

  it('setDensity("spacious") persists to localStorage under DENSITY_STORAGE_KEY', () => {
    useUIStore.getState().setDensity('spacious');
    expect(localStorage.getItem(DENSITY_STORAGE_KEY)).toBe('spacious');
  });

  it('initializes density from localStorage when value is valid', async () => {
    localStorage.setItem('vault-density', 'compact');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    expect(mod.useUIStore.getState().layout.density).toBe('compact');
  });

  it('falls back to "comfortable" when localStorage value is invalid', async () => {
    localStorage.setItem('vault-density', 'invalid');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    expect(mod.useUIStore.getState().layout.density).toBe('comfortable');
  });
});

describe('layout slice — sidebar', () => {
  it('defaults to expanded (leftSidebarCollapsed = false)', () => {
    expect(useUIStore.getState().layout.leftSidebarCollapsed).toBe(false);
  });

  it('toggleLeftSidebar collapses the sidebar', () => {
    useUIStore.getState().toggleLeftSidebar();
    expect(useUIStore.getState().layout.leftSidebarCollapsed).toBe(true);
  });

  it('toggleLeftSidebar toggles back to expanded', () => {
    useUIStore.getState().toggleLeftSidebar();
    useUIStore.getState().toggleLeftSidebar();
    expect(useUIStore.getState().layout.leftSidebarCollapsed).toBe(false);
  });
});
