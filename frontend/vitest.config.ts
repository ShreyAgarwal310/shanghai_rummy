import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: [
        'src/pages/GameTablePage.logic.ts',
        'src/services/accessibilityService.ts',
      ],
      reporter: ['text', 'html'],
    },
  },
})
