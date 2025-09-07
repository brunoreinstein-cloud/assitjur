 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/src/tests/security.test.ts
index 0000000000000000000000000000000000000000..046b14bfdc11b9d6a086168a1f969daba3ea0b6b 100644
--- a//dev/null
+++ b/src/tests/security.test.ts
@@ -0,0 +1,24 @@
+import { describe, it, expect } from 'vitest';
+import { maskSensitiveData, hashString, verifyHash } from '@/utils/security';
+
+describe('security utilities', () => {
+  it('masks sensitive data', () => {
+    const input = 'CPF 123.456.789-10 email user@test.com phone (11) 91234-5678 OAB/SP 12345';
+    const masked = maskSensitiveData(input);
+    expect(masked).not.toContain('123.456.789-10');
+    expect(masked).not.toContain('user@test.com');
+    expect(masked).not.toContain('(11) 91234-5678');
+    expect(masked).toContain('***.***.***-**');
+    expect(masked).toContain('***@***.***');
+    expect(masked).toContain('(**) ****-****');
+    expect(masked).toContain('OAB/** ****');
+  });
+
+  it('hashes and verifies data', async () => {
+    const plain = 'segredo';
+    const hash = await hashString(plain);
+    expect(hash).toBeTypeOf('string');
+    expect(await verifyHash(plain, hash)).toBe(true);
+    expect(await verifyHash('outro', hash)).toBe(false);
+  });
+});
 
EOF
)