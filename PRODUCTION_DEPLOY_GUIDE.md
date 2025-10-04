# 🚀 Guia de Deploy em Produção - AssistJur.IA

**Data:** 2025-10-04  
**Versão:** 1.0.0  
**Status:** ✅ PRONTO PARA PRODUÇÃO

---

## ⚠️ PRÉ-REQUISITOS

Antes de iniciar o deploy, certifique-se de que:

- ✅ Node.js 22.x instalado (`node --version`)
- ✅ npm 10+ instalado (`npm --version`)
- ✅ Git commit recente do código
- ✅ Acesso ao Dashboard do Lovable
- ✅ Acesso ao Dashboard do Supabase

---

## 📋 CHECKLIST DE DEPLOY

### Fase 1: Build Local (10 min)

#### 1.1. Limpar e Instalar Dependências

```bash
# Limpar node_modules e cache
rm -rf node_modules package-lock.json dist/

# Instalação limpa
npm ci
```

**Validação:**
- ✅ `node_modules/` criado
- ✅ `package-lock.json` gerado
- ✅ Nenhum erro no console

---

#### 1.2. Executar Build de Produção

```bash
npm run build
```

**O que acontece:**
1. `vite build` → Compila o código React + TypeScript
2. **Automático:** `postbuild` script executa:
   - `copy-spa-fallback.js` → Cria `dist/200.html` (cópia do `index.html`)
   - `prerender` → Gera páginas estáticas para SEO
   - `sitemap:build` → Gera `sitemap.xml`

**Validação Obrigatória:**

```bash
# Verificar arquivos essenciais
ls -lh dist/index.html dist/200.html dist/404.html dist/sitemap.xml

# Verificar assets com hash
ls -lh dist/assets/*.js dist/assets/*.css
```

**Resultado esperado:**
```
-rw-r--r--  dist/index.html    (~15KB)
-rw-r--r--  dist/200.html      (~15KB)  ← IGUAL ao index.html
-rw-r--r--  dist/404.html      (~15KB)  ← IGUAL ao index.html
-rw-r--r--  dist/sitemap.xml   (~2KB)

dist/assets/
  index-abc123def.js        (~500KB)
  index-xyz789abc.css       (~50KB)
  vendor-aaa111bbb.js       (~300KB)
  page-mapa-ccc222ddd.js    (~20KB)
  ... (outros chunks)
```

**🚨 VALIDAÇÃO CRÍTICA:**

```bash
# Confirmar que 200.html e 404.html são IDÊNTICOS ao index.html
diff dist/index.html dist/200.html && echo "✅ 200.html OK"
diff dist/index.html dist/404.html && echo "✅ 404.html OK"

# Verificar que assets têm hash
find dist/assets -type f | grep -E '\.(js|css)$' | grep -v '\-[a-f0-9]{8,}\.(js|css)$' && echo "⚠️ Assets sem hash encontrados!" || echo "✅ Todos os assets têm hash"
```

---

#### 1.3. Testar Build Localmente

```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

**Abrir no navegador:**
- Local: `http://localhost:4173`
- Rede: `http://<seu-ip>:4173`

**Testes Manuais (DevTools aberto - F12):**

| Teste | URL | Validação |
|-------|-----|-----------|
| **Home** | `/` | ✅ Página carrega sem erros |
| **Rota profunda** | `/mapa` | ✅ Não retorna 404 |
| **Rota profunda** | `/planos` | ✅ Não retorna 404 |
| **Hard refresh** | `Ctrl+F5` em `/mapa` | ✅ Página carrega (não 404) |
| **Console** | Todas as páginas | ✅ Sem erros de `process.env` |
| **Network** | Tab XHR/Fetch | ✅ Chamadas ao Supabase retornam 200 |

**Verificar Service Worker:**

Abrir DevTools → Console e executar:

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  if (registrations.length > 0) {
    console.warn('⚠️ Service Workers ativos:', registrations);
    registrations.forEach(reg => reg.unregister());
    console.log('✅ Service Workers removidos');
  } else {
    console.log('✅ Nenhum Service Worker ativo');
  }
});
```

**Se houver Service Workers:** Executar `unregister()` e recarregar.

---

### Fase 2: Configurar Variáveis de Ambiente (5 min)

#### 2.1. Acessar Settings do Projeto Lovable

1. Abrir projeto no Lovable
2. Clicar em **Settings** (ícone de engrenagem)
3. Ir para **Environment Variables**

#### 2.2. Configurar Variáveis Obrigatórias

**⚠️ CRÍTICO:** Estas variáveis devem estar definidas:

```env
# Supabase
VITE_SUPABASE_URL=https://fgjypmlszuzkgvhuszxn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU

