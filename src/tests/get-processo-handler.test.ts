 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/src/tests/get-processo-handler.test.ts
index 0000000000000000000000000000000000000000..6ab45b0f28bacf53231a74552c08571d0cfb7c5e 100644
--- a//dev/null
+++ b/src/tests/get-processo-handler.test.ts
@@ -0,0 +1,48 @@
+import { describe, it, expect, beforeEach, vi } from 'vitest';
+
+vi.mock('@/integrations/supabase/client', () => {
+  return {
+    supabase: {
+      functions: { invoke: vi.fn() },
+      auth: {},
+    },
+  };
+});
+
+import { supabase } from '@/integrations/supabase/client';
+import { fetchPorProcesso } from '@/lib/supabase';
+
+const invokeMock = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;
+
+describe('get-processo handler', () => {
+  const params = { page: 1, pageSize: 10, filters: {} as any };
+
+  beforeEach(() => {
+    invokeMock.mockReset();
+  });
+
+  it('returns data on 200', async () => {
+    invokeMock.mockResolvedValue({ data: { data: [{ cnj: '1' }], count: 1 }, error: null });
+    const result = await fetchPorProcesso(params);
+    expect(result.total).toBe(1);
+    expect(result.data).toHaveLength(1);
+  });
+
+  it('falls back on 401', async () => {
+    invokeMock.mockResolvedValue({ data: null, error: { status: 401 } });
+    const result = await fetchPorProcesso(params);
+    expect(result.total).toBeGreaterThan(0);
+  });
+
+  it('falls back on 404', async () => {
+    invokeMock.mockResolvedValue({ data: null, error: { status: 404 } });
+    const result = await fetchPorProcesso(params);
+    expect(result.total).toBeGreaterThan(0);
+  });
+
+  it('falls back on 500', async () => {
+    invokeMock.mockResolvedValue({ data: null, error: { status: 500 } });
+    const result = await fetchPorProcesso(params);
+    expect(result.total).toBeGreaterThan(0);
+  });
+});
 
EOF
)