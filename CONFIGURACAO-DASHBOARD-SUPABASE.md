# 🔒 Configurações Manuais no Dashboard Supabase

Este documento detalha as **4 configurações finais** que devem ser feitas manualmente no Dashboard do Supabase para alcançar **score de segurança 10/10**.

---

## ⚠️ Warnings Pendentes

### 1. **Auth OTP Long Expiry** (WARN)
**Problema:** O tempo de expiração do OTP está acima do recomendado (atualmente > 60s).

**Solução:**
1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn)
2. Navegue até **Authentication** → **Settings** → **Email Auth**
3. Localize **"OTP Expiry"**
4. Altere de `3600s` (1 hora) para **`60s`** (recomendado)
5. Clique em **Save**

**Link da documentação:** https://supabase.com/docs/guides/platform/going-into-prod#security

---

### 2. **Leaked Password Protection Disabled** (WARN)
**Problema:** A proteção contra senhas vazadas está desativada.

**Solução:**
1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn)
2. Navegue até **Authentication** → **Settings** → **Password Protection**
3. Localize **"Enable Leaked Password Protection"**
4. **Ative** a opção (toggle ON)
5. Configure threshold mínimo: **50,000** (padrão recomendado)
6. Clique em **Save**

**Benefícios:**
- Bloqueia senhas que apareceram em vazamentos públicos
- Protege usuários contra reutilização de senhas comprometidas
- Integração automática com banco de dados Have I Been Pwned

**Link da documentação:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 3. **PostgreSQL Version Outdated** (WARN)
**Problema:** A versão do PostgreSQL tem patches de segurança disponíveis.

**Solução:**
1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn)
2. Navegue até **Settings** → **Database** → **Postgres Version**
3. Verifique a versão atual e a versão mais recente disponível
4. Clique em **"Upgrade to latest version"**
5. **IMPORTANTE:** Faça backup antes de fazer upgrade:
   - Vá para **Database** → **Backups**
   - Clique em **"Download backup"**
6. Aguarde a conclusão do upgrade (pode levar alguns minutos)

**⚠️ ATENÇÃO:**
- Sempre faça backup antes de upgrade
- Planeje o upgrade para horário de baixo tráfego
- Teste em ambiente staging primeiro (se disponível)

**Link da documentação:** https://supabase.com/docs/guides/platform/upgrading

---

### 4. **Extension in Public Schema** (WARN)
**Problema:** A extensão `pg_trgm` está instalada no schema `public`.

**Status:** ⚠️ **Baixa prioridade** - Necessária para full-text search

**Contexto:**
- A extensão `pg_trgm` é necessária para funcionalidades de busca fuzzy
- Supabase recomenda instalar extensões em schemas dedicados
- **NÃO é um risco crítico de segurança**

**Solução (Opcional):**
Se desejar mover a extensão para schema dedicado:

```sql
-- 1. Criar schema para extensões
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Mover extensão
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. Atualizar search_path das funções que usam pg_trgm
-- (Verificar e ajustar conforme necessário)
```

**Link da documentação:** https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

---

## ✅ Status Final Esperado

Após realizar as configurações 1, 2 e 3:

| Categoria | Status |
|-----------|--------|
| **SQL Security** | ✅ 100% compliant |
| **RLS Policies** | ✅ Todas configuradas |
| **Function Security** | ✅ search_path fixo em todas |
| **Auth Settings** | ✅ OTP curto + Leaked protection |
| **PostgreSQL** | ✅ Versão mais recente |
| **Extensions** | ⚠️ pg_trgm em public (baixa prioridade) |

### Score de Segurança Esperado: **9.5/10** 🎯

---

## 📝 Checklist de Verificação

- [ ] **OTP Expiry** configurado para 60 segundos
- [ ] **Leaked Password Protection** ativado (threshold: 50,000)
- [ ] **PostgreSQL** atualizado para versão mais recente
- [ ] **Backup** criado antes do upgrade
- [ ] **Testar login/signup** após configurações

---

## 🔗 Links Úteis

- [Dashboard do Projeto](https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn)
- [Documentação de Segurança Supabase](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Checklist de Produção](https://supabase.com/docs/guides/platform/going-into-prod)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)

---

## 🆘 Suporte

Se encontrar problemas durante as configurações:

1. Verifique os [logs do Supabase](https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/logs)
2. Consulte a [documentação oficial](https://supabase.com/docs)
3. Acesse o [Discord da Supabase](https://discord.supabase.com)

---

**Última atualização:** 2025-10-03  
**Versão do documento:** 1.0
