import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
<<<<<<< HEAD
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}'
    ],
=======
    include: ['tests/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '__tests__/',
        '.next/',
        'coverage/',
        'build/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/next.config.*',
        '**/tailwind.config.*',
        '**/postcss.config.*',
        '**/prettier.config.*',
        '**/.eslintrc.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
>>>>>>> 1ea0bf1460b06f35881d3beda01b924b281db04c
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
