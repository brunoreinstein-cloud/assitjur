# 🔧 Configuração de Variáveis de Ambiente

## 🚨 **PROBLEMA IDENTIFICADO**

A aplicação está "desconfigurada" porque **não existe arquivo `.env`** com as variáveis de ambiente obrigatórias.

## ✅ **SOLUÇÃO**

### **1. Criar arquivo `.env` na raiz do projeto:**

```bash
# AssistJur.IA - Environment Variables
# Copy this file and configure with your actual values

# Supabase Configuration (OBRIGATÓRIAS)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics and Monitoring
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=

# Development Settings
VITE_DEBUG=true
VITE_DISABLE_ANALYTICS=true
VITE_USE_HASH_ROUTER=false
VITE_CLEANUP_SW=true
```

### **2. Configurar valores reais:**

**Para desenvolvimento local, você pode usar valores dummy:**

```bash
# Valores dummy para desenvolvimento
VITE_SUPABASE_URL=https://dummy.supabase.local
VITE_SUPABASE_ANON_KEY=dummy-key-for-development
```

**Para produção, use valores reais do Supabase:**

```bash
# Valores reais do Supabase
VITE_SUPABASE_URL=https://seuprojeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Reiniciar o servidor:**

```bash
# Parar o servidor atual
Ctrl+C

# Reiniciar
pnpm run dev
```

## 🎯 **Por que isso aconteceu?**

1. **Validação de ambiente**: O `main.tsx` valida variáveis obrigatórias
2. **Arquivo .env ausente**: Não existe configuração de ambiente
3. **Fallback em desenvolvimento**: O código tem fallback para valores dummy
4. **Aplicação carrega**: Mas sem configuração real do Supabase

## 📝 **Próximos Passos**

1. ✅ **Criar arquivo `.env`** com o conteúdo acima
2. ✅ **Configurar valores** (dummy para dev, reais para prod)
3. ✅ **Reiniciar servidor** (`pnpm run dev`)
4. ✅ **Testar aplicação** no navegador

## 🔍 **Verificação**

Após criar o `.env`, a aplicação deve:
- ✅ Carregar sem erros de console
- ✅ Mostrar interface corretamente
- ✅ Funcionar normalmente (com valores dummy)

---

**🎯 Crie o arquivo `.env` na raiz do projeto com o conteúdo acima!**
