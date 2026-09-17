import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Samakan dengan alias tsconfig supaya modul yang memakai '@/…' bisa
      // diuji tanpa build Next.js.
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    environment: 'node',
  },
});