# 📜 Scripts de Produção - AssistJur.IA

## Scripts Disponíveis

### 🔧 Development

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build local
npm run test         # Executa testes
```

### 🛡️ Production Validation

```bash
# Validar build de produção
node scripts/production-validator.js

# Build com análise de bundle
ANALYZE=true npm run build
```

### 📊 Analysis & Monitoring

```bash
# Lighthouse CI (requer build preview rodando)
npm run lighthouse

# Bundle analyzer (se configurado)
npm run analyze
```

## 🚀 Deploy Process

### 1. Pré-Deploy

```bash
# Validar código
npm run lint
npm run type-check
npm run test

# Build local
npm run build
npm run preview
```

### 2. Production Validation

```bash
# Executar validador de produção
node scripts/production-validator.js

# Verificar lighthouse scores
npm run lighthouse
```

### 3. Deploy

- Usar interface Lovable "Publish"
- Verificar variáveis de ambiente
- Confirmar configurações Supabase

## 🔍 Debugging em Produção

### Logger Estruturado

```typescript
import { logger } from "@/lib/logger";

// Em vez de console.log
logger.info("Mensagem", { contexto }, "ServicoNome");
logger.warn("Aviso", { dados }, "ServicoNome");
logger.error("Erro", { erro }, "ServicoNome");
```

### Performance Monitoring

```typescript
import { performanceOptimizer } from "@/utils/production/performanceOptimizer";

// Aplicar otimizações
performanceOptimizer.optimize();
performanceOptimizer.monitorCriticalMetrics();
```

### Environment Variables

#### Requeridas (Production)

```env
VITE_SUPABASE_URL=https://fgjypmlszuzkgvhuszxn.supabase.co
VITE_SUPABASE_ANON_KEY=<sua_anon_key>
VITE_PUBLIC_SITE_URL=https://app.assistjur.com
```

#### Opcionais

```env
VITE_SENTRY_DSN=<sentry_dsn_opcional>
VITE_MAINTENANCE=false
VITE_FEATURE_FLAGS_ENABLED=true
```

## 🎯 Production Checklist

### Build Quality

- [ ] `npm run build` - sem erros
- [ ] `npm run preview` - funcionando
- [ ] Lighthouse score 95+
- [ ] Bundle size otimizado

### Security

- [ ] Credentials seguros
- [ ] RLS policies ativas
- [ ] Input validation
- [ ] Error handling

### Performance

- [ ] Code splitting ativo
- [ ] Lazy loading configurado
- [ ] Service Worker funcionando
- [ ] Cache headers corretos

### Monitoring

- [ ] Logger estruturado
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Audit logging

---

_Para mais detalhes, consulte PRODUCTION_STATUS.md_
