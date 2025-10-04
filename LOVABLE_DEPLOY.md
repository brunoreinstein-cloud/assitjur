# 🚀 Guia de Deploy no Lovable

## Pré-requisitos

- Projeto configurado no [Lovable](https://lovable.app/)
- Acesso ao Supabase do projeto
- Node 20+ e npm 10+ instalados localmente (para testes)

---

## ✅ Checklist Pré-Deploy

### 1. Verificar Build Local

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run preview
```

**Validações:**

- ✅ Build completa sem erros críticos (TS6310 é cosmético)
- ✅ `dist/index.html`, `dist/200.html` e `dist/404.html` existem e são gerados a partir do mesmo conteúdo
- ✅ Preview funciona em `http://localhost:4173`
- ✅ Rotas profundas funcionam (ex: `/mapa`, `/planos`)

### 2. Configurar Variáveis de Ambiente no Lovable

Acesse **Settings → Environment Variables** e adicione:

#### Obrigatórias

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-anon
VITE_PUBLIC_SITE_URL=https://seu-site.lovable.app
```

#### Opcionais (mas recomendadas)

```
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_INACTIVITY_TIMEOUT_MINUTES=30
VITE_FEATURE_FLAGS_REFRESH_INTERVAL=60000
VITE_FEATURE_FLAGS_CACHE_TTL=300000
VITE_MAINTENANCE=false
VITE_ALLOWED_ORIGINS=https://seu-site.lovable.app
```

### 3. Validar Supabase

#### RLS Policies

Garanta que todas as tabelas sensíveis têm RLS ativo:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

#### CORS em Edge Functions

Configure o secret `ALLOWED_ORIGINS` no Supabase:

```
ALLOWED_ORIGINS=https://assistjur.com.br,https://*.lovable.app
```

---

## 🎯 Deploy

### No Lovable

1. Clique em **Publish** (botão superior direito)
2. Aguarde o build automático
3. Acesse a URL gerada: `https://seu-site.lovable.app`

### Validação Pós-Deploy

Teste as seguintes funcionalidades:

- [ ] Página inicial carrega corretamente
- [ ] Login funciona (teste com usuário real)
- [ ] Navegação entre páginas (mapa, planos, admin)
- [ ] Rotas profundas funcionam com reload
- [ ] Console sem erros críticos (F12 → Console)
- [ ] API calls ao Supabase funcionam (Network → XHR)
- [ ] Dark mode funciona
- [ ] Responsividade mobile

---

## 🐛 Troubleshooting

### Build falha com "TS6310"

**Causa:** TypeScript detecta configs read-only  
**Solução:** Este erro é cosmético e não impede o build. O Vite usa esbuild e ignora tsconfig errors.

```bash
# Confirme que o build passa:
npm run build
ls -la dist/
```

### Página em branco após deploy

**Causas comuns:**

1. **Variáveis ENV faltando** → Verifique Settings → Environment Variables
2. **Base path incorreto** → Confirme `base: '/'` no `vite.config.ts`
3. **Fallback SPA ausente** → Verifique se `dist/200.html` e `dist/404.html` existem após o build
4. **CORS bloqueando API** → Configure `ALLOWED_ORIGINS` no Supabase

**Debug:**

```bash
# Console do navegador (F12)
# Procure por erros de:
# - Import map
# - Failed to fetch
# - CORS policy
```

### Rotas retornam 404

**Causa:** SPA fallback não configurado  
**Solução:** Confirme que `dist/200.html` e `dist/404.html` existem e são cópias do `dist/index.html`:

```bash
npm run build
cat dist/200.html  # Deve ser idêntico ao index.html
cat dist/404.html  # Deve ser idêntico ao index.html
```

### Fallbacks SPA no Lovable

- Configure o Lovable para servir os arquivos `200.html` e `404.html`, ambos gerados a partir do `index.html`.
- Qualquer experiência personalizada de "Página não encontrada" deve ser tratada dentro do React Router (por exemplo, rota catch-all) para garantir comportamento consistente no deploy.

### API calls falham (401/403)

**Causas:**

1. **RLS bloqueando** → Valide policies no Supabase
2. **JWT inválido** → Verifique login do usuário
3. **CORS bloqueado** → Configure `ALLOWED_ORIGINS`

**Teste direto:**

```bash
curl -X POST "https://seu-projeto.supabase.co/functions/v1/sua-function" \
  -H "Authorization: Bearer seu-jwt" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📊 Monitoramento

### Logs de Edge Functions

Supabase Dashboard → Edge Functions → Logs

Filtre por:

- Erros 5xx (server errors)
- Latência > 2s
- CORS errors

### Core Web Vitals

Use Lighthouse ou PageSpeed Insights:

```bash
npm run lh -- --url=https://seu-site.lovable.app
```

Métricas alvo:

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

---

## 🔒 Segurança

### Antes de produção:

- [ ] Todas as tabelas com RLS ativado
- [ ] Policies de RLS testadas com diferentes usuários
- [ ] Service Role Key **NUNCA** exposta no frontend
- [ ] CORS restrito a domínios confiáveis
- [ ] Rate limiting ativo em Edge Functions
- [ ] Logs de auditoria para operações sensíveis

---

## 📝 Observações ESM/CJS

Este projeto usa `"type": "module"` no `package.json`:

- **Scripts Node.js** devem usar ESM (`import`/`export`) ou ter extensão `.cjs`
- **Vite** usa esbuild e ignora `tsconfig.json` "references"
- **Build scripts** não devem modificar configs (TS6310)

---

## 🆘 Suporte

- [Documentação Lovable](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)

Em caso de problemas persistentes, abra issue no repositório com:

- Logs do console (F12)
- Resposta do Network (XHR)
- Passos para reproduzir
