import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    deps: {
      optimizer: {
        client: {
          enabled: true,
          include: [
            'react',
            'react-dom',
            '@testing-library/react',
            '@testing-library/user-event',
          ],
        },
      },
    },
    coverage: {
      provider: 'v8',
      exclude: [
        'src/components/ui/**', // shadcn/ui boilerplate, not application logic
        'src/app/**/page.tsx', // RSC server pages — not runnable in jsdom
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/sitemap.ts',
        'src/app/robots.ts',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
})