# Site URL (ajustar após deploy)
VITE_PUBLIC_SITE_URL=https://assistjur.lovable.app
```

**Validação:**
- ✅ Todas as variáveis estão preenchidas
- ✅ URLs não têm `/` no final
- ✅ Anon Key está correto (inicia com `eyJhbGciOi...`)

---

### Fase 3: Deploy no Lovable (5 min)

#### 3.1. Executar Deploy

1. Clicar no botão **"Publish"** (canto superior direito)
2. Aguardar build automático (2-3 min)
3. Receber URL de produção (ex: `https://assistjur.lovable.app`)

#### 3.2. Purge do CDN

**⚠️ IMPORTANTE:** Após o deploy, o CDN pode ter cache antigo.

**No Lovable:**
1. Settings → Deploy
2. Clicar em **"Purge CDN Cache"** (se disponível)

**OU manualmente:**
- Hard refresh: `Ctrl+Shift+R` ou `Cmd+Shift+R`
- Limpar cache do navegador
- Testar em aba anônima

---

### Fase 4: Validação Pós-Deploy (15 min)

#### 4.1. Teste em Aba Anônima

Abrir navegador em **modo anônimo** (Ctrl+Shift+N / Cmd+Shift+N):

**URL:** `https://assistjur.lovable.app`

**DevTools aberto (F12):**

| Teste | Ação | Validação |
|-------|------|-----------|
| **Home** | Abrir `/` | ✅ Página carrega |
| **Assets** | Tab Network → Assets | ✅ Todos retornam 200 |
| **Console** | Tab Console | ✅ Sem erros |
| **Rotas profundas** | Abrir `/mapa` direto | ✅ Carrega sem 404 |
| **Hard refresh** | `Ctrl+F5` em `/mapa` | ✅ Não retorna 404 |
| **Supabase** | Tab Network → XHR | ✅ Chamadas retornam 200 |
| **Variáveis ENV** | Console: `import.meta.env.VITE_SUPABASE_URL` | ✅ Retorna URL correto |

---

#### 4.2. Validação de Service Workers

Executar no console:

```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length === 0 ? '✅ Nenhum' : `⚠️ ${regs.length} ativos`);
});
```

**Se houver Service Workers:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  location.reload();
});
```

---

#### 4.3. Teste de Autenticação (se aplicável)

1. Ir para `/login`
2. Tentar fazer login
3. Verificar Network → XHR:
   - ✅ POST para Supabase retorna 200
   - ✅ Token JWT recebido
   - ✅ Redirect para dashboard

---

### Fase 5: Configurações do Supabase Dashboard (20 min)

#### 5.1. Auth OTP Expiry

**URL:** https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/auth/providers

1. Ir para **Email Auth**
2. Localizar **OTP Expiry**
3. Alterar de `86400` (24h) para `3600` (1h)
4. **Salvar**

---

#### 5.2. Leaked Password Protection

**URL:** https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/auth/providers

1. Ir para **Password Protection**
2. **Enable** "Leaked Password Protection"
3. Definir **Threshold:** `50000`
4. **Salvar**

---

#### 5.3. PostgreSQL Upgrade

**URL:** https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/database

1. Verificar versão atual
2. Clicar em **"Upgrade PostgreSQL"**
3. Seguir wizard (backup automático incluído)
4. Aguardar conclusão (5-10 min)

---

#### 5.4. Extension Schema (OPCIONAL)

**URL:** https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/sql/new

Executar SQL:

```sql
-- Criar schema para extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover pg_trgm
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Validar
SELECT n.nspname, e.extname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE e.extname = 'pg_trgm';
-- Deve retornar: extensions | pg_trgm
```

---

### Fase 6: Documentar Deploy (5 min)

#### 6.1. Informações Essenciais

Preencher no `DEPLOY_LOG.md`:

```markdown
## Deploy em Produção - 2025-10-04

