# ✅ Deploy Checklist - AssistJur.IA

## 📋 Status de Execução

### Fase 1: Preparação Build ✅
- [x] `tsconfig.json` ajustado (`noUnusedLocals: false`, `noUnusedParameters: false`)
- [ ] Build local executado (`npm run build`)
- [ ] Preview local testado (`npm run preview`)
- [ ] Validação de arquivos em `dist/`

### Fase 2: Deploy Lovable ⏳
- [ ] Clicar em "Publish" no Lovable
- [ ] Aguardar confirmação de deploy
- [ ] Abrir URL de produção
- [ ] Validação rápida da aplicação

### Fase 3: Configurações Dashboard Supabase ⏳

#### 3.1. Auth OTP Expiry
- [ ] Acessar: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/auth/providers
- [ ] Alterar OTP expiry de 24h para 1h (3600 segundos)
- [ ] Salvar alterações

#### 3.2. Leaked Password Protection
- [ ] Enable "Leaked Password Protection"
- [ ] Definir threshold: 50,000
- [ ] Salvar alterações

#### 3.3. PostgreSQL Upgrade
- [ ] Acessar: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/database
- [ ] Verificar versão atual vs. latest
- [ ] Fazer backup manual (opcional)
- [ ] Executar "Upgrade PostgreSQL"
- [ ] Aguardar conclusão (5-10 min)

#### 3.4. Extension Schema (OPCIONAL)
- [ ] Acessar SQL Editor: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/sql/new
- [ ] Executar script para mover `pg_trgm` para schema `extensions`
- [ ] Validar mudança

### Fase 4: Validação Final ⏳

#### 4.1. Security Scan
- [ ] Rodar `supabase db lint`
- [ ] Validar zero warnings críticos
- [ ] Documentar warnings opcionais restantes

#### 4.2. Lighthouse Audit
- [ ] Performance: 90+
- [ ] Accessibility: 100
- [ ] Best Practices: 100
- [ ] SEO: 100

#### 4.3. Testes Funcionais
- [ ] Login/Logout
- [ ] Importação de processos
- [ ] Mapeamento de testemunhas
- [ ] Permissões admin
- [ ] Busca e filtros
- [ ] Exportação de dados

### Fase 5: Monitoramento (24-48h) ⏳
- [ ] Verificar Auth logs
- [ ] Verificar Database logs
- [ ] Verificar Edge Function logs
- [ ] Monitorar Core Web Vitals
- [ ] Coletar feedback de usuários

---

## 🔗 Links Úteis

### Supabase Dashboard
- **Auth Settings**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/auth/providers
- **Database Settings**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/settings/database
- **SQL Editor**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/sql/new
- **Auth Logs**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/logs/auth-logs
- **Database Logs**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/logs/postgres-logs
- **Edge Functions**: https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/functions

### Scripts SQL Opcionais

**Mover pg_trgm para schema extensions:**
```sql
-- Criar schema para extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover pg_trgm para schema extensions
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Validar
SELECT n.nspname, e.extname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE e.extname = 'pg_trgm';
```

---

## 📊 Status Atual vs. Pós-Deploy

| Item | Antes | Depois |
|------|-------|--------|
| **Build Warnings** | ~150 TS6133 | 0 |
| **SQL Security Score** | 10/10 ✅ | 10/10 ✅ |
| **Auth OTP Expiry** | 24h ⚠️ | 1h ✅ |
| **Leaked Password Protection** | Disabled ⚠️ | Enabled ✅ |
| **PostgreSQL Version** | Outdated ⚠️ | Latest ✅ |
| **Extension Schema** | public ⚠️ | extensions ✅ |

---

## ⚡ Próximos Passos

1. **Execute o build:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Valide localmente** que tudo funciona

3. **Deploy no Lovable** (botão "Publish")

4. **Configure o Supabase Dashboard** seguindo este checklist

5. **Monitore por 24-48h** e documente issues

---

**Data de criação:** 2025-10-04  
**Última atualização:** 2025-10-04  
**Versão:** 1.0
