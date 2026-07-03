import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

process.env.NODE_ENV = 'test';

expect.extend(matchers);

// jsdom does not implement ResizeObserver — polyfill for components that use it
// (e.g. @assistant-ui/react ThreadPrimitive.Viewport)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}