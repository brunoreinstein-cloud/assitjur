 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/utils/security.ts b/src/utils/security.ts
index 974d20849679fe80736401dd6621af9afe7be282..9d51887881bfe74dd3aa1a4c8c3737d980a64fa9 100644
--- a/src/utils/security.ts
+++ b/src/utils/security.ts
@@ -163,26 +163,40 @@ export const maskSensitiveData = (text: string, patterns?: Record<string, RegExp
   };
   
   let maskedText = text;
   
   maskedText = maskedText.replace(defaultPatterns.cpf, '***.***.***-**');
   maskedText = maskedText.replace(defaultPatterns.cnpj, '**.***.***/**-**');
   maskedText = maskedText.replace(defaultPatterns.email, '***@***.***');
   maskedText = maskedText.replace(defaultPatterns.phone, '(**) ****-****');
   maskedText = maskedText.replace(defaultPatterns.oab, 'OAB/** ****');
   
   return maskedText;
 };
 
 // Encrypt sensitive data for localStorage
 export const encryptForStorage = (data: string): string => {
   // Simple Base64 encoding (in production, use proper encryption)
   return btoa(encodeURIComponent(data));
 };
 
 export const decryptFromStorage = (encrypted: string): string => {
   try {
     return decodeURIComponent(atob(encrypted));
   } catch {
     return '';
   }
-};
+};
+
+// Hash and verify data using Web Crypto API
+export const hashString = async (input: string): Promise<string> => {
+  const encoder = new TextEncoder();
+  const data = encoder.encode(input);
+  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
+  const hashArray = Array.from(new Uint8Array(hashBuffer));
+  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
+};
+
+export const verifyHash = async (input: string, hash: string): Promise<boolean> => {
+  const newHash = await hashString(input);
+  return newHash === hash;
+};
 
EOF
)