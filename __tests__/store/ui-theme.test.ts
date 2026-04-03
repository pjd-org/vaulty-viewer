import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let useUIStore: typeof import('../../src/store/ui').useUIStore;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  const mod = await import('../../src/store/ui');
  useUIStore = mod.useUIStore;
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

  it('setTheme("dark") writes "dark" to localStorage', () => {
    useUIStore.getState().setTheme('dark');
    expect(localStorage.getItem('vault-theme')).toBe('dark');
  });

  it('setTheme("light") writes "light" to localStorage', () => {
    useUIStore.getState().setTheme('light');
    expect(localStorage.getItem('vault-theme')).toBe('light');
  });

  it('setTheme("system") writes "system" to localStorage', () => {
    useUIStore.getState().setTheme('system');
    expect(localStorage.getItem('vault-theme')).toBe('system');
  });

  it('initializes from localStorage when value is present', async () => {
    localStorage.setItem('vault-theme', 'dark');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    const freshStore = mod.useUIStore;
    expect(freshStore.getState().theme).toBe('dark');
  });

  it('falls back to "system" when localStorage value is invalid', async () => {
    localStorage.setItem('vault-theme', 'invalid-value');
    vi.resetModules();
    const mod = await import('../../src/store/ui');
    const freshStore = mod.useUIStore;
    expect(freshStore.getState().theme).toBe('system');
  });
});
