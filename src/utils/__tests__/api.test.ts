import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { getApiBase } from "../api";

const originalEnv = { ...process.env };
const originalWindow = globalThis.window;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  // Reset window each test
  // @ts-ignore
  delete globalThis.window;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.window = originalWindow;
});

describe("getApiBase", () => {
  it("prefers GATSBY_TASKER_API_URL and trims trailing slash", async () => {
    process.env.GATSBY_TASKER_API_URL = "http://api.example.com/";
    const { getApiBase: freshGetApiBase } = await import("../api");
    expect(freshGetApiBase()).toBe("http://api.example.com");
  });

  it("uses window.TASKER_API_URL when set", async () => {
    // @ts-ignore
    globalThis.window = { TASKER_API_URL: "http://pod-api:4300/" };
    const { getApiBase: freshGetApiBase } = await import("../api");
    expect(freshGetApiBase()).toBe("http://pod-api:4300");
  });

  it("falls back to window.VIEWER_CONFIG.apiUrl", async () => {
    // @ts-ignore
    globalThis.window = { VIEWER_CONFIG: { apiUrl: "http://from-config:9999/" } };
    const { getApiBase: freshGetApiBase } = await import("../api");
    expect(freshGetApiBase()).toBe("http://from-config:9999");
  });

  it("returns empty string by default (same-origin /api expected)", async () => {
    const { getApiBase: freshGetApiBase } = await import("../api");
    expect(freshGetApiBase()).toBe("");
  });
});
