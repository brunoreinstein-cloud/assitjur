# Recuperação de Senha

## Configuração

1. Defina as variáveis de ambiente no `.env.local`:
   ```
   VITE_PUBLIC_SITE_URL=https://assistjur.com.br
   VITE_SUPABASE_URL=...  
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   ```
2. No painel do Supabase, em **Authentication > URL Configuration**:
   - **Site URL**: `https://assistjur.com.br`
   - **Redirect URLs**: adicione `https://assistjur.com.br/auth/callback` e `https://assistjur.com.br/reset-password`.

3. No código, sempre utilize `import.meta.env.VITE_PUBLIC_SITE_URL` para montar os `redirectTo`.

## Troubleshooting

- Se o link recebido redirecionar para `localhost`, verifique a variável `VITE_PUBLIC_SITE_URL` e a configuração de URLs no Supabase.
- Caso a página de redefinição exiba "Link inválido", o token pode ter expirado – solicite um novo e-mail.
- Após redefinir a senha, o hash da URL é removido automaticamente para proteger o token.
