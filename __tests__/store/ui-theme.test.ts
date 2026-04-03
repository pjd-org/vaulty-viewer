import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let useUIStore: typeof import('../../src/store/ui').useUIStore;
let THEME_STORAGE_KEY: string;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  const mod = await import('../../src/store/ui');
  useUIStore = mod.useUIStore;
  THEME_STORAGE_KEY = mod.THEME_STORAGE_KEY;
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('theme slice — state and localStorage contract', () => {
  it('defaults to "system" when localStorage is empty', () => {
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('setTheme("dark") updates state to "dark"', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('setTheme("light") updates state to "light"', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('setTheme("system") updates state to "system"', () => {
    useUIStore.getState().setTheme('dark');
    useUIStore.getState().setTheme('system');
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('setTheme("dark") writes to localStorage under THEME_STORAGE_KEY', () => {
    useUIStore.getState().setTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('setTheme("light") writes to localStorage under THEME_STORAGE_KEY', () => {
    useUIStore.getState().setTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('setTheme("system") writes to localStorage under THEME_STORAGE_KEY', () => {
    useUIStore.getState().setTheme('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('initializes from localStorage when value is present', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    const freshStore = mod.useUIStore;
    expect(freshStore.getState().theme).toBe('dark');
  });

  it('falls back to "system" when localStorage value is invalid', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-value');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    const freshStore = mod.useUIStore;
    expect(freshStore.getState().theme).toBe('system');
  });

  it('falls back to "system" when localStorage.getItem throws (SecurityError)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError');
    });
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    const freshStore = mod.useUIStore;
    expect(freshStore.getState().theme).toBe('system');
  });
});
