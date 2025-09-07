 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/vitest.config.ts b/vitest.config.ts
index 735f8a47a3c8a028361486fc8cb3b459bc8d37d1..b7952763be2be71ef0837eff4b8a94cfccb3796b 100644
--- a/vitest.config.ts
+++ b/vitest.config.ts
@@ -1,19 +1,27 @@
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
+    coverage: {
+      provider: 'v8',
+      reporter: ['text', 'html'],
+      lines: 80,
+      branches: 80,
+      functions: 80,
+      statements: 80,
+    },
   },
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   },
-});
+});
 
EOF
)