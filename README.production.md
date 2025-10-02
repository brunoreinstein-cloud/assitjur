# 📦 AssistJur.IA - Informações de Produção

## 🎯 Status de Produção

**Score Atual**: 8.5/10  
**Status**: READY WITH MINOR ALERTS  
**Última Verificação**: 2025-10-02

## 🔍 Arquitetura de Produção

### Frontend
- **Framework**: React 18 + Vite 5
- **Hospedagem**: Lovable Cloud (ou Vercel/Netlify)
- **Build**: Otimizado com code splitting, tree shaking, minificação
- **Performance**: Lazy loading, route-based chunking, PWA ready

### Backend
- **Database**: Supabase (PostgreSQL 14+)
- **Autenticação**: Supabase Auth (JWT + RLS)
- **Edge Functions**: Deno runtime via Supabase
- **Storage**: Supabase Storage (private buckets)

### Segurança
- **RLS**: Habilitado em todas as tabelas críticas
- **Audit Log**: Sistema de auditoria imutável (Phase 2)
- **PII Protection**: Mascaramento de dados sensíveis
- **MFA**: Suporte a 2FA para organizações
- **Session Management**: Auto-logout por inatividade
- **Security Score**: 9.0/10

## 📊 Métricas de Performance

### Targets de Produção
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size**: < 500KB (initial, gzipped)

### Edge Functions Performance
- **Cold Start**: < 1s
- **Warm Request**: < 100ms
- **p95 Latency**: < 500ms

## 🔐 Configurações de Segurança

### RLS Policies Ativas
```sql
-- Todas as tabelas críticas protegidas
SELECT tablename FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
  AND c.relrowsecurity = true;
```

### Security Functions
- `validate_org_access()` - Validação de acesso organizacional
- `can_access_sensitive_data()` - Controle de dados sensíveis
- `mask_name()` - Mascaramento de PII
- `log_user_action()` - Auditoria de ações
- `get_audit_trail()` - Consulta segura de logs

### Secrets Management
Configurados via Supabase Dashboard (nunca em código):
- `OPENAI_API_KEY` - API OpenAI para features de IA
- `OPENAI_ORG` - Organization ID (opcional)
- `OPENAI_PROJECT` - Project ID (opcional)
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configurado

## 📦 Build de Produção

### Comandos
```bash
# Build completo
npm run build

# Preview local
npm run preview

# Verificação pré-deploy
node scripts/pre-deploy-check.js

# Limpeza de console.logs
node scripts/clean-console-logs.js
```

### Output
```
dist/
├── assets/
│   ├── index-[hash].js     # Main bundle (~300KB gzipped)
│   ├── vendor-[hash].js    # Vendor chunk (~150KB gzipped)
│   └── *.css               # Styles (~30KB gzipped)
├── index.html
├── 404.html                # SPA fallback
├── sitemap.xml
└── robots.txt
```

## 🌐 Deployment

### Via Lovable (Recomendado)
1. Clicar em "Publish" no dashboard
2. Aguardar build automático
3. URL gerada: `https://{project}.lovable.app`

### Via Git + CI/CD
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

### Custom Domain
Configurar via Lovable Settings → Domains

## 📝 Variáveis de Ambiente

### Produção (`.env.production`)
```bash
VITE_SUPABASE_URL=https://fgjypmlszuzkgvhuszxn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJI...
VITE_PUBLIC_SITE_URL=https://app.assistjur.com
VITE_SENTRY_DSN=                # Opcional
VITE_MAINTENANCE=false
```

**⚠️ IMPORTANTE**: Nunca commitar `.env.production` com valores reais

## 🔄 Processo de Deploy

1. **Pre-Deploy**
   - ✅ Executar `pre-deploy-check.js`
   - ✅ Limpar console.logs
   - ✅ Testar build local
   - ✅ Verificar type check

2. **Deploy**
   - Via Lovable (automático)
   - Ou via CI/CD

3. **Post-Deploy**
   - ✅ Smoke tests
   - ✅ Verificar logs Edge Functions
   - ✅ Lighthouse audit
   - ✅ Security scan

## 🐛 Troubleshooting

### Build Errors
```bash
# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Edge Function 500
1. Verificar secrets no Dashboard
2. Checar logs: `supabase functions logs {function_name}`
3. Testar local: `npx supabase functions serve`

### RLS Blocking Access
```sql
-- Verificar profile do usuário
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Verificar org_id
SELECT organization_id FROM profiles WHERE user_id = auth.uid();
```

## 📊 Monitoramento

### Logs Disponíveis
- **Supabase Logs**: Database, Auth, Edge Functions
- **Audit Logs**: Ações de usuário (`audit_logs`, `audit_log_immutable`)
- **Data Access Logs**: Acessos a dados sensíveis
- **OpenAI Logs**: Chamadas para IA

### Queries Úteis
```sql
-- Erros recentes
SELECT * FROM audit_logs 
WHERE result = 'ERROR' 
ORDER BY created_at DESC 
LIMIT 50;

-- Top usuários ativos
SELECT user_id, email, count(*) 
FROM audit_logs 
WHERE created_at > now() - interval '7 days'
GROUP BY user_id, email 
ORDER BY count DESC;

-- Performance de Edge Functions
SELECT function_id, avg(execution_time_ms)
FROM function_edge_logs
WHERE timestamp > now() - interval '1 hour'
GROUP BY function_id;
```

## 🔒 Conformidade & Compliance

### LGPD Ready
- ✅ Consentimento de dados
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Auditoria completa
- ✅ Mascaramento de PII

### Data Retention
```sql
-- Políticas configuradas
SELECT * FROM retention_policies;

-- Executar cleanup
SELECT execute_retention_cleanup(policy_id);
```

## 📚 Links Úteis

- **Supabase Dashboard**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn
- **SQL Editor**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/sql
- **Edge Functions**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/functions
- **Auth Settings**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/auth
- **Secrets**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/functions

## 🆘 Suporte

Para problemas críticos em produção:
1. Verificar logs no Dashboard Supabase
2. Consultar `DEPLOY.md` para troubleshooting
3. Rollback se necessário (histórico Lovable)

---

**Última Atualização**: 2025-10-02  
**Mantenedor**: Equipe AssistJur.IA  
**Versão**: 1.0