### Build Info
- **Data/Hora:** 2025-10-04 14:30 BRT
- **Node Version:** 22.x
- **npm Version:** 10.x
- **Build Duration:** ~3 min

### Assets Gerados
- **Main JS:** index-[HASH].js (~500KB)
- **Main CSS:** index-[HASH].css (~50KB)
- **Vendor JS:** vendor-[HASH].js (~300KB)

### URLs
- **Produção:** https://assistjur.lovable.app
- **Supabase:** https://fgjypmlszuzkgvhuszxn.supabase.co

### Validações
- ✅ Build local OK
- ✅ Preview local OK
- ✅ Deploy Lovable OK
- ✅ CDN purgado
- ✅ Service Workers removidos
- ✅ Rotas profundas funcionando
- ✅ Supabase API OK
- ✅ Variáveis ENV OK

### Configurações Supabase
- ✅ OTP Expiry: 1h
- ✅ Leaked Password Protection: Enabled
- ✅ PostgreSQL: Latest version
- ✅ Extension Schema: Movido para extensions

### Issues Encontrados
- Nenhum

### Próximos Passos
- Monitorar logs (24-48h)
- Validar user acceptance
- Lighthouse audit
```

---

## 🔍 TROUBLESHOOTING

### Problema: Página em branco após deploy

**Causas comuns:**
1. Variáveis ENV faltando → Verificar Settings → Environment Variables
2. Base path incorreto → Confirmar `base: '/'` no `vite.config.ts`
3. Assets não carregam → Verificar Network tab (bloqueio CORS?)

**Solução:**
```bash
# Console do navegador (F12)
console.log(import.meta.env.VITE_SUPABASE_URL);
// Se undefined → variáveis ENV não estão configuradas
```

---

### Problema: Rotas retornam 404

**Causa:** SPA fallback não configurado ou cache antigo

**Solução:**
1. Verificar que `dist/200.html` e `dist/404.html` existem
2. Purgar CDN cache
3. Hard refresh (Ctrl+F5)

---

### Problema: API calls falham (401/403)

**Causas:**
1. RLS bloqueando → Validar policies no Supabase
2. JWT inválido → Verificar login do usuário
3. CORS bloqueado → Verificar `ALLOWED_ORIGINS`

**Solução:**
```bash
# Testar endpoint diretamente
curl -X POST "https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/sua-function" \
  -H "Authorization: Bearer SEU_JWT" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

### Problema: Service Worker causando cache antigo

**Solução:**
```javascript
// Console do navegador
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  console.log('✅ Service Workers removidos');
  location.reload();
});
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY (24-48h)

### Logs Supabase

**Auth Logs:**
https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/logs/auth-logs

**Database Logs:**
https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/logs/postgres-logs

**Edge Functions:**
https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/functions

**Filtros úteis:**
- Erros 5xx (server errors)
- Latência > 2s
- CORS errors

---

### Core Web Vitals

```bash
npm run lh -- --url=https://assistjur.lovable.app
```

**Métricas alvo:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy concluído:

- [ ] Build local sem erros
- [ ] `dist/index.html`, `dist/200.html`, `dist/404.html` existem e são idênticos
- [ ] Assets têm hash no nome (`index-abc123.js`)
- [ ] Preview local funciona (rotas profundas OK)
- [ ] Service Workers desativados
- [ ] Variáveis ENV configuradas no Lovable
- [ ] Deploy executado (botão "Publish")
- [ ] CDN purgado
- [ ] Teste em aba anônima OK
- [ ] Console sem erros
- [ ] Rotas profundas funcionam com hard refresh
- [ ] API Supabase retorna 200
- [ ] Auth OTP configurado (1h)
- [ ] Leaked Password Protection ativo
- [ ] PostgreSQL atualizado
- [ ] Extension Schema movido (opcional)
- [ ] `DEPLOY_LOG.md` preenchido
- [ ] Lighthouse audit executado

---

## 🆘 SUPORTE

Em caso de problemas persistentes:

1. **Logs do Console (F12)**
2. **Resposta do Network (XHR)**
3. **Passos para reproduzir**
4. **Documentação:**
   - [Lovable Docs](https://docs.lovable.dev/)
   - [Supabase Docs](https://supabase.com/docs)
   - [Vite Docs](https://vitejs.dev/)

---

**🎉 Deploy concluído com sucesso!**
