# 🚨 Guia de Debug - Problemas de Tela Branca

Este guia ajuda a diagnosticar e resolver problemas de tela branca em deploys SPA.

## 🔍 **Diagnóstico Rápido**

### 1. **Verificar Console do Navegador**
```bash
# Abrir DevTools (F12) e verificar:
- Erros JavaScript (Console)
- Requisições falhando (Network)
- Service Workers ativos (Application > Service Workers)
```

### 2. **Testar em Aba Anônima**
```bash
# Abrir aba anônima para evitar cache/SW antigos
# Se funcionar em anônima = problema de cache
```

### 3. **Verificar Roteamento**
```bash
# Testar rotas diretas:
- https://assitjur.vercel.app/
- https://assitjur.vercel.app/login
- https://assitjur.vercel.app/app/dashboard
```

## 🛠️ **Soluções Implementadas**

### ✅ **1. Guards SSR Padronizados**
- Todos os acessos a `window`/`document` agora têm guards
- Utilitários SSR em `src/lib/ssr-utils.ts`
- Prevenção de erros durante SSR/prerender

### ✅ **2. Fallbacks SPA**
- `200.html` e `404.html` criados automaticamente
- `_redirects` para Netlify
- `vercel.json` com rewrites corretos

### ✅ **3. HashRouter de Debug**
```bash
# Para ativar HashRouter (resolve problemas de rewrite):
VITE_USE_HASH_ROUTER=true
```

### ✅ **4. Limpeza de Service Worker**
```bash
# Para limpar SW antigos:
VITE_CLEANUP_SW=true
```

### ✅ **5. Error Boundaries**
- `LoginErrorBoundary` para página de login
- Fallbacks para erros de renderização

## 🚀 **Comandos de Debug**

### **Build Local**
```bash
pnpm run build
# Verifica se build local funciona
```

### **Teste com HashRouter**
```bash
# Copiar debug.env.example para .env.local
cp debug.env.example .env.local

# Editar .env.local e adicionar:
VITE_USE_HASH_ROUTER=true

# Rebuild e testar
pnpm run build
```

### **Limpeza Completa**
```bash
# Limpar cache e SW
VITE_CLEANUP_SW=true pnpm run build
```

## 🔧 **Configurações de Deploy**

### **Vercel**
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/((?!assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|sw\\.js|.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|br|gz)).*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Netlify**
```
# _redirects
/* /index.html 200
```

## 🐛 **Problemas Comuns e Soluções**

### **1. Tela Branca Total**
- **Causa**: Erro JavaScript não capturado
- **Solução**: Verificar console, ativar Error Boundaries

### **2. 404 em Rotas SPA**
- **Causa**: Rewrite rules incorretas
- **Solução**: Usar HashRouter temporariamente, corrigir vercel.json

### **3. Assets 404**
- **Causa**: Base path incorreto
- **Solução**: Verificar `vite.config.js` base: "/"

### **4. Service Worker Antigo**
- **Causa**: SW cache antigo
- **Solução**: Ativar `VITE_CLEANUP_SW=true`

### **5. Variáveis de Ambiente**
- **Causa**: Env vars não definidas
- **Solução**: Verificar `.env` e `vercel.json` env

## 📊 **Monitoramento**

### **Logs Importantes**
```javascript
// Console logs para monitorar:
- "Environment variables validated successfully"
- "All service workers cleaned up"
- "Analytics script loaded"
- "Failed to initialize application"
```

### **Métricas de Performance**
- Lighthouse audit
- Network waterfall
- Bundle size analysis

## 🆘 **Escalação**

Se problemas persistirem:

1. **Ativar HashRouter** (`VITE_USE_HASH_ROUTER=true`)
2. **Limpar SW** (`VITE_CLEANUP_SW=true`)
3. **Verificar logs** do Vercel
4. **Testar build local** vs deploy
5. **Comparar** com versão anterior funcionando

## 📝 **Checklist de Deploy**

- [ ] Build local funciona
- [ ] Sem erros de TypeScript
- [ ] Assets carregam corretamente
- [ ] Rotas SPA funcionam
- [ ] Console limpo (sem erros)
- [ ] Service Workers limpos
- [ ] Variáveis de ambiente configuradas
- [ ] Error boundaries ativos
