# 🚀 Guia de Deploy - AssistJur.IA

Este documento fornece instruções passo-a-passo para publicar o AssistJur.IA em produção.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta Lovable (para deploy via Lovable)
- Acesso ao Dashboard Supabase (para configurações)
- Variáveis de ambiente configuradas

## 🔍 Fase 1: Validação Pré-Deploy

### 1.1 Executar Script de Verificação

```bash
# Instalar dependências (se necessário)
npm install

# Executar verificação completa
node scripts/pre-deploy-check.js
```

Este script verifica:

- ✅ Variáveis de ambiente
- ✅ Console.logs em produção
- ✅ TypeScript compilation
- ✅ Build de produção
- ✅ Configurações de segurança
- ✅ Edge Functions

### 1.2 Limpar Console.Logs (se necessário)

```bash
# Modo dry-run (apenas visualizar)
node scripts/clean-console-logs.js --dry-run --verbose

# Aplicar limpeza
node scripts/clean-console-logs.js
```

### 1.3 Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.production.example .env.production

# Editar e preencher valores obrigatórios
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY
# VITE_PUBLIC_SITE_URL
```

### 1.4 Testar Build Local

```bash
# Build completo
npm run build

# Preview local
npm run preview

# Abrir http://localhost:4173 e testar funcionalidades críticas
```

## 🔐 Fase 2: Configurações Supabase

### 2.1 Configurar Secrets para Edge Functions

Acesse: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/functions

Adicione os seguintes secrets:

```
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG=org-... (opcional)
OPENAI_PROJECT=proj_... (opcional)
```

### 2.2 Ajustar Configurações de Segurança

Acesse: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/auth

**Auth Settings:**

- ✅ OTP Expiry: **600 segundos** (10 minutos)
- ✅ Enable Leaked Password Protection: **Habilitado**

### 2.3 Verificar RLS Policies

Acesse: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/editor

Verificar que as seguintes tabelas têm RLS ativo + policies:

- ✅ `profiles`
- ✅ `processos`
- ✅ `pessoas`
- ✅ `audit_logs`
- ✅ `audit_log_immutable`
- ✅ `beta_signups`
- ✅ `invoices`

Execute a query de verificação:

```sql
SELECT get_security_status();
```

### 2.4 Upgrade PostgreSQL (Recomendado)

Se disponível, faça upgrade para PostgreSQL 15+ via Dashboard.

## 🚀 Fase 3: Deploy

### Opção A: Deploy via Lovable (Recomendado)

1. **Commit todas as mudanças**

   ```bash
   git add .
   git commit -m "chore: prepare for production deploy"
   ```

2. **Clicar em "Publish"** no canto superior direito da interface Lovable

3. **Aguardar build e deploy automático**
   - Lovable executará o build
   - Deploy será feito automaticamente
   - URL de produção será gerada

### Opção B: Deploy Manual (Vercel/Netlify)

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## ✅ Fase 4: Validação Pós-Deploy

### 4.1 Smoke Tests

Após deploy, testar:

- [ ] **Login/Logout** funciona
- [ ] **Dashboard** carrega corretamente
- [ ] **Chat com IA** responde
- [ ] **Upload de dados** funciona
- [ ] **Visualizações** renderizam
- [ ] **Export** gera arquivos

### 4.2 Monitorar Logs

**Edge Functions:**
https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/functions/{function_name}/logs

**Aplicação (se Sentry configurado):**

- Verificar dashboard Sentry para erros

### 4.3 Performance Check

Executar Lighthouse Audit:

```bash
npm run lighthouse # (se configurado)
```

Ou manualmente via Chrome DevTools:

1. Abrir site em produção
2. DevTools → Lighthouse
3. Gerar relatório
4. Meta: **Score 90+** em todas as categorias

### 4.4 Security Scan

```bash
# Executar scan de segurança
npm run security:scan # (se configurado)
```

Ou verificar manualmente:

- [ ] HTTPS habilitado
- [ ] Headers de segurança configurados
- [ ] RLS policies ativas
- [ ] Secrets não expostos no frontend

## 🐛 Troubleshooting

### Build Falha

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Edge Function Error 500

1. Verificar logs no Dashboard Supabase
2. Confirmar que secrets estão configurados
3. Testar localmente:
   ```bash
   npx supabase functions serve
   ```

### RLS Policy Bloqueando Acesso

1. Verificar que usuário tem `organization_id` correto
2. Testar queries via SQL Editor:
   ```sql
   SELECT * FROM profiles WHERE user_id = auth.uid();
   ```

### "VITE\_\* is not defined"

1. Confirmar que `.env.production` existe
2. Rebuild:
   ```bash
   npm run build
   ```

## 📊 Monitoramento Contínuo

### Métricas a Acompanhar

- **Performance**: Core Web Vitals (LCP, FID, CLS)
- **Errors**: Taxa de erro < 1%
- **API Latency**: p95 < 500ms
- **Edge Functions**: Cold start < 1s

### Ferramentas Recomendadas

- **Sentry**: Error tracking
- **Supabase Dashboard**: Database & Edge Functions monitoring
- **Google Analytics**: User behavior
- **Lighthouse CI**: Performance tracking

## 🔄 Rollback

Se necessário reverter deploy:

### Via Lovable

1. Acessar histórico de versões
2. Clicar em "Revert" na versão anterior
3. Aguardar redeploy

### Via Git + CI/CD

```bash
git revert HEAD
git push origin main
```

## 📚 Recursos Adicionais

- [Lovable Docs - Deploying](https://docs.lovable.dev/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

## ✅ Checklist Final

Antes de considerar deploy completo:

- [ ] Pre-deploy check passou sem erros
- [ ] Console.logs removidos
- [ ] Variáveis de ambiente configuradas
- [ ] Edge Function secrets configurados
- [ ] RLS policies verificadas
- [ ] Build local testado
- [ ] Deploy executado com sucesso
- [ ] Smoke tests passaram
- [ ] Performance score 90+
- [ ] Logs monitorados por 24h
- [ ] Usuários de teste validaram

---

**Última atualização**: 2025-10-02  
**Versão do Guia**: 1.0  
**Score de Produção**: 8.5/10 → 9.5/10 (após deploy)
