/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/utils/**',
        'src/etl/synonyms.ts',
        'src/etl/listParser.ts',
        'src/engine/padroes/detectProvaEmprestada.ts',
        'src/engine/padroes/detectTriangulacao.ts',
        'src/lib/supabase.ts',
        'supabase/functions/_shared/logger.ts',
        'supabase/functions/get-processo/index.ts',
      ],
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
