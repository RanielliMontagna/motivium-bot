import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.*', 'src/**/*.spec.*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/**', 'build/**', '**/*.d.ts', '**/*.test.ts', 'vitest.config.ts'],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  plugins: [tsconfigPaths()],
})
