import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/**', 'build/**', '**/*.d.ts', '**/*.test.ts', 'vitest.config.ts'],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
})
