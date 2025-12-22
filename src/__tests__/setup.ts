/**
 * Vitest Setup File
 * 
 * Configures the test environment with mocks and global utilities.
 * 
 * @created 2025-12-22
 */

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
    PROD: false,
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    VITE_SUPABASE_PROJECT_ID: 'test-project',
  },
});

// Clean up mocks between tests
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});


