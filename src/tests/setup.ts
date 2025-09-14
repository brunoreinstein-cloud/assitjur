import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Polyfill TextEncoder/TextDecoder for the testing environment
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// Clean up the DOM after each test to prevent test pollution
afterEach(() => {
  cleanup();
});
