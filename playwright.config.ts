import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: 'html',
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  },
});
